import { buildSystemPrompt, getRegistryLLMSurface, PageRefineOutputSchema } from '@website-builder/shared';
import type { BlockSpec, SiteChrome, Sitemap } from '@website-builder/shared';
import { callLLM } from './callLLM';
import { fillImages } from './imageFiller';
import { createLogCollector } from './logCollector';
import type { ChatHistoryEntry, LLMTrace, LogEntry } from './types';
import { assembleSpec } from '../assembleSpec';
import { loadSitemap } from '../sites/pageOps';
import { setSiteChrome } from '../sites/setSiteChrome';

export const REFINE_HISTORY_MAX = 10;

export interface PageRefineArgs {
    siteIdentifier: string;
    pagePath: string;
    history: ChatHistoryEntry[];
    userMessage: string;
}

export interface PageRefineResult {
    theme?:       Record<string, string>;
    blocks:       BlockSpec[];
    chrome?:      SiteChrome;
    explanation?: string;
    log:          LogEntry[];
    trace:        LLMTrace | null;
}

/**
 * Page-scoped iterative refinement. Backend assembles the current page spec
 * from the DB (no stale data from the client), calls the LLM with page blocks
 * + locked chrome/sitemap context, and returns only the updated page blocks.
 */
export async function refineSpec(args: PageRefineArgs): Promise<PageRefineResult> {
    const collector = createLogCollector();
    const surface = getRegistryLLMSurface();

    collector.log('step', `Page-Refine für ${args.siteIdentifier}${args.pagePath}`);

    // Load current page spec from DB
    const fullSpec = await assembleSpec(args.siteIdentifier, args.pagePath);
    if (!fullSpec) {
        throw new Error(`Site/page not found: ${args.siteIdentifier}${args.pagePath}`);
    }

    // Load sitemap
    const sitemap = await loadSitemap(args.siteIdentifier);

    const systemInstruction = buildSystemPrompt({
        surface,
        mode: 'refine',
        locked: {
            chrome: fullSpec.chrome,
            sitemap: sitemap ?? undefined,
        },
    });

    const trimmedHistory = args.history.slice(-REFINE_HISTORY_MAX);
    const userPrompt = composePageRefineUserPrompt({
        currentPage: { theme: fullSpec.theme, blocks: fullSpec.blocks },
        locked: { chrome: fullSpec.chrome, sitemap: sitemap ?? undefined },
        history: trimmedHistory,
        userMessage: args.userMessage,
    });

    collector.log(
        'step',
        `Refinement-Turn — ${trimmedHistory.length} History-Turns, ${fullSpec.blocks.length} aktuelle Blocks`,
    );

    const core = await callLLM({
        userPrompt,
        systemInstruction,
        collector,
        surface,
    });

    if (core.kind !== 'ok') {
        return {
            blocks: fullSpec.blocks,
            log: collector.getLog(),
            trace: collector.getTrace(),
        };
    }

    // Parse with PageRefineOutputSchema to get {theme?, blocks, chrome?, _explanation?}
    let validated: { theme?: Record<string, string>; blocks: BlockSpec[]; chrome?: SiteChrome; _explanation?: string };
    try {
        const raw: unknown = JSON.parse(core.rawText);
        validated = PageRefineOutputSchema.parse(raw);
    } catch {
        // Fallback: use the spec from callLLM (already validated against SiteSpec schema)
        validated = { theme: core.spec.theme, blocks: core.spec.blocks };
    }

    try {
        await fillImages({ blocks: validated.blocks }, collector);
    } catch (err) {
        collector.log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${err instanceof Error ? err.message : String(err)} — Spec wird ohne neue Bilder ausgeliefert`,
        );
    }

    // If the LLM updated chrome, persist it to DB immediately.
    const outChrome = validated.chrome ?? fullSpec.chrome;
    if (validated.chrome) {
        try {
            await setSiteChrome(args.siteIdentifier, validated.chrome);
        } catch (err) {
            collector.log('warn', `Chrome-Persist fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return {
        theme:       validated.theme,
        blocks:      validated.blocks,
        chrome:      outChrome,
        explanation: validated._explanation,
        log:         collector.getLog(),
        trace:       collector.getTrace(),
    };
}

/**
 * Composes the user-turn prompt for page refinement.
 * Shows current page + locked chrome/sitemap context, then conversation history
 * and new user message.
 */
function composePageRefineUserPrompt(args: {
    currentPage: { theme?: Record<string, string>; blocks: BlockSpec[] };
    locked: { chrome?: SiteChrome; sitemap?: Sitemap };
    history: ChatHistoryEntry[];
    userMessage: string;
}): string {
    const historyLines =
        args.history.length === 0
            ? '(none)'
            : args.history
                  .map(
                      (h) =>
                          `<msg role="${h.role}">${escapeForTag(h.content)}</msg>`,
                  )
                  .join('\n\n');

    return [
        '# CURRENT PAGE',
        '```json',
        JSON.stringify(args.currentPage, null, 2),
        '```',
        '',
        '# LOCKED CONTEXT (do not modify)',
        'Site chrome (header/footer) and sitemap are shown for reference.',
        'Internal links in your output must point to sitemap paths.',
        '```json',
        JSON.stringify(args.locked, null, 2),
        '```',
        '',
        '# CONVERSATION',
        historyLines,
        '',
        '# USER MESSAGE',
        `<user_message>${escapeForTag(args.userMessage)}</user_message>`,
    ].join('\n');
}

function escapeForTag(s: string): string {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
