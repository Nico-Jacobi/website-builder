import type { GenerateResult } from './types';
import { clearLog, ingestLog, type LogEntry } from './logger';
import { clearTrace, setTrace, type LLMTrace } from './llmTrace';

const apiBase: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

/**
 * One-shot Spec-Generierung via Backend.
 *
 * Request:  POST {apiBase}/api/llm/generate
 * Response: Core-Result mit `kind`, payload, `log`, `trace` (siehe Backend).
 *
 * `log` + `trace` werden direkt nach dem Fetch in die Pub/Sub-Stores
 * (`logger.ts`, `llmTrace.ts`) geschrieben, damit das Debug-Panel
 * unverändert weiter funktioniert.
 */
export async function generateSpec(userPrompt: string): Promise<GenerateResult> {
    clearLog();
    clearTrace();

    let resp: Response;
    try {
        resp = await fetch(`${apiBase}/api/llm/generate`, {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify({ userPrompt }),
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

    return unpackResult(body) as GenerateResult;
}

/**
 * Splittet den Backend-HTTP-Response: dispatched `log`/`trace` in die lokalen
 * Pub/Sub-Stores und gibt den Rest als Public-Result-Shape zurück.
 * Exportiert, damit `refineSpec` die gleiche Logik wiederverwendet.
 */
export function unpackResult(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
        return { kind: 'api_error', message: 'unexpected backend response shape' };
    }
    const b = body as { log?: unknown; trace?: unknown } & Record<string, unknown>;

    if (Array.isArray(b.log)) {
        ingestLog(b.log as LogEntry[]);
    }
    if (b.trace && typeof b.trace === 'object') {
        setTrace(b.trace as LLMTrace);
    }

    const { log, trace, ...rest } = b;
    void log; void trace;

    console.groupCollapsed(`[LLM] ${String(rest.kind ?? 'result')}`);
    console.log('result:', rest);
    if (b.trace) console.log('trace:', b.trace);
    if (b.log) console.log('log:', b.log);
    console.groupEnd();

    return rest;
}
