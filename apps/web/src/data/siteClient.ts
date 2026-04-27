import type { BlockSpec, SiteSpec, Tone, SitemapEntry, SiteChrome, Sitemap } from '@website-builder/shared';
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

// --- Sites CRUD -----------------------------------------------------------

export interface CreateSiteInput {
    name:          string;
    initialPrompt: string;
}

export interface CreateSiteResult {
    id: string;
    identifier: string;
    name: string;
}

export async function createSite(input: CreateSiteInput): Promise<CreateSiteResult> {
    const resp = await fetch(`${apiBase}/api/sites`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(input),
    });
    await ensureOk(resp, 'createSite');
    return resp.json() as Promise<CreateSiteResult>;
}

export async function renameSite(identifier: string, name: string): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}`,
        {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name }),
        },
    );
    await ensureOk(resp, 'renameSite');
}

// --- Assets ---------------------------------------------------------------

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

// --- Block content patch --------------------------------------------------

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

// --- Block CRUD -----------------------------------------------------------

export interface AddBlockInput {
    identifier:     string;
    pagePath?:      string;
    parentBlockId?: string | null;
    position:       number;
    block:          BlockSpec;
}

export interface AddBlockResult {
    id:       string;
    position: number;
}

export async function addBlock(input: AddBlockInput): Promise<AddBlockResult> {
    const { identifier, ...body } = input;
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/blocks`,
        {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        },
    );
    await ensureOk(resp, 'addBlock');
    return resp.json() as Promise<AddBlockResult>;
}

export interface RemoveBlockInput {
    identifier: string;
    blockId:    string;
}

export async function removeBlock(input: RemoveBlockInput): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(input.identifier)}/blocks/${encodeURIComponent(input.blockId)}`,
        { method: 'DELETE' },
    );
    await ensureOk(resp, 'removeBlock');
}

export interface MoveBlockInput {
    identifier:        string;
    blockId:           string;
    newPosition:       number;
    newParentBlockId?: string | null;
}

export async function moveBlock(input: MoveBlockInput): Promise<void> {
    const body: Record<string, unknown> = { newPosition: input.newPosition };
    if (input.newParentBlockId !== undefined) {
        body['newParentBlockId'] = input.newParentBlockId;
    }
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(input.identifier)}/blocks/${encodeURIComponent(input.blockId)}/position`,
        {
            method:  'PATCH',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify(body),
        },
    );
    await ensureOk(resp, 'moveBlock');
}

export async function patchSiteTheme(
    identifier: string,
    theme: Record<string, string> | null,
): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/theme`,
        {
            method:  'PATCH',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify({ theme }),
        },
    );
    await ensureOk(resp, 'patchSiteTheme');
}

export interface PatchBlockToneInput {
    identifier: string;
    blockId:    string;
    tone:       Tone | null;
}

export async function patchBlockTone(input: PatchBlockToneInput): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(input.identifier)}/blocks/${encodeURIComponent(input.blockId)}/tone`,
        {
            method:  'PATCH',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify({ tone: input.tone }),
        },
    );
    await ensureOk(resp, 'patchBlockTone');
}

// --- Messages -------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageRow {
    id:        string;
    role:      MessageRole;
    content:   string;
    metadata:  Record<string, unknown> | null;
    createdAt: string;
}

export interface PostMessageInput {
    role:      MessageRole;
    content:   string;
    metadata?: Record<string, unknown> | null;
}

export async function listMessages(identifier: string): Promise<MessageRow[]> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/messages`,
    );
    await ensureOk(resp, 'listMessages');
    return resp.json() as Promise<MessageRow[]>;
}

export async function postMessage(
    identifier: string,
    input: PostMessageInput,
): Promise<MessageRow> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/messages`,
        {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify(input),
        },
    );
    await ensureOk(resp, 'postMessage');
    return resp.json() as Promise<MessageRow>;
}

// --- List / delete / fetch ------------------------------------------------

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

export interface SiteMeta {
    id:            string;
    identifier:    string;
    name:          string;
    theme:         Record<string, string> | null;
    initialPrompt: string | null;
    pages:         Array<{ path: string; metaDesc: string | null; published: boolean }>;
}

export async function fetchSiteMeta(identifier: string): Promise<SiteMeta> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}`,
    );
    await ensureOk(resp, 'fetchSiteMeta');
    return resp.json() as Promise<SiteMeta>;
}

// --- Generation meta (sitemap + pages-with-status + chrome) ---------------

export interface SiteGenerationMetaResponse {
    sitemap: Sitemap | null;
    chrome: SiteChrome | null;
    initialPrompt: string | null;
    pages: Array<{ path: string; status: string; metaDesc?: string }>;
}

export async function fetchSiteGenerationMeta(identifier: string): Promise<SiteGenerationMetaResponse> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}`,
    );
    await ensureOk(resp, 'fetchSiteGenerationMeta');
    return resp.json() as Promise<SiteGenerationMetaResponse>;
}

// --- Page management -------------------------------------------------------

export async function addPage(identifier: string, entry: SitemapEntry): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/pages`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(entry),
        },
    );
    await ensureOk(resp, 'addPage');
}

export async function deletePage(identifier: string, path: string): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/pages/${encodeURIComponent(path)}`,
        { method: 'DELETE' },
    );
    await ensureOk(resp, 'deletePage');
}

export async function regeneratePage(identifier: string, path: string): Promise<void> {
    const resp = await fetch(
        `${apiBase}/api/sites/${encodeURIComponent(identifier)}/pages/${encodeURIComponent(path)}/regenerate`,
        { method: 'POST' },
    );
    await ensureOk(resp, 'regeneratePage');
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
