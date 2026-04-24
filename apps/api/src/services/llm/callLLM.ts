import type { GoogleGenAI } from '@google/genai';
import { getClient } from './client';
import { buildSystemPrompt, getRegistryLLMSurface, validateSpecAgainstRegistry } from '@website-builder/shared';
import type { RegistryLLMSurface, SiteSpec, SpecError } from '@website-builder/shared';
import type { LogCollector } from './logCollector';

const MODEL = 'gemini-2.5-flash';

export interface CallLLMArgs {
    userPrompt: string;
    systemInstruction: string;
    collector: LogCollector;
    /** Injectable for tests. */
    client?: GoogleGenAI | null;
    /** Pre-computed registry surface; avoids recomputing across the two callers. */
    surface?: RegistryLLMSurface;
}

/**
 * Backend-internal core-result. `rawText` stays here — it's used by
 * `refineSpec` to pull out `_explanation` and never leaves the service
 * boundary (HTTP responses strip it).
 */
export type CoreResult =
    | { kind: 'ok';                spec: SiteSpec;                  rawText: string }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'safety_block';      message: string }
    | { kind: 'invalid_json';      message: string; rawText?: string };

export async function callLLM(args: CallLLMArgs): Promise<CoreResult> {
    const { collector } = args;
    const client = args.client !== undefined ? args.client : getClient();
    if (!client) {
        collector.log('error', 'Kein API-Client verfügbar (GOOGLE_API_KEY fehlt)');
        return { kind: 'missing_key' };
    }
    collector.log('ok', `Client bereit — Model: ${MODEL}`);

    // `surface` is accepted for symmetry with the callers (they pass a
    // pre-built surface through). The prompt itself is already constructed
    // by the caller via `buildSystemPrompt(surface)`, so we don't need to
    // touch `surface` here. Default-resolve so Options-Injection works
    // regardless of whether the caller supplied one.
    const _surface = args.surface ?? getRegistryLLMSurface();
    void _surface;

    collector.setTrace({
        systemPrompt: args.systemInstruction,
        userPrompt: args.userPrompt,
        rawResponse: null,
    });

    let response;
    try {
        collector.log('step', 'Gemini API-Call abgesetzt…');
        response = await client.models.generateContent({
            model: MODEL,
            contents: args.userPrompt,
            config: {
                systemInstruction: args.systemInstruction,
                responseMimeType: 'application/json',
            },
        });
        collector.log('ok', 'Antwort erhalten');
        collector.setTrace({
            systemPrompt: args.systemInstruction,
            userPrompt: args.userPrompt,
            rawResponse: response.text ?? null,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        collector.log('error', `API-Fehler: ${message}`);
        return { kind: 'api_error', message };
    }

    const text = response.text;
    if (typeof text !== 'string' || text.trim() === '') {
        collector.log('error', 'Response enthielt keinen Text (Safety-Filter)');
        return {
            kind: 'safety_block',
            message: 'Gemini lieferte keinen Text zurück — vermutlich vom Safety-Filter blockiert.',
        };
    }
    collector.log('info', `Response-Text: ${text.length} chars`);
    collector.log('info', text);

    let parsed: unknown;
    try {
        collector.log('step', 'JSON parsen…');
        parsed = JSON.parse(text);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        collector.log('error', `JSON-Parse fehlgeschlagen: ${message}`);
        return { kind: 'invalid_json', message: `Response was not valid JSON: ${message}`, rawText: text };
    }

    collector.log('step', 'Spec gegen Registry validieren…');
    const validated = validateSpecAgainstRegistry(parsed);
    if (!validated.ok) {
        collector.log('error', `Validierung fehlgeschlagen — ${validated.errors.length} Fehler`);
        for (const e of validated.errors) {
            collector.log('error', `  ${e.path || '(root)'}: ${e.message}`);
        }
        return { kind: 'validation_failed', errors: validated.errors, rawInput: parsed };
    }

    collector.log('ok', `Validierung OK — Spec mit ${validated.spec.blocks.length} Blocks fertig`);
    return { kind: 'ok', spec: validated.spec, rawText: text };
}
