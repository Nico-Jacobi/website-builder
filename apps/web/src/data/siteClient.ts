import type { SiteSpec } from '@website-builder/shared';
import { SiteSpecSchema } from '@website-builder/shared';

/**
 * Client to the website-builder API. Base URL is configurable via
 * VITE_API_BASE (default: http://localhost:3001).
 *
 * Phase 1 covers:
 *   - fetchSiteSpec: GET /api/sites/:slug/spec?path=/about
 *   - publishSpec:   POST /api/_seed — upsert a site + single page
 */

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

export interface PublishPayload {
    slug: string;
    name: string;
    path?: string;
    title: string;
    spec: SiteSpec;
}

export interface PublishResult {
    ok: true;
    slug: string;
    path: string;
    siteId: string;
    pageId: string;
    blockCount: number;
}

export async function publishSpec(payload: PublishPayload): Promise<PublishResult> {
    const resp = await fetch(`${apiBase}/api/_seed`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ path: '/', ...payload }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        const msg = (data as { error?: string }).error ?? `HTTP ${resp.status}`;
        throw new Error(`publish failed: ${msg}`);
    }
    return data as PublishResult;
}

export async function fetchSiteSpec(slug: string, path: string = '/'): Promise<SiteSpec> {
    const url = new URL(`${apiBase}/api/sites/${encodeURIComponent(slug)}/spec`);
    url.searchParams.set('path', path);
    const resp = await fetch(url);
    if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(
            `fetchSiteSpec failed: ${(data as { error?: string }).error ?? `HTTP ${resp.status}`}`,
        );
    }
    const raw = await resp.json();
    const parsed = SiteSpecSchema.safeParse(raw);
    if (!parsed.success) {
        throw new Error(`server returned an invalid SiteSpec: ${parsed.error.message}`);
    }
    return parsed.data;
}
