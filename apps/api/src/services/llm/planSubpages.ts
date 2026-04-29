import { buildSystemPrompt, getRegistryLLMSurface } from '@website-builder/shared';
import { ContentPlanOutputSchema } from '@website-builder/shared';
import type { BlockSpec, SiteChrome, Sitemap } from '@website-builder/shared';
import type { ContentPlan } from '@website-builder/shared';
import { getClient } from './client';
import { createLogCollector } from './logCollector';
import type { LogEntry } from './types';

const MODEL = 'gemini-2.5-flash';

export interface PlanSubpagesArgs {
    userPrompt: string;
    landingBlocks: BlockSpec[];
    sitemap: Sitemap;
    theme?: Record<string, string>;
    chrome: SiteChrome;
}

export interface PlanSubpagesResult {
    plan: ContentPlan | null;
    log: LogEntry[];
}

/** Extracts a minimal summary from a block for the planning prompt. */
function summariseBlock(block: BlockSpec): { type: string; heading?: string } {
    const p = block.props as Record<string, unknown>;
    const heading =
        (typeof p['heading'] === 'string' ? p['heading'] : undefined) ??
        (typeof p['title'] === 'string' ? p['title'] : undefined) ??
        (typeof p['overline'] === 'string' ? p['overline'] : undefined) ??
        (typeof p['subheading'] === 'string' ? p['subheading'] : undefined);
    return heading ? { type: block.type, heading } : { type: block.type };
}

export async function planSubpages(args: PlanSubpagesArgs): Promise<PlanSubpagesResult> {
    const { userPrompt: _userPrompt, landingBlocks, sitemap, theme, chrome: _chrome } = args;
    const collector = createLogCollector();
    collector.log('step', 'Phase A.5 — Subpage-Inhaltsplanung…');

    const client = getClient();
    if (!client) {
        collector.log('warn', 'Kein API-Client verfügbar — Phase A.5 übersprungen');
        return { plan: null, log: collector.getLog() };
    }

    const subpageCount = sitemap.filter(e => e.path !== '/').length;
    if (subpageCount === 0) {
        collector.log('ok', 'Keine Subpages in Sitemap — Phase A.5 übersprungen');
        return { plan: null, log: collector.getLog() };
    }

    const landingBlockSummaries = landingBlocks.map(summariseBlock);

    const surface = getRegistryLLMSurface();
    const systemInstruction = buildSystemPrompt({
        surface,
        mode: 'plan',
        locked: { sitemap, theme, landingBlocks: landingBlockSummaries },
    });
    collector.log('ok', `Plan-Prompt gebaut (${systemInstruction.length} chars)`);

    let responseText: string;
    try {
        collector.log('step', 'Gemini API-Call (Phase A.5) abgesetzt…');
        const response = await client.models.generateContent({
            model: MODEL,
            contents: 'Create the content plan for all subpages.',
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
        collector.log('warn', `API-Fehler in Phase A.5 — Fallback ohne Plan: ${message}`);
        return { plan: null, log: collector.getLog() };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(responseText);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        collector.log('warn', `JSON-Parse in Phase A.5 fehlgeschlagen — Fallback: ${message}`);
        return { plan: null, log: collector.getLog() };
    }

    const result = ContentPlanOutputSchema.safeParse(parsed);
    if (!result.success) {
        collector.log('warn', `ContentPlan-Validierung fehlgeschlagen — Fallback: ${result.error.message}`);
        return { plan: null, log: collector.getLog() };
    }

    collector.log('ok', `ContentPlan validiert — ${result.data.pages.length} Seiten geplant`);
    return { plan: result.data, log: collector.getLog() };
}
