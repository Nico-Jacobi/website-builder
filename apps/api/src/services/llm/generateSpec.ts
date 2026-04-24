import type { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, getRegistryLLMSurface } from '@website-builder/shared';
import type { RegistryLLMSurface } from '@website-builder/shared';
import { callLLM } from './callLLM';
import { fillImages } from './imageFiller';
import { createLogCollector } from './logCollector';
import type { GenerateCoreResult } from './types';

export interface GenerateSpecOptions {
    client?: GoogleGenAI | null;
    surface?: RegistryLLMSurface;
}

/**
 * One-shot Spec-Erstgenerierung. Baut den System-Prompt aus der shared
 * Registry, ruft Gemini via `callLLM`, füllt anschließend Pixabay-Bilder ein
 * und gibt das Core-Result mit eingesammeltem Log + Trace zurück.
 */
export async function generateSpec(
    userPrompt: string,
    options: GenerateSpecOptions = {},
): Promise<GenerateCoreResult> {
    const collector = createLogCollector();
    collector.log('step', `Prompt empfangen (${userPrompt.length} chars)`);

    const surface = options.surface ?? getRegistryLLMSurface();
    collector.log('info', `Registry-Surface: ${surface.modules.length} Module bekannt`);

    const systemInstruction = buildSystemPrompt({ surface, mode: 'initial' });
    collector.log('ok', `System-Prompt gebaut (${systemInstruction.length} chars)`);

    const core = await callLLM({
        userPrompt,
        systemInstruction,
        collector,
        client: 'client' in options ? options.client : undefined,
        surface,
    });

    if (core.kind !== 'ok') {
        const { ...rest } = core;
        return {
            ...rest,
            log: collector.getLog(),
            trace: collector.getTrace(),
        } as GenerateCoreResult;
    }

    try {
        await fillImages(core.spec, collector);
    } catch (err) {
        collector.log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${err instanceof Error ? err.message : String(err)} — Spec wird ohne neue Bilder ausgeliefert`,
        );
    }

    return {
        kind: 'ok',
        spec: core.spec,
        log: collector.getLog(),
        trace: collector.getTrace(),
    };
}
