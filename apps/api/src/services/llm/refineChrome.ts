import { buildSystemPrompt, getRegistryLLMSurface, ChromeRefineOutputSchema } from '@website-builder/shared';
import type { SiteChrome, Sitemap } from '@website-builder/shared';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { callLLM } from './callLLM';
import { fillImages } from './imageFiller';
import { createLogCollector } from './logCollector';
import type { ChatHistoryEntry, LLMTrace, LogEntry } from './types';

export interface ChromeRefineArgs {
    siteIdentifier: string;
    history: ChatHistoryEntry[];
    userMessage: string;
}

export interface ChromeRefineResult {
    chrome: SiteChrome;
    log: LogEntry[];
    trace: LLMTrace | null;
}

/**
 * Refines the site-level chrome (header and/or footer) in isolation.
 * Theme and sitemap are locked — output is only { chrome }.
 */
export async function refineChrome(args: ChromeRefineArgs): Promise<ChromeRefineResult> {
    const collector = createLogCollector();
    const surface = getRegistryLLMSurface();

    collector.log('step', `Chrome-Refine für ${args.siteIdentifier}`);

    const site = await db.query.sites.findFirst({
        where: eq(schema.sites.identifier, args.siteIdentifier),
    });

    if (!site) {
        throw new Error(`site not found: ${args.siteIdentifier}`);
    }
    if (!site.chrome) {
        throw new Error(`site not generated yet (chrome missing): ${args.siteIdentifier}`);
    }
    if (!site.sitemap) {
        throw new Error(`site not generated yet (sitemap missing): ${args.siteIdentifier}`);
    }

    const currentChrome = site.chrome as SiteChrome;
    const currentSitemap = site.sitemap as Sitemap;
    const currentTheme = (site.theme ?? undefined) as Record<string, string> | undefined;

    const systemInstruction = buildSystemPrompt({
        surface,
        mode: 'refine-chrome',
        locked: {
            theme: currentTheme,
            sitemap: currentSitemap,
        },
    });

    const trimmedHistory = args.history.slice(-10);
    const userPrompt = composeChromeRefineUserPrompt({
        currentChrome,
        locked: { theme: currentTheme, sitemap: currentSitemap },
        history: trimmedHistory,
        userMessage: args.userMessage,
    });

    collector.log(
        'step',
        `Chrome-Refinement-Turn — ${trimmedHistory.length} History-Turns`,
    );

    const core = await callLLM({
        userPrompt,
        systemInstruction,
        collector,
        surface,
    });

    if (core.kind !== 'ok') {
        throw new Error(`LLM call failed with kind: ${core.kind}`);
    }

    // Parse with ChromeRefineOutputSchema to get {chrome}
    let validated: { chrome: SiteChrome };
    try {
        const raw: unknown = JSON.parse(core.rawText);
        validated = ChromeRefineOutputSchema.parse(raw);
    } catch {
        // Last resort: return current chrome unchanged
        collector.log('warn', 'ChromeRefineOutputSchema parse failed — returning current chrome unchanged');
        return {
            chrome: currentChrome,
            log: collector.getLog(),
            trace: collector.getTrace(),
        };
    }

    // Fill images in chrome blocks (header + footer)
    try {
        const chromeBlocks = [
            ...(validated.chrome.header ? [validated.chrome.header] : []),
            ...(validated.chrome.footer ? [validated.chrome.footer] : []),
        ];
        if (chromeBlocks.length > 0) {
            await fillImages({ blocks: chromeBlocks }, collector);
        }
    } catch (err) {
        collector.log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${err instanceof Error ? err.message : String(err)} — Chrome wird ohne neue Bilder ausgeliefert`,
        );
    }

    return {
        chrome: validated.chrome,
        log: collector.getLog(),
        trace: collector.getTrace(),
    };
}

/**
 * Composes the user-turn prompt for chrome refinement.
 */
function composeChromeRefineUserPrompt(args: {
    currentChrome: SiteChrome;
    locked: { theme?: Record<string, string>; sitemap: Sitemap };
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
        '# CURRENT CHROME',
        '```json',
        JSON.stringify(args.currentChrome, null, 2),
        '```',
        '',
        '# LOCKED CONTEXT (do not modify)',
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
