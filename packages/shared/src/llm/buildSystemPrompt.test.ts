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

    it('includes sitemap output instructions', () => {
        expect(prompt).toContain('sitemap');
        expect(prompt).toContain('"path"');
        expect(prompt).toContain('"intent"');
    });

    it('instructs Header/Footer links to match sitemap paths (no dead hrefs)', () => {
        expect(prompt).toContain('MUST point to paths from your `sitemap` output');
        expect(prompt).not.toContain('dead hrefs');
    });

    it('is pure: identical surface yields identical output', () => {
        const a = buildSystemPrompt({ surface, mode: 'initial' });
        const b = buildSystemPrompt({ surface, mode: 'initial' });
        expect(a).toBe(b);
    });
});

describe('buildSystemPrompt (refine mode)', () => {
    const surface = getRegistryLLMSurface();
    const refinePrompt = buildSystemPrompt({ surface, mode: 'refine' });

    it('appends the Refinement Mode header', () => {
        expect(refinePrompt).toContain('## Refinement Mode');
    });

    it('mentions CURRENT PAGE, CONVERSATION and USER MESSAGE sections', () => {
        expect(refinePrompt).toContain('CURRENT PAGE');
        expect(refinePrompt).toContain('CONVERSATION');
        expect(refinePrompt).toContain('USER MESSAGE');
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

describe('buildSystemPrompt (subpage mode)', () => {
    const surface = getRegistryLLMSurface();

    const locked = {
        theme:   { primary: '#1e3a5f', secondary: '#0a0a0a' },
        chrome:  {
            header: { type: 'Header', props: { title: 'Acme Corp', links: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }] } },
            footer: { type: 'Footer', props: { copyright: '© 2026 Acme Corp', columns: [] } },
        },
        sitemap: [
            { path: '/',       title: 'Home',  intent: 'Landing page' },
            { path: '/about',  title: 'About', intent: 'Company history and team' },
        ],
        pageBrief: { path: '/about', title: 'About', intent: 'Company history and team' },
    };

    const subpagePrompt = buildSystemPrompt({ surface, mode: 'subpage', locked });

    it('includes the Subpage Generation Mode section', () => {
        expect(subpagePrompt).toContain('Subpage Generation Mode');
    });

    it('describes locked theme context', () => {
        expect(subpagePrompt).toContain('Locked site context');
        expect(subpagePrompt).toContain('Theme (locked)');
    });

    it('describes locked chrome context', () => {
        expect(subpagePrompt).toContain('Chrome');
        expect(subpagePrompt).toContain('header/footer');
    });

    it('describes locked sitemap context', () => {
        expect(subpagePrompt).toContain('Sitemap (locked)');
    });

    it('describes the page brief', () => {
        expect(subpagePrompt).toContain('Page brief');
        expect(subpagePrompt).toContain('/about');
    });

    it('instructs output to be only { blocks: [...] }', () => {
        expect(subpagePrompt).toContain('"blocks"');
        expect(subpagePrompt).toContain('no `theme`, no `chrome`, no `sitemap`');
    });

    it('does NOT include the Refinement Mode section', () => {
        expect(subpagePrompt).not.toContain('Refinement Mode');
    });

    it('is pure: same locked input yields same output', () => {
        const a = buildSystemPrompt({ surface, mode: 'subpage', locked });
        const b = buildSystemPrompt({ surface, mode: 'subpage', locked });
        expect(a).toBe(b);
    });
});
