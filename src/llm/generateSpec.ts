import type { GoogleGenAI } from '@google/genai';
import { getClient } from './client';
import { getRegistryLLMSurface } from '../builder/registry';
import { validateSpecAgainstRegistry } from '../builder/validateSpec';
import { buildSystemPrompt } from './buildSystemPrompt';
import { log } from './logger';
import { setTrace, clearTrace } from './llmTrace';
import { fillImages } from './imageFiller';
import type { GenerateResult } from './types';
import type { RegistryLLMSurface } from '../builder/types';

const MODEL = 'gemini-2.5-flash';

/**
 * Options allow injecting a mock client and/or surface in tests.
 * Production callers omit them entirely.
 */
export interface GenerateSpecOptions {
    client?: GoogleGenAI | null;
    surface?: RegistryLLMSurface;
}

/**
 * One-shot orchestrator: takes a user prompt, calls Gemini with the
 * registry-derived system instruction and a JSON-MIME-type constraint,
 * then validates the parsed response against the registry. Returns a
 * discriminated GenerateResult covering every expected outcome.
 *
 * Schreibt Zwischenschritte in den globalen Logger (src/llm/logger.ts),
 * damit die UI live mitverfolgen kann, woran es gerade hakt.
 */
export async function generateSpec(
    userPrompt: string,
    options: GenerateSpecOptions = {},
): Promise<GenerateResult> {
    log('step', `Prompt empfangen (${userPrompt.length} chars)`);
    clearTrace();

    const client = 'client' in options ? options.client : getClient();
    if (!client) {
        log('error', 'Kein API-Client verfügbar (VITE_GOOGLE_API_KEY fehlt)');
        return { kind: 'missing_key' };
    }
    log('ok', `Client bereit — Model: ${MODEL}`);

    const surface = options.surface ?? getRegistryLLMSurface();
    log('info', `Registry-Surface: ${surface.modules.length} Module bekannt`);

    const systemInstruction = buildSystemPrompt(surface);
    log('ok', `System-Prompt gebaut (${systemInstruction.length} chars)`);
    setTrace({ systemPrompt: systemInstruction, userPrompt, rawResponse: null });

    let response;
    try {
        log('step', 'Gemini API-Call abgesetzt…');
        response = await client.models.generateContent({
            model: MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
            },
        });
        log('ok', 'Antwort erhalten');
        setTrace({ systemPrompt: systemInstruction, userPrompt, rawResponse: response.text ?? null });
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

    try {
        await fillImages(validated.spec);
    } catch (err) {
        log('warn', `Bild-Filler fehlgeschlagen: ${extractErrorMessage(err)} — Spec wird ohne neue Bilder ausgeliefert`);
    }

    return { kind: 'ok', spec: validated.spec };
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
