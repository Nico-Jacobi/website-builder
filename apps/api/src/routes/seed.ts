import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { SiteSpecSchema } from '@website-builder/shared';
import { db, schema } from '../db/client';
import { splitSpec } from '../services/splitSpec';

const SeedBody = z.object({
    slug:  z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be lower-case, digits, or dashes'),
    name:  z.string().min(1),
    path:  z.string().default('/'),
    title: z.string(),
    spec:  SiteSpecSchema,
});

export const seedRouter = new Hono();

/**
 * Dev seed endpoint: upserts a site + one page + all its blocks + content.
 * Re-posting the same slug+path replaces the page's blocks in place.
 *
 * Body: { slug, name, path = "/", title, spec: SiteSpec }
 */
seedRouter.post('/', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }

    const parsed = SeedBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }
    const { slug, name, path, title, spec } = parsed.data;
    const split = splitSpec(spec);

    const result = await db.transaction(async (tx) => {
        let site = await tx.query.sites.findFirst({ where: eq(schema.sites.slug, slug) });
        if (!site) {
            const [inserted] = await tx
                .insert(schema.sites)
                .values({ slug, name, theme: split.theme })
                .returning();
            site = inserted!;
        } else {
            await tx
                .update(schema.sites)
                .set({ name, theme: split.theme })
                .where(eq(schema.sites.id, site.id));
        }

        let page = await tx.query.pages.findFirst({
            where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path)),
        });
        if (!page) {
            const [inserted] = await tx
                .insert(schema.pages)
                .values({ siteId: site.id, path, title, published: true })
                .returning();
            page = inserted!;
        } else {
            await tx
                .update(schema.pages)
                .set({ title, published: true })
                .where(eq(schema.pages.id, page.id));
            // Cascade deletes blocks + block_content + form_definitions.
            await tx.delete(schema.pageBlocks).where(eq(schema.pageBlocks.pageId, page.id));
        }

        // Insert blocks parent-first so parent_block_id FKs resolve via the temp-id map.
        const idByTemp = new Map<string, string>();
        for (const block of split.blocks) {
            const parentId = block.parentTempId ? idByTemp.get(block.parentTempId) ?? null : null;
            const [inserted] = await tx
                .insert(schema.pageBlocks)
                .values({
                    pageId:        page.id,
                    parentBlockId: parentId,
                    position:      block.position,
                    type:          block.type,
                    tone:          block.tone,
                    structProps:   block.structProps,
                })
                .returning({ id: schema.pageBlocks.id });
            const blockId = inserted!.id;
            idByTemp.set(block.tempId, blockId);

            if (block.content.length > 0) {
                await tx.insert(schema.blockContent).values(
                    block.content.map((c) => ({
                        blockId,
                        fieldPath: c.fieldPath,
                        valueType: c.valueType,
                        textValue: c.textValue,
                    })),
                );
            }
        }

        return { siteId: site.id, pageId: page.id, blockCount: split.blocks.length };
    });

    return c.json({ ok: true, slug, path, ...result });
});
