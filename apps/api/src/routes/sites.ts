import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { assembleSpec } from '../services/assembleSpec';
import { moduleContentFields } from '@website-builder/shared';

export const sitesRouter = new Hono();

/** List all sites. */
sitesRouter.get('/', async (c) => {
    const all = await db.query.sites.findMany({
        orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
    return c.json(all.map((s) => ({
        id: s.id,
        identifier: s.identifier,
        name: s.name,
        createdAt: s.createdAt,
    })));
});

/** Delete a site and all its pages/blocks (cascade). */
sitesRouter.delete('/:identifier', async (c) => {
    const identifier = c.req.param('identifier');
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);
    await db.delete(schema.sites).where(eq(schema.sites.identifier, identifier));
    return c.body(null, 204);
});

/** Site overview: meta + list of pages. */
sitesRouter.get('/:identifier', async (c) => {
    const identifier = c.req.param('identifier');
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);

    const pages = await db.query.pages.findMany({
        where: eq(schema.pages.siteId, site.id),
    });

    return c.json({
        id: site.id,
        identifier: site.identifier,
        name: site.name,
        theme: site.theme ?? null,
        pages: pages.map((p) => ({
            path: p.path,
            metaDesc: p.metaDesc,
            published: p.published,
        })),
    });
});

/**
 * Full SiteSpec for a given page. Path is passed as a query param so URL
 * parsing doesn't fight with Hono's router for multi-segment paths like
 * "/products/coffee".
 *
 *   GET /api/sites/acme/spec?path=/about
 */
sitesRouter.get('/:identifier/spec', async (c) => {
    const identifier = c.req.param('identifier');
    const path = c.req.query('path') ?? '/';
    const spec = await assembleSpec(identifier, path);
    if (!spec) return c.json({ error: 'site or page not found' }, 404);
    return c.json(spec);
});

sitesRouter.patch('/:identifier/blocks/:blockId/content', async (c) => {
    const identifier = c.req.param('identifier');
    const blockId = c.req.param('blockId');

    const body = await c.req.json<{ fieldPath: string; value: string | null }>();
    if (!body.fieldPath) {
        return c.json({ error: 'fieldPath is required' }, 400);
    }

    const block = await db.query.pageBlocks.findFirst({
        where: eq(schema.pageBlocks.id, blockId),
    });
    if (!block) return c.json({ error: 'block not found' }, 404);

    const page = await db.query.pages.findFirst({
        where: eq(schema.pages.id, block.pageId),
    });
    if (!page) return c.json({ error: 'page not found' }, 404);

    const site = await db.query.sites.findFirst({
        where: and(
            eq(schema.sites.id, page.siteId),
            eq(schema.sites.identifier, identifier),
        ),
    });
    if (!site) return c.json({ error: 'block does not belong to this site' }, 403);

    const fields = moduleContentFields[block.type];
    if (!fields) return c.json({ error: `unknown module type: ${block.type}` }, 400);

    const wildcardPath = body.fieldPath.replace(/\[\d+\]/g, '[]');
    const fieldDef = fields.find((f) => f.path === wildcardPath);
    if (!fieldDef) {
        return c.json(
            { error: `invalid fieldPath "${body.fieldPath}" for module type "${block.type}"` },
            400,
        );
    }

    await db
        .insert(schema.blockContent)
        .values({
            blockId,
            fieldPath: body.fieldPath,
            valueType: fieldDef.type,
            textValue: body.value,
        })
        .onConflictDoUpdate({
            target: [schema.blockContent.blockId, schema.blockContent.fieldPath],
            set: {
                valueType: fieldDef.type,
                textValue: body.value,
            },
        });

    return c.body(null, 204);
});

const MIME_EXT: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

sitesRouter.post('/:identifier/assets', async (c) => {
    const identifier = c.req.param('identifier');
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);

    const body = await c.req.parseBody();
    const file = body['file'];
    if (!(file instanceof File)) {
        return c.json({ error: 'missing file field' }, 400);
    }

    const ext = MIME_EXT[file.type];
    if (!ext) {
        return c.json(
            { error: `unsupported mime type: ${file.type}. Allowed: png, jpeg, webp` },
            400,
        );
    }

    if (file.size > MAX_SIZE) {
        return c.json(
            { error: `file too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max: 10 MB` },
            400,
        );
    }

    const assetId = randomUUID();
    const relPath = `uploads/${site.id}/${assetId}.${ext}`;
    const absDir = join(process.cwd(), 'uploads', site.id);

    await mkdir(absDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(absDir, `${assetId}.${ext}`), buffer);

    const [row] = await db
        .insert(schema.assets)
        .values({
            id: assetId,
            siteId: site.id,
            storageKey: relPath,
            mime: file.type,
            source: 'upload',
        })
        .returning({ id: schema.assets.id });

    return c.json({ id: row.id, url: `/${relPath}` }, 201);
});
