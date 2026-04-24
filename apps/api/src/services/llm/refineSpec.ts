import type { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, getRegistryLLMSurface } from '@website-builder/shared';
import type { RegistryLLMSurface, SiteSpec } from '@website-builder/shared';
import { callLLM } from './callLLM';
import { fillImages } from './imageFiller';
import { createLogCollector } from './logCollector';
import type { ChatHistoryEntry, RefineCoreResult } from './types';

export const REFINE_HISTORY_MAX = 10;

export interface RefineArgs {
    currentSpec: SiteSpec;
    history: ChatHistoryEntry[];
    userMessage: string;
    client?: GoogleGenAI | null;
    surface?: RegistryLLMSurface;
}

/**
 * Iteratives Refinement. Sendet den aktuellen Spec + die letzten History-Turns
 * + die neue User-Message an Gemini und erwartet einen komplett neuen Spec
 * zurück (mit `id` für weiter bestehende Blocks). Extrahiert `_explanation`
 * aus dem rohen JSON und liefert es als separates Feld.
 */
export async function refineSpec(args: RefineArgs): Promise<RefineCoreResult> {
    const collector = createLogCollector();
    const surface = args.surface ?? getRegistryLLMSurface();
    const systemInstruction = buildSystemPrompt({ surface, mode: 'refine' });

    const trimmedHistory = args.history.slice(-REFINE_HISTORY_MAX);
    const userPrompt = composeRefineUserPrompt(
        args.currentSpec,
        trimmedHistory,
        args.userMessage,
    );

    collector.log(
        'step',
        `Refinement-Turn — ${trimmedHistory.length} History-Turns, ${args.currentSpec.blocks.length} aktuelle Blocks`,
    );

    const core = await callLLM({
        userPrompt,
        systemInstruction,
        collector,
        client: 'client' in args ? args.client : undefined,
        surface,
    });

    if (core.kind !== 'ok') {
        return {
            ...core,
            log: collector.getLog(),
            trace: collector.getTrace(),
        } as RefineCoreResult;
    }

    try {
        await fillImages(core.spec, collector);
    } catch (err) {
        collector.log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${err instanceof Error ? err.message : String(err)} — Spec wird ohne neue Bilder ausgeliefert`,
        );
    }

    const explanation = extractExplanation(core.rawText);

    return {
        kind: 'ok',
        nextSpec: core.spec,
        explanation,
        log: collector.getLog(),
        trace: collector.getTrace(),
    };
}

/**
 * Baut den User-Turn-Body für Gemini. Struktur: drei klar gelabelte Sektionen
 * (CURRENT_SPEC, HISTORY, USER_MESSAGE). User-Content wird in `<msg>` /
 * `<user_message>` getaggt und `<` escaped — verhindert Prompt-Injection durch
 * History-Inhalte oder User-Eingaben.
 */
export function composeRefineUserPrompt(
    currentSpec: SiteSpec,
    history: ChatHistoryEntry[],
    userMessage: string,
): string {
    const historyLines =
        history.length === 0
            ? '(none)'
            : history
                  .map(
                      (h) =>
                          `<msg role="${h.role}">${escapeForTag(h.content)}</msg>`,
                  )
                  .join('\n\n');

    return [
        'CURRENT_SPEC:',
        JSON.stringify(currentSpec, null, 2),
        '',
        'HISTORY:',
        historyLines,
        '',
        'USER_MESSAGE:',
        `<user_message>${escapeForTag(userMessage)}</user_message>`,
    ].join('\n');
}

function escapeForTag(s: string): string {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractExplanation(rawText: string): string {
    try {
        const parsed: unknown = JSON.parse(rawText);
        if (
            parsed &&
            typeof parsed === 'object' &&
            typeof (parsed as { _explanation?: unknown })._explanation === 'string'
        ) {
            return (parsed as { _explanation: string })._explanation;
        }
    } catch {
        // callLLM has already parsed rawText successfully — defensive only.
    }
    return '';
}
