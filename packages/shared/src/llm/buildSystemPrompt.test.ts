import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './buildSystemPrompt';
import { getRegistryLLMSurface } from './registrySurface';

describe('buildSystemPrompt (initial mode)', () => {
    const surface = getRegistryLLMSurface();
    const prompt = buildSystemPrompt({ surface, mode: 'initial' });

    it('contains every registered module name', () => {
        const expectedNames = [
            'Header',
            'HeroBanner',
            'Container',
            'Footer',
            'TextBlock',
            'MediaText',
            'CardRow',
            'CardGrid',
            'Spotlight',
            'Testimonial',
            'StatRow',
            'ImageBlock',
            'Gallery',
            'LogoStrip',
            'FeatureGrid',
            'CTABand',
        ];
        for (const name of expectedNames) {
            expect(prompt).toContain(`\`${name}\``);
        }
    });

    it('embeds the siteSpecJSONSchema with a blocks property', () => {
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
            'gradient_hero',
            'border_subtle',
            'surface_elevated',
        ];
        for (const key of themeKeys) {
            expect(prompt).toContain(`\`${key}\``);
        }
    });

    it('contains the single-JSON-object instruction', () => {
        expect(prompt).toContain('single JSON object');
    });

    it('does NOT include the Refinement Mode section', () => {
        expect(prompt).not.toContain('Refinement Mode');
    });

    it('is pure: identical surface yields identical output', () => {
        const a = buildSystemPrompt({ surface, mode: 'initial' });
        const b = buildSystemPrompt({ surface, mode: 'initial' });
        expect(a).toBe(b);
    });
});

describe('buildSystemPrompt (refine mode)', () => {
    const surface = getRegistryLLMSurface();
    const initialPrompt = buildSystemPrompt({ surface, mode: 'initial' });
    const refinePrompt = buildSystemPrompt({ surface, mode: 'refine' });

    it('starts with the full initial prompt (initial is a prefix of refine)', () => {
        expect(refinePrompt.startsWith(initialPrompt)).toBe(true);
    });

    it('appends the Refinement Mode header', () => {
        expect(refinePrompt).toContain('## Refinement Mode');
    });

    it('mentions CURRENT_SPEC, HISTORY and USER_MESSAGE sections', () => {
        expect(refinePrompt).toContain('CURRENT_SPEC');
        expect(refinePrompt).toContain('HISTORY');
        expect(refinePrompt).toContain('USER_MESSAGE');
    });

    it('tells the model to preserve block ids for persisting blocks', () => {
        expect(refinePrompt).toMatch(/id.*persist|persist.*id/i);
    });

    it('tells the model to omit removed blocks', () => {
        expect(refinePrompt).toMatch(/omit/i);
    });

    it('is pure: identical inputs yield identical output', () => {
        const a = buildSystemPrompt({ surface, mode: 'refine' });
        const b = buildSystemPrompt({ surface, mode: 'refine' });
        expect(a).toBe(b);
    });
});
