import type { GoogleGenAI } from '@google/genai';
import { getClient } from './client';
import { getRegistryLLMSurface } from '../builder/registry';
import { validateSpecAgainstRegistry } from '../builder/validateSpec';
import { log } from './logger';
import { setTrace } from './llmTrace';
import type { CoreResult } from './types';
import type { RegistryLLMSurface } from '../builder/types';

const MODEL = 'gemini-2.5-flash';

/**
 * Arguments for a single raw LLM invocation.
 *
 * - `userPrompt`      — user-facing body. Goes into `contents`.
 * - `systemInstruction` — system-level instruction (cacheable by Gemini).
 * - `client`          — optional pre-built client for tests.
 *                       If omitted, falls back to the lazy singleton.
 * - `surface`         — registry surface used for validation. Optional;
 *                       default = `getRegistryLLMSurface()`. Accepted only
 *                       so callers avoid recomputing it; it is currently
 *                       not passed into the prompt from here (callers do
 *                       that via `buildSystemPrompt`).
 */
export interface CallLLMArgs {
    userPrompt: string;
    systemInstruction: string;
    client?: GoogleGenAI | null;
    surface?: RegistryLLMSurface;
}

/**
 * Internal core helper shared by `generateSpec` (initial one-shot) and
 * `refineSpec` (follow-up turn).
 *
 * Responsibilities:
 *   1. Resolve / short-circuit on the Gemini client.
 *   2. Push prompt + raw response into the shared trace (so the Debug
 *      panel can see what happened).
 *   3. Invoke `models.generateContent` with `responseMimeType: json`.
 *   4. Parse the response text as JSON.
 *   5. Validate against the registry.
 *
 * Does NOT call `clearTrace()` — the editor caller clears per-site, not
 * per-turn. Does NOT call `fillImages()` — that is initial-flow-only.
 */
export async function callLLM(args: CallLLMArgs): Promise<CoreResult> {
    const client = 'client' in args ? args.client : getClient();
    if (!client) {
        log('error', 'Kein API-Client verfügbar (VITE_GOOGLE_API_KEY fehlt)');
        return { kind: 'missing_key' };
    }
    log('ok', `Client bereit — Model: ${MODEL}`);

    // Surface may be used by future prompt-building flows; accepted for
    // symmetry with the caller signatures. Default-resolve so the value
    // is stable even if unused here.
    const _surface = args.surface ?? getRegistryLLMSurface();
    void _surface;

    setTrace({
        systemPrompt: args.systemInstruction,
        userPrompt: args.userPrompt,
        rawResponse: null,
    });

    let response;
    try {
        log('step', 'Gemini API-Call abgesetzt…');
        response = await client.models.generateContent({
            model: MODEL,
            contents: args.userPrompt,
            config: {
                systemInstruction: args.systemInstruction,
                responseMimeType: 'application/json',
            },
        });
        log('ok', 'Antwort erhalten');
        setTrace({
            systemPrompt: args.systemInstruction,
            userPrompt: args.userPrompt,
            rawResponse: response.text ?? null,
        });
    } catch (err) {
        const message = extractErrorMessage(err);
        log('error', `API-Fehler: ${message}`);
        return { kind: 'api_error', message };
    }

    const text = response.text;
    if (typeof text !== 'string' || text.trim() === '') {
        log('error', 'Response enthielt keinen Text (Safety-Filter?)');
        return {
            kind: 'invalid_json',
            message: 'Gemini response contained no text (possibly blocked by safety filter).',
        };
    }
    log('info', `Response-Text: ${text.length} chars`);
    log('info', text);

    let parsed: unknown;
    try {
        log('step', 'JSON parsen…');
        parsed = JSON.parse(text);
        log('ok', `JSON OK — ${describeBlocks(parsed)}`);
    } catch (err) {
        const message = extractErrorMessage(err);
        log('error', `JSON-Parse fehlgeschlagen: ${message}`);
        return {
            kind: 'invalid_json',
            message: `Response was not valid JSON: ${message}`,
            rawText: text,
        };
    }

    log('step', 'Spec gegen Registry validieren…');
    const validated = validateSpecAgainstRegistry(parsed);
    if (!validated.ok) {
        log('error', `Validierung fehlgeschlagen — ${validated.errors.length} Fehler`);
        for (const e of validated.errors) {
            log('error', `  ${e.path || '(root)'}: ${e.message}`);
        }
        return {
            kind: 'validation_failed',
            errors: validated.errors,
            rawInput: parsed,
        };
    }

    log('ok', `Validierung OK — Spec mit ${validated.spec.blocks.length} Blocks fertig`);
    return { kind: 'ok', spec: validated.spec, rawText: text };
}

function describeBlocks(parsed: unknown): string {
    if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { blocks?: unknown }).blocks)
    ) {
        return `${(parsed as { blocks: unknown[] }).blocks.length} Blocks`;
    }
    return 'unbekannte Struktur';
}

function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}
