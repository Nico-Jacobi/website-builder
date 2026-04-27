import { and, eq, inArray } from 'drizzle-orm';
import type { BlockSpec } from '@website-builder/shared';
import { db, schema } from '../../db/client';
import type { DbTransaction } from './pageOps';

type SiteRow = typeof schema.sites.$inferSelect;

/**
 * Lazy-Backfill für bestehende Single-Page-Sites ohne chrome.
 *
 * Wenn site.chrome null ist, wird Header (erster Block) und Footer (letzter
 * Block) aus den landingBlocks extrahiert, in sites.chrome persistiert und aus
 * pageBlocks entfernt. Anschließend werden alle Pages dieser Site auf
 * status='ready' gesetzt.
 *
 * Wenn site.chrome bereits gesetzt ist, ist dieser Aufruf ein No-op.
 */
export async function backfillChromeIfNeeded(
    siteRow: SiteRow,
    landingBlocks: BlockSpec[],
): Promise<{
    chrome: { header?: BlockSpec; footer?: BlockSpec };
    contentBlocks: BlockSpec[];
}> {
    if (siteRow.chrome) {
        return { chrome: siteRow.chrome, contentBlocks: landingBlocks };
    }

    const header =
        landingBlocks[0]?.type === 'Header' ? landingBlocks[0] : undefined;
    const footer =
        landingBlocks.at(-1)?.type === 'Footer' ? landingBlocks.at(-1) : undefined;
    const contentBlocks = landingBlocks.filter((b) => b !== header && b !== footer);
    const chrome: { header?: BlockSpec; footer?: BlockSpec } = { header, footer };

    await db.transaction(async (tx) => {
        await tx
            .update(schema.sites)
            .set({ chrome })
            .where(eq(schema.sites.id, siteRow.id));

        await removeChromeBlocksFromPage(tx, siteRow.id, '/', header, footer);

        // Mark all existing pages of this site as ready (they are content-complete).
        await tx
            .update(schema.pages)
            .set({ status: 'ready' })
            .where(eq(schema.pages.siteId, siteRow.id));
    });

    return { chrome, contentBlocks };
}

/**
 * Entfernt Header- und/oder Footer-Blocks aus pageBlocks der angegebenen Page.
 * Sucht nach Blocks mit den entsprechenden IDs (aus den BlockSpec.id-Feldern).
 */
async function removeChromeBlocksFromPage(
    tx: DbTransaction,
    siteId: string,
    pagePath: string,
    header: BlockSpec | undefined,
    footer: BlockSpec | undefined,
): Promise<void> {
    const page = await tx.query.pages.findFirst({
        where: (p, { and: andFn, eq: eqFn }) =>
            andFn(eqFn(p.siteId, siteId), eqFn(p.path, pagePath)),
        columns: { id: true },
    });
    if (!page) return;

    const idsToRemove: string[] = [];
    if (header?.id) idsToRemove.push(header.id);
    if (footer?.id) idsToRemove.push(footer.id);

    if (idsToRemove.length === 0) {
        // Fallback: remove by type if no IDs available.
        const typeFilter: string[] = [];
        if (header) typeFilter.push('Header');
        if (footer) typeFilter.push('Footer');

        if (typeFilter.length > 0) {
            const rows = await tx.query.pageBlocks.findMany({
                where: (b, { and: andFn, eq: eqFn, inArray: inArrayFn }) =>
                    andFn(eqFn(b.pageId, page.id), inArrayFn(b.type, typeFilter)),
                columns: { id: true },
            });
            for (const row of rows) {
                await tx
                    .delete(schema.pageBlocks)
                    .where(eq(schema.pageBlocks.id, row.id));
            }
        }
        return;
    }

    await tx
        .delete(schema.pageBlocks)
        .where(
            and(
                eq(schema.pageBlocks.pageId, page.id),
                inArray(schema.pageBlocks.id, idsToRemove),
            ),
        );
}
