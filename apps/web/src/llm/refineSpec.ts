import type { GoogleGenAI } from '@google/genai';
import { getRegistryLLMSurface } from '../builder/registry';
import { buildSystemPrompt } from './buildSystemPrompt';
import { callLLM } from './callLLM';
import { log } from './logger';
import type { SiteSpec } from '../builder/schemas';
import type { ChatHistoryEntry, RefineResult } from './types';
import type { RegistryLLMSurface } from '../builder/types';

/**
 * Maximum number of history turns sent back to the LLM on each refine.
 * Trimming from the tail keeps the prompt size bounded for long chats;
 * 10 is enough context for most iterative edits.
 */
export const REFINE_HISTORY_MAX = 10;

export interface RefineArgs {
    currentSpec: SiteSpec;
    history: ChatHistoryEntry[];
    userMessage: string;
    client?: GoogleGenAI | null;
    surface?: RegistryLLMSurface;
}

/**
 * Iterative follow-up to {@link generateSpec}. Sends the current spec,
 * the recent chat history and the new user message to Gemini and expects
 * back a complete new spec (with block `id` fields preserved for
 * persisting blocks — see `buildSystemPrompt({mode:'refine'})`).
 *
 * The diff between `currentSpec` and `nextSpec` is computed downstream
 * by the patch-ops engine (Plan 03). This function only produces the
 * proposed next state.
 */
export async function refineSpec(args: RefineArgs): Promise<RefineResult> {
    const surface = args.surface ?? getRegistryLLMSurface();
    const systemInstruction = buildSystemPrompt({ surface, mode: 'refine' });

    const trimmedHistory = args.history.slice(-REFINE_HISTORY_MAX);
    const userPrompt = composeRefineUserPrompt(
        args.currentSpec,
        trimmedHistory,
        args.userMessage,
    );

    log(
        'step',
        `Refinement-Turn — ${trimmedHistory.length} History-Turns, ${args.currentSpec.blocks.length} aktuelle Blocks`,
    );

    const core = await callLLM({
        userPrompt,
        systemInstruction,
        client: 'client' in args ? args.client : undefined,
        surface,
    });

    if (core.kind !== 'ok') {
        return core;
    }

    // Extract optional `_explanation` from the raw response JSON. Zod's
    // SiteSpecSchema is non-strict, so the field silently dropped out of
    // `core.spec`; we go back to the rawText to see if the model sent one.
    const explanation = extractExplanation(core.rawText);

    return {
        kind: 'ok',
        nextSpec: core.spec,
        explanation,
    };
}

/**
 * Builds the user-turn body sent to Gemini for a refinement.
 *
 * Structure is three clearly-labelled sections; matches the labels the
 * system prompt's Refinement-Mode rules reference.
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
                  .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
                  .join('\n\n');

    return [
        'CURRENT_SPEC:',
        JSON.stringify(currentSpec, null, 2),
        '',
        'HISTORY:',
        historyLines,
        '',
        'USER_MESSAGE:',
        userMessage,
    ].join('\n');
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
        // rawText already parsed successfully once inside callLLM, so
        // this catch is defensive only.
    }
    return '';
}
