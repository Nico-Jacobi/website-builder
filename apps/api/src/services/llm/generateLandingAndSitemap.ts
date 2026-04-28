import { buildSystemPrompt, getRegistryLLMSurface } from '@website-builder/shared';
import { LandingOutputSchema } from '@website-builder/shared';
import type { BlockSpec, SiteChrome, Sitemap } from '@website-builder/shared';
import { getClient } from './client';
import { fillImagesIn } from './imageFiller';
import { createLogCollector } from './logCollector';
import type { LogEntry } from './types';

const MODEL = 'gemini-2.5-flash';

export interface LandingAndSitemapResult {
    theme?: Record<string, string>;
    chrome: SiteChrome;
    landingBlocks: BlockSpec[];
    sitemap: Sitemap;
    log: LogEntry[];
}

export async function generateLandingAndSitemap(
    userPrompt: string,
): Promise<LandingAndSitemapResult> {
    const collector = createLogCollector();
    collector.log('step', `Phase A — Landing+Sitemap generieren (${userPrompt.length} chars)`);

    const client = getClient();
    if (!client) {
        collector.log('error', 'Kein API-Client verfügbar (GOOGLE_API_KEY fehlt)');
        throw new Error('missing_key: GOOGLE_API_KEY not set');
    }

    const surface = getRegistryLLMSurface();
    const systemInstruction = buildSystemPrompt({ surface, mode: 'initial' });
    collector.log('ok', `System-Prompt gebaut (${systemInstruction.length} chars)`);

    let responseText: string;
    try {
        collector.log('step', 'Gemini API-Call (Phase A) abgesetzt…');
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

    const validated = LandingOutputSchema.parse(parsed);
    collector.log(
        'ok',
        `LandingOutput validiert — ${validated.blocks.length} Blocks, ${validated.sitemap.length} Sitemap-Einträge`,
    );

    // Prefer explicit chrome field (LLM used the chrome key directly).
    // Fall back to extracting Header/Footer from the blocks array.
    let chrome: SiteChrome;
    let contentBlocks: BlockSpec[];
    if (validated.chrome?.header || validated.chrome?.footer) {
        chrome = validated.chrome;
        contentBlocks = validated.blocks.filter(
            (b) => b.type !== 'Header' && b.type !== 'Footer',
        );
    } else {
        ({ chrome, contentBlocks } = extractChrome(validated.blocks));
    }

    try {
        await fillImagesIn({ chrome, blocks: contentBlocks }, collector);
    } catch (err) {
        collector.log(
            'warn',
            `Bild-Filler fehlgeschlagen: ${err instanceof Error ? err.message : String(err)} — Spec wird ohne neue Bilder ausgeliefert`,
        );
    }

    return {
        theme: validated.theme,
        chrome,
        landingBlocks: contentBlocks,
        sitemap: validated.sitemap,
        log: collector.getLog(),
    };
}

function extractChrome(
    blocks: BlockSpec[],
): { chrome: SiteChrome; contentBlocks: BlockSpec[] } {
    const header = blocks[0]?.type === 'Header' ? blocks[0] : undefined;
    const footer = blocks.at(-1)?.type === 'Footer' ? blocks.at(-1) : undefined;
    const contentBlocks = blocks.filter((b) => b !== header && b !== footer);
    return { chrome: { header, footer }, contentBlocks };
}
