import type { SiteSpec, SiteChrome } from '@website-builder/shared';
import type { ChatHistoryEntry, RefineResult } from './types';
import { clearLog } from './logger';
import { clearTrace } from './llmTrace';
import { unpackResult } from './generateSpec';

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Legacy interface — kept for compatibility until all callers are migrated.
// ---------------------------------------------------------------------------

/** @deprecated Use PageRefineArgs instead. */
export interface RefineArgs {
    currentSpec: SiteSpec;
    history:     ChatHistoryEntry[];
    userMessage: string;
}

// ---------------------------------------------------------------------------
// New multi-page interfaces
// ---------------------------------------------------------------------------

export interface PageRefineArgs {
    siteIdentifier: string;
    pagePath:       string;
    history:        ChatHistoryEntry[];
    userMessage:    string;
}

export interface ChromeRefineArgs {
    siteIdentifier: string;
    history:        ChatHistoryEntry[];
    userMessage:    string;
}

// ---------------------------------------------------------------------------
// refineSpec — page-scoped refinement
// ---------------------------------------------------------------------------

/**
 * Refinement-Turn via Backend.
 *
 * Accepts either the new PageRefineArgs (multi-page) or the legacy RefineArgs
 * shape. When called with PageRefineArgs, sends `{siteIdentifier, pagePath,
 * history, userMessage}` to the backend. When called with the old shape, sends
 * `{currentSpec, history, userMessage}` for backwards compatibility.
 */
export async function refineSpec(args: PageRefineArgs | RefineArgs): Promise<RefineResult> {
    clearLog();
    clearTrace();

    let resp: Response;
    try {
        resp = await fetch(`${apiBase}/api/llm/refine`, {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify(args),
        });
    } catch (err) {
        return { kind: 'api_error', message: err instanceof Error ? err.message : String(err) };
    }

    if (!resp.ok) {
        const msg = await resp.text().catch(() => `HTTP ${resp.status}`);
        return { kind: 'api_error', message: `Backend HTTP ${resp.status}: ${msg.slice(0, 500)}` };
    }

    let body: unknown;
    try {
        body = await resp.json();
    } catch (err) {
        return { kind: 'api_error', message: `invalid backend JSON: ${err instanceof Error ? err.message : String(err)}` };
    }

    return unpackResult(body) as RefineResult;
}

// ---------------------------------------------------------------------------
// refineChrome — chrome (header/footer) refinement
// ---------------------------------------------------------------------------

export interface ChromeRefineResult {
    chrome: SiteChrome;
}

/**
 * Chrome-Refinement-Turn via Backend.
 *
 * Sends `{siteIdentifier, history, userMessage}` to `/api/llm/refine-chrome`.
 * Returns `{chrome}` with the updated header/footer blocks.
 */
export async function refineChrome(args: ChromeRefineArgs): Promise<ChromeRefineResult> {
    const resp = await fetch(`${apiBase}/api/llm/refine-chrome`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(args),
    });

    if (!resp.ok) {
        const msg = await resp.text().catch(() => `HTTP ${resp.status}`);
        throw new Error(`refine-chrome failed: ${resp.status} — ${msg.slice(0, 500)}`);
    }

    return resp.json() as Promise<ChromeRefineResult>;
}
