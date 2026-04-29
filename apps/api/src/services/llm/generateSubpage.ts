import { buildSystemPrompt, getRegistryLLMSurface } from '@website-builder/shared';
import { SubpageOutputSchema } from '@website-builder/shared';
import { findSitemapEntry } from '@website-builder/shared';
import type { BlockSpec, SiteChrome, Sitemap, SitemapEntry } from '@website-builder/shared';
import type { ContentPlanEntry } from '@website-builder/shared';
import { db } from '../../db/client';
import { getClient } from './client';
import { fillBlocksArray } from './imageFiller';
import { createLogCollector } from './logCollector';
import type { LogEntry } from './types';
import { getPageId, replacePageBlocks, setPageStatus } from '../sites/pageOps';

const MODEL = 'gemini-2.5-flash';

export interface GenerateSubpageArgs {
    userPrompt: string;
    theme?: Record<string, string>;
    chrome: SiteChrome;
    sitemap: Sitemap;
    pageBrief: SitemapEntry;
    contentPlan?: ContentPlanEntry;
}

export interface GenerateSubpageResult {
    blocks: BlockSpec[];
    log: LogEntry[];
}

export async function generateSubpage(args: GenerateSubpageArgs): Promise<GenerateSubpageResult> {
    const { userPrompt, theme, chrome, sitemap, pageBrief, contentPlan } = args;
    const collector = createLogCollector();
    collector.log(
        'step',
        `Phase B — Subpage generieren: ${pageBrief.path} (${pageBrief.title})`,
    );

    const client = getClient();
    if (!client) {
        collector.log('error', 'Kein API-Client verfügbar (GOOGLE_API_KEY fehlt)');
        throw new Error('missing_key: GOOGLE_API_KEY not set');
    }

    const surface = getRegistryLLMSurface();
    const systemInstruction = buildSystemPrompt({
        surface,
        mode: 'subpage',
        locked: { theme, chrome, sitemap, pageBrief, contentPlan },
    });
    collector.log('ok', `System-Prompt gebaut (${systemInstruction.length} chars)`);

    let responseText: string;
    try {
        collector.log('step', `Gemini API-Call für Subpage ${pageBrief.path}…`);
        const response = await client.models.generateContent({
            model: MODEL,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
            },
        });
        const text = response.text;
        if (typeof text !== 'string' || text.trim() === '') {
            throw new Error('safety_block: Gemini lieferte keinen Text zurück');
        }
        responseText = text;
        collector.log('ok', `Antwort erhalten (${responseText.length} chars)`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        collector.log('error', `API-Fehler: ${message}`);
        throw new Error(`api_error: ${message}`);
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(responseText);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        collector.log('error', `JSON-Parse fehlgeschlagen: ${message}`);
        throw new Error(`invalid_json: ${message}`);
    }

    const validated = SubpageOutputSchema.parse(parsed);
    collector.log('ok', `SubpageOutput validiert — ${validated.blocks.length} Blocks`);

    try {
        await fillBlocksArray(validated.blocks, collector);
    } catch (err) {
        collector.log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${err instanceof Error ? err.message : String(err)} — Blocks ohne Bilder`,
        );
    }

    return {
        blocks: validated.blocks,
        log: collector.getLog(),
    };
}

/**
 * Regenerates a single subpage that previously failed or needs refresh.
 * Loads site context from DB, then runs generateSubpage and persists the result.
 * Usable without an active generation job (e.g. after server restart).
 */
export async function regenerateSubpage(identifier: string, pagePath: string): Promise<void> {
    const site = await db.query.sites.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.identifier, identifier),
    });
    if (!site?.sitemap || !site?.chrome) {
        throw new Error('site not generated yet — sitemap or chrome missing');
    }

    const sitemap = site.sitemap as Sitemap;
    const chrome = site.chrome as SiteChrome;
    const theme = site.theme ?? undefined;

    const entry = findSitemapEntry(sitemap, pagePath);
    if (!entry) throw new Error(`no sitemap entry for ${pagePath}`);

    // Import lazily to avoid circular dependency (generationJob imports generateSubpage)
    const { getJob, createOnlySubpageJob } = await import('../generationJob');
    const job = getJob(identifier) ?? createOnlySubpageJob(identifier);

    const pageId = await getPageId(identifier, pagePath);

    await setPageStatus(pageId, 'generating');
    job.events.emit('event', { type: 'subpage_started', path: pagePath });

    try {
        const result = await generateSubpage({
            userPrompt: site.initialPrompt ?? '',
            theme,
            chrome,
            sitemap,
            pageBrief: entry,
        });
        await replacePageBlocks(identifier, pagePath, result.blocks);
        await setPageStatus(pageId, 'ready');
        job.events.emit('event', { type: 'subpage_done', path: pagePath });
    } catch (error) {
        await setPageStatus(pageId, 'failed');
        job.events.emit('event', {
            type: 'subpage_failed',
            path: pagePath,
            reason: String(error),
        });
        throw error;
    }
}
