import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono, type Context } from 'hono';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { BlockSpecSchema, moduleContentFields } from '@website-builder/shared';
import { db, schema } from '../db/client';
import { assembleSpec } from '../services/assembleSpec';
import { createSite } from '../services/sites/createSite';
import {
    ALLOWED_TONES,
    BlockOpFailure,
    addBlock,
    moveBlock,
    patchTone,
    removeBlock,
} from '../services/sites/blockOps';
import { appendMessage, listMessages } from '../services/sites/messages';

export const sitesRouter = new Hono();

const CreateSiteBody = z.object({
    name: z.string().trim().min(1).max(200),
});

/** Create a new draft site (empty spec + default page "/"). */
sitesRouter.post('/', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = CreateSiteBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    const site = await createSite({ name: parsed.data.name });
    return c.json(site, 201);
});

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

const RenameSiteBody = z.object({
    name: z.string().trim().min(1).max(200),
});

/** Rename a site. */
sitesRouter.patch('/:identifier', async (c) => {
    const identifier = c.req.param('identifier');
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = RenameSiteBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);

    await db
        .update(schema.sites)
        .set({ name: parsed.data.name })
        .where(eq(schema.sites.id, site.id));

    return c.body(null, 204);
});

/** Delete a site and all its pages/blocks/messages (cascade). */
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

// --- Block CRUD ------------------------------------------------------------

const AddBlockBody = z.object({
    pagePath:       z.string().optional(),
    parentBlockId:  z.string().uuid().nullable().optional(),
    position:       z.number().int().nonnegative(),
    block:          BlockSpecSchema,
});

sitesRouter.post('/:identifier/blocks', async (c) => {
    const identifier = c.req.param('identifier');
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = AddBlockBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    try {
        const result = await addBlock({
            identifier,
            pagePath:      parsed.data.pagePath,
            parentBlockId: parsed.data.parentBlockId ?? null,
            position:      parsed.data.position,
            block:         parsed.data.block,
        });
        return c.json(result, 201);
    } catch (err) {
        return blockOpErrorResponse(c, err);
    }
});

sitesRouter.delete('/:identifier/blocks/:blockId', async (c) => {
    const identifier = c.req.param('identifier');
    const blockId = c.req.param('blockId');

    try {
        await removeBlock({ identifier, blockId });
        return c.body(null, 204);
    } catch (err) {
        return blockOpErrorResponse(c, err);
    }
});

const MoveBlockBody = z.object({
    newPosition:       z.number().int().nonnegative(),
    newParentBlockId:  z.string().uuid().nullable().optional(),
});

sitesRouter.patch('/:identifier/blocks/:blockId/position', async (c) => {
    const identifier = c.req.param('identifier');
    const blockId = c.req.param('blockId');
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = MoveBlockBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    try {
        await moveBlock({
            identifier,
            blockId,
            newPosition:      parsed.data.newPosition,
            newParentBlockId: parsed.data.newParentBlockId,
        });
        return c.body(null, 204);
    } catch (err) {
        return blockOpErrorResponse(c, err);
    }
});

const ToneBody = z.object({
    tone: z.enum(['surface', 'muted', 'primary', 'dark', 'accent']).nullable(),
});

sitesRouter.patch('/:identifier/blocks/:blockId/tone', async (c) => {
    const identifier = c.req.param('identifier');
    const blockId = c.req.param('blockId');
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = ToneBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    try {
        await patchTone({
            identifier,
            blockId,
            tone: parsed.data.tone,
        });
        return c.body(null, 204);
    } catch (err) {
        return blockOpErrorResponse(c, err);
    }
});

// --- Block content patch (existing) ---------------------------------------

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

// --- Messages -------------------------------------------------------------

const PostMessageBody = z.object({
    role:     z.enum(['user', 'assistant', 'system']),
    content:  z.string().min(1).max(50_000),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

sitesRouter.get('/:identifier/messages', async (c) => {
    const identifier = c.req.param('identifier');
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);

    const messages = await listMessages(site.id);
    return c.json(messages);
});

sitesRouter.post('/:identifier/messages', async (c) => {
    const identifier = c.req.param('identifier');
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, identifier),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);

    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = PostMessageBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    const row = await appendMessage(site.id, {
        role:     parsed.data.role,
        content:  parsed.data.content,
        metadata: parsed.data.metadata ?? null,
    });
    return c.json(row, 201);
});

// --- Assets (existing) ----------------------------------------------------

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

// --- Helpers --------------------------------------------------------------

function blockOpErrorResponse(c: Context, err: unknown) {
    if (err instanceof BlockOpFailure) {
        switch (err.detail.kind) {
            case 'site_not_found':     return c.json({ error: 'site not found' }, 404);
            case 'page_not_found':     return c.json({ error: 'page not found' }, 404);
            case 'block_not_found':    return c.json({ error: 'block not found' }, 404);
            case 'block_not_in_site':  return c.json({ error: 'block does not belong to this site' }, 403);
            case 'parent_not_in_page': return c.json({ error: 'parent block does not belong to this page' }, 400);
            case 'unknown_type':       return c.json({ error: `unknown module type: ${err.detail.type}` }, 400);
            case 'invalid_position':   return c.json({ error: 'invalid position' }, 400);
        }
    }
    throw err;
}

// Re-export a typed helper for tests.
export { ALLOWED_TONES };
