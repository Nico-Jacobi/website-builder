import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { assembleSpec } from '../services/assembleSpec';

export const sitesRouter = new Hono();

/** Site overview: meta + list of pages. */
sitesRouter.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.slug, slug),
    });
    if (!site) return c.json({ error: 'site not found' }, 404);

    const pages = await db.query.pages.findMany({
        where: eq(schema.pages.siteId, site.id),
    });

    return c.json({
        id: site.id,
        slug: site.slug,
        name: site.name,
        theme: site.theme ?? null,
        pages: pages.map((p) => ({
            path: p.path,
            title: p.title,
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
sitesRouter.get('/:slug/spec', async (c) => {
    const slug = c.req.param('slug');
    const path = c.req.query('path') ?? '/';
    const spec = await assembleSpec(slug, path);
    if (!spec) return c.json({ error: 'site or page not found' }, 404);
    return c.json(spec);
});
