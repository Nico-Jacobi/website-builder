import type { ChatHistoryEntry, RefineResult } from './types';
import { clearLog } from './logger';
import { clearTrace } from './llmTrace';
import { unpackResult } from './generateSpec';

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

export interface PageRefineArgs {
    siteIdentifier: string;
    pagePath:       string;
    history:        ChatHistoryEntry[];
    userMessage:    string;
}

export async function refineSpec(args: PageRefineArgs): Promise<RefineResult> {
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
