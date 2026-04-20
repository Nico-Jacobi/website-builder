import type { GoogleGenAI } from '@google/genai';
import { getRegistryLLMSurface } from '../builder/registry';
import { buildSystemPrompt } from './buildSystemPrompt';
import { callLLM } from './callLLM';
import { log } from './logger';
import { fillImages } from './imageFiller';
import type { GenerateResult } from './types';
import type { RegistryLLMSurface } from '../builder/types';

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
 * Shares the low-level client + parse + validate logic with
 * `refineSpec()` through the internal `callLLM()` helper.
 *
 * Schreibt Zwischenschritte in den globalen Logger (src/llm/logger.ts),
 * damit die UI live mitverfolgen kann, woran es gerade hakt. `clearTrace`
 * und `clearLog` werden NICHT hier aufgerufen — das macht der Editor-
 * Einstieg pro Site-Wechsel, damit Trace/Log über mehrere Refinement-
 * Turns sichtbar bleiben.
 */
export async function generateSpec(
    userPrompt: string,
    options: GenerateSpecOptions = {},
): Promise<GenerateResult> {
    log('step', `Prompt empfangen (${userPrompt.length} chars)`);

    const surface = options.surface ?? getRegistryLLMSurface();
    log('info', `Registry-Surface: ${surface.modules.length} Module bekannt`);

    const systemInstruction = buildSystemPrompt({ surface, mode: 'initial' });
    log('ok', `System-Prompt gebaut (${systemInstruction.length} chars)`);

    const core = await callLLM({
        userPrompt,
        systemInstruction,
        client: 'client' in options ? options.client : undefined,
        surface,
    });

    if (core.kind !== 'ok') {
        return core;
    }

    try {
        await fillImages(core.spec);
    } catch (err) {
        log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${extractErrorMessage(err)} — Spec wird ohne neue Bilder ausgeliefert`,
        );
    }

    return { kind: 'ok', spec: core.spec };
}

function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}
