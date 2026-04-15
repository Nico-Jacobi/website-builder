import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './buildSystemPrompt';
import { getRegistryLLMSurface } from '../builder/registry';

describe('buildSystemPrompt', () => {
    const surface = getRegistryLLMSurface();
    const prompt = buildSystemPrompt(surface);

    it('contains every registered module name', () => {
        const expectedNames = [
            'Header',
            'HeroBanner',
            'Container',
            'Footer',
            'FooterSimple',
            'TextBlock',
            'MediaText',
            'CardRow',
            'Callout',
            'StatRow',
            'CardGrid',
            'ImageBlock',
            'Gallery',
        ];
        for (const name of expectedNames) {
            expect(prompt).toContain(`\`${name}\``);
        }
    });

    it('embeds the siteSpecJSONSchema with a blocks property', () => {
        // The rendered JSON schema must end up in the prompt verbatim.
        expect(prompt).toContain('"blocks"');
        expect(prompt).toContain(JSON.stringify(surface.siteSpecJSONSchema, null, 2));
    });

    it('lists every recognised theme token key', () => {
        const themeKeys = [
            'primary',
            'secondary',
            'accent',
            'alt_primary',
            'alt_secondary',
            'background',
            'surface',
            'text',
            'muted_text',
            'inverted_text',
        ];
        for (const key of themeKeys) {
            expect(prompt).toContain(`\`${key}\``);
        }
    });

    it('contains the single-JSON-object instruction', () => {
        expect(prompt).toContain('single JSON object');
    });

    it('is pure: identical surface yields identical output', () => {
        const a = buildSystemPrompt(surface);
        const b = buildSystemPrompt(surface);
        expect(a).toBe(b);
    });
});
