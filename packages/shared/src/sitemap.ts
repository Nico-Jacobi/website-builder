import { z } from 'zod';

export const SITEMAP_PATH_REGEX = /^\/[a-z0-9\-\/]*$/;

export const SitemapEntrySchema = z.object({
    path:   z.string().regex(SITEMAP_PATH_REGEX),
    title:  z.string().min(1),
    intent: z.string().min(1),
});
export type SitemapEntry = z.infer<typeof SitemapEntrySchema>;

export const SitemapSchema = z.array(SitemapEntrySchema)
    .refine(s => s.some(e => e.path === '/'), { message: 'Sitemap must include "/"' })
    .refine(s => new Set(s.map(e => e.path)).size === s.length, { message: 'Duplicate paths' });
export type Sitemap = z.infer<typeof SitemapSchema>;

export function findSitemapEntry(sitemap: Sitemap, path: string): SitemapEntry | undefined {
    return sitemap.find(e => e.path === path);
}

export function isInternalPath(href: string, sitemap: Sitemap): boolean {
    return SITEMAP_PATH_REGEX.test(href) && sitemap.some(e => e.path === href);
}
