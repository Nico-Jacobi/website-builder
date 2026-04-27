import { and, eq } from 'drizzle-orm';
import type { BlockSpec } from '@website-builder/shared';
import { db, schema } from '../../db/client';

export const PAGE_STATUSES = ['pending', 'generating', 'ready', 'failed'] as const;
export type PageStatus = typeof PAGE_STATUSES[number];

/** Either a top-level db handle or an active transaction. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Setzt den Status einer Page anhand ihrer UUID. */
export async function setPageStatus(pageId: string, status: PageStatus): Promise<void> {
    await db
        .update(schema.pages)
        .set({ status })
        .where(eq(schema.pages.id, pageId));
}

/** Gibt alle Pages einer Site mit Pfad+Status zurück. */
export async function getSitePagesWithStatus(
    identifier: string,
): Promise<Array<{ path: string; status: PageStatus; metaDesc?: string }>> {
    const site = await db.query.sites.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.identifier, identifier),
    });
    if (!site) throw new Error(`site not found: ${identifier}`);

    const rows = await db.query.pages.findMany({
        where: (p, { eq: eqFn }) => eqFn(p.siteId, site.id),
        columns: { path: true, status: true, metaDesc: true },
    });

    return rows.map((r) => ({
        path: r.path,
        status: r.status as PageStatus,
        metaDesc: r.metaDesc ?? undefined,
    }));
}

/** Gibt die UUID einer Page zurück (nötig für setPageStatus in generationJob). */
export async function getPageId(identifier: string, pagePath: string): Promise<string> {
    const site = await db.query.sites.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.identifier, identifier),
        columns: { id: true },
    });
    if (!site) throw new Error(`site not found: ${identifier}`);

    const row = await db.query.pages.findFirst({
        where: (p, { and: andFn, eq: eqFn }) =>
            andFn(eqFn(p.siteId, site.id), eqFn(p.path, pagePath)),
        columns: { id: true },
    });
    if (!row) throw new Error(`page not found: ${identifier}${pagePath}`);
    return row.id;
}

/** Fügt eine Page-Row ein (idempotent via onConflictDoNothing). */
export async function insertPage(
    tx: DbTransaction,
    siteId: string,
    entry: { path: string; title: string; intent: string },
    status: PageStatus,
): Promise<void> {
    await tx
        .insert(schema.pages)
        .values({
            siteId,
            path: entry.path,
            metaDesc: entry.intent,
            status,
        })
        .onConflictDoNothing();
}

/** Ersetzt alle Blocks einer Page (löscht alte, schreibt neue). Öffnet eigene Transaktion. */
export async function replacePageBlocks(
    identifier: string,
    pagePath: string,
    blocks: BlockSpec[],
): Promise<void> {
    await db.transaction(async (tx) => {
        await replacePageBlocksTx(tx, identifier, pagePath, blocks);
    });
}

/** Transaktionale Variante für Callers die bereits in einer Tx sind. */
export async function replacePageBlocksTx(
    tx: DbTransaction,
    identifier: string,
    pagePath: string,
    blocks: BlockSpec[],
): Promise<void> {
    // Resolve siteId from identifier within the transaction context.
    const site = await tx.query.sites.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.identifier, identifier),
        columns: { id: true },
    });
    if (!site) throw new Error(`site not found: ${identifier}`);

    const page = await tx.query.pages.findFirst({
        where: (p, { and: andFn, eq: eqFn }) =>
            andFn(eqFn(p.siteId, site.id), eqFn(p.path, pagePath)),
        columns: { id: true },
    });
    if (!page) throw new Error(`page not found: ${identifier}${pagePath}`);

    await tx
        .delete(schema.pageBlocks)
        .where(eq(schema.pageBlocks.pageId, page.id));

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]!;
        const props: Record<string, unknown> = { ...(block.props ?? {}) };
        if ('children' in props) delete props['children'];

        await tx.insert(schema.pageBlocks).values({
            pageId:      page.id,
            position:    i,
            type:        block.type,
            tone:        block.tone ?? null,
            structProps: props,
        });
    }
}

/** Lädt die Sitemap einer Site (null wenn noch nicht generiert). */
export async function loadSitemap(
    identifier: string,
): Promise<Array<{ path: string; title: string; intent: string }> | null> {
    const site = await db.query.sites.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.identifier, identifier),
        columns: { sitemap: true },
    });
    return site?.sitemap ?? null;
}

/** Überschreibt die Sitemap einer Site. */
export async function updateSitemap(
    identifier: string,
    sitemap: Array<{ path: string; title: string; intent: string }>,
): Promise<void> {
    await db
        .update(schema.sites)
        .set({ sitemap })
        .where(eq(schema.sites.identifier, identifier));
}

/** Löscht eine Page-Row (und alle zugehörigen Blocks via Cascade). */
export async function deletePage(siteId: string, pagePath: string): Promise<void> {
    await db
        .delete(schema.pages)
        .where(and(eq(schema.pages.siteId, siteId), eq(schema.pages.path, pagePath)));
}
