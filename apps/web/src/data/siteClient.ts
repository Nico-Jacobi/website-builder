import type { SiteSpec } from '@website-builder/shared';
import { SiteSpecSchema } from '@website-builder/shared';

/**
 * Client to the website-builder API. Base URL is configurable via
 * VITE_API_BASE (default: http://localhost:3001).
 */

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

async function ensureOk(resp: Response, label: string): Promise<void> {
    if (resp.ok) return;
    const data = await resp.json().catch(() => ({}));
    const msg = (data as { error?: string }).error ?? `HTTP ${resp.status}`;
    throw new Error(`${label} failed: ${msg}`);
}

export interface PublishPayload {
    identifier: string;
    name: string;
    path?: string;
    spec: SiteSpec;
}

export interface PublishResult {
    ok: true;
    identifier: string;
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
    await ensureOk(resp, 'publish');
    return resp.json() as Promise<PublishResult>;
}

export async function uploadAsset(
    identifier: string,
    file: File,
): Promise<{ id: string; url: string }> {
    const form = new FormData();
    form.append('file', file);
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/assets`,
        { method: 'POST', body: form },
    );
    await ensureOk(resp, 'uploadAsset');
    return resp.json() as Promise<{ id: string; url: string }>;
}

export async function patchBlockContent(
    identifier: string,
    blockId: string,
    fieldPath: string,
    value: string | null,
): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/blocks/${encodeURIComponent(blockId)}/content`,
        {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ fieldPath, value }),
        },
    );
    await ensureOk(resp, 'patchBlockContent');
}

export interface SiteListItem {
    id: string;
    identifier: string;
    name: string;
    createdAt: string;
}

export async function listSites(): Promise<SiteListItem[]> {
    const resp = await fetch(`${apiBase}/api/sites`);
    await ensureOk(resp, 'listSites');
    return resp.json() as Promise<SiteListItem[]>;
}

export async function deleteSite(identifier: string): Promise<void> {
    const resp = await fetch(`${apiBase}/api/sites/${encodeURIComponent(identifier)}`, {
        method: 'DELETE',
    });
    await ensureOk(resp, 'deleteSite');
}

export async function fetchSiteSpec(identifier: string, path: string = '/'): Promise<SiteSpec> {
    const url = new URL(`${apiBase}/api/sites/${encodeURIComponent(identifier)}/spec`);
    url.searchParams.set('path', path);
    const resp = await fetch(url);
    await ensureOk(resp, 'fetchSiteSpec');
    const raw = await resp.json();
    const parsed = SiteSpecSchema.safeParse(raw);
    if (!parsed.success) {
        throw new Error(`server returned an invalid SiteSpec: ${parsed.error.message}`);
    }
    return parsed.data;
}
