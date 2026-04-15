import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Renderer from './Renderer';
import { EditModeProvider } from './EditModeContext';
import { listModules, getModule } from './registry';
import { specFromTypes } from './specHelpers';
import type { SiteSpec } from './schemas';

// ---------------------------------------------------------------------------
// Helper: wraps the Renderer in EditModeProvider so edit-mode hooks work.
// ---------------------------------------------------------------------------
function renderSpec(spec: SiteSpec) {
    return render(
        <EditModeProvider spec={spec} onSpecChange={() => {}}>
            <Renderer spec={spec} />
        </EditModeProvider>,
    );
}

// ---------------------------------------------------------------------------
// Renderer integration tests
// ---------------------------------------------------------------------------
describe('Renderer', () => {
    // 1. Empty spec
    it('renders an empty div.vertical_layout when spec has no blocks', () => {
        const spec: SiteSpec = { blocks: [] };
        const { container } = renderSpec(spec);

        const root = container.querySelector('.vertical_layout');
        expect(root).toBeInTheDocument();
        expect(root!.children).toHaveLength(0);
    });

    // 2. Single block
    it('renders a single TextBlock with its body text visible', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'tb1',
                    type: 'TextBlock',
                    props: { body: 'Hello from TextBlock' },
                },
            ],
        };
        renderSpec(spec);

        expect(screen.getByText('Hello from TextBlock')).toBeInTheDocument();
    });

    // 3. Multiple blocks in order
    it('renders Header, TextBlock, and FooterSimple content in order', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'h1',
                    type: 'Header',
                    props: { title: 'Site Title' },
                },
                {
                    id: 'tb1',
                    type: 'TextBlock',
                    props: { body: 'Main content paragraph' },
                },
                {
                    id: 'fs1',
                    type: 'FooterSimple',
                    props: { tagline: 'Footer tagline' },
                },
            ],
        };
        renderSpec(spec);

        expect(screen.getByText('Site Title')).toBeInTheDocument();
        expect(screen.getByText('Main content paragraph')).toBeInTheDocument();
        expect(screen.getByText('Footer tagline')).toBeInTheDocument();
    });

    // 4. Unknown module type
    it('shows error placeholder for unknown module types', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'u1',
                    type: 'NonExistentWidget',
                    props: {},
                },
            ],
        };
        renderSpec(spec);

        expect(
            screen.getByText('Unknown module "NonExistentWidget"'),
        ).toBeInTheDocument();
    });

    // 5. Invalid props
    it('shows error placeholder when props fail schema validation', () => {
        // TextBlock requires `body: string`, so omitting it should fail.
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'bad1',
                    type: 'TextBlock',
                    props: { heading: 'No body provided' },
                },
            ],
        };
        renderSpec(spec);

        expect(
            screen.getByText('Invalid props for "TextBlock"'),
        ).toBeInTheDocument();
    });

    // 6. Theme application — single variable
    it('applies spec.theme as CSS custom properties on root div', () => {
        const spec: SiteSpec = {
            theme: { primary: '#ff0' },
            blocks: [],
        };
        const { container } = renderSpec(spec);

        const root = container.querySelector('.vertical_layout');
        expect(root).toHaveStyle('--primary: #ff0');
    });

    // 7. Multiple theme variables
    it('applies multiple theme variables to root div', () => {
        const spec: SiteSpec = {
            theme: {
                primary: '#ff0',
                secondary: '#0ff',
                background: '#111',
            },
            blocks: [],
        };
        const { container } = renderSpec(spec);

        const root = container.querySelector('.vertical_layout');
        expect(root).toHaveStyle('--primary: #ff0');
        expect(root).toHaveStyle('--secondary: #0ff');
        expect(root).toHaveStyle('--background: #111');
    });

    // 8. No theme — no inline style
    it('does not set inline style when theme is absent', () => {
        const spec: SiteSpec = { blocks: [] };
        const { container } = renderSpec(spec);

        const root = container.querySelector('.vertical_layout');
        // When theme is undefined, themeToCssVars returns undefined, so no
        // style attribute should be present on the root div.
        expect(root!.getAttribute('style')).toBeNull();
    });

    // 9. Container with nested children
    it('renders nested children inside a Container module', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'c1',
                    type: 'Container',
                    props: {
                        children: [
                            {
                                type: 'TextBlock',
                                props: { body: 'Nested child text' },
                            },
                            {
                                type: 'TextBlock',
                                props: { body: 'Second nested child' },
                            },
                        ],
                    },
                },
            ],
        };
        renderSpec(spec);

        expect(screen.getByText('Nested child text')).toBeInTheDocument();
        expect(screen.getByText('Second nested child')).toBeInTheDocument();
    });

    // 10. Block IDs used as keys — blocks with and without IDs both render
    it('renders blocks whether they have an explicit id or not', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'explicit-id-1',
                    type: 'TextBlock',
                    props: { body: 'Block with ID' },
                },
                {
                    type: 'TextBlock',
                    props: { body: 'Block without ID' },
                },
            ],
        };
        renderSpec(spec);

        expect(screen.getByText('Block with ID')).toBeInTheDocument();
        expect(screen.getByText('Block without ID')).toBeInTheDocument();
    });

    // 11. Mixed valid and invalid blocks
    it('renders valid blocks normally and shows errors for invalid ones without affecting others', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'ok1',
                    type: 'TextBlock',
                    props: { body: 'Valid block first' },
                },
                {
                    id: 'bad1',
                    type: 'FakeModule',
                    props: {},
                },
                {
                    id: 'ok2',
                    type: 'TextBlock',
                    props: { body: 'Valid block third' },
                },
                {
                    id: 'bad2',
                    type: 'TextBlock',
                    props: { /* missing required body */ },
                },
                {
                    id: 'ok3',
                    type: 'TextBlock',
                    props: { body: 'Valid block fifth' },
                },
            ],
        };
        const { container } = renderSpec(spec);

        // Valid blocks render their content
        expect(screen.getByText('Valid block first')).toBeInTheDocument();
        expect(screen.getByText('Valid block third')).toBeInTheDocument();
        expect(screen.getByText('Valid block fifth')).toBeInTheDocument();

        // Invalid blocks render error placeholders
        expect(
            screen.getByText('Unknown module "FakeModule"'),
        ).toBeInTheDocument();
        // Scope assertion to this render's container to avoid false matches
        // from earlier test renders still present in the document.
        const errorStrongs = container.querySelectorAll('.builder__error strong');
        const errorTexts = [...errorStrongs].map((el) => el.textContent);
        expect(errorTexts).toContain('Invalid props for "TextBlock"');
    });

    // 12. All 13 registered modules render with defaults (no error placeholders)
    describe('all registered modules render with defaults', () => {
        const allModules = listModules();

        it.each(allModules.map((m) => [m.meta.name] as const))(
            '%s renders without error placeholders',
            (name) => {
                const mod = getModule(name)!;
                const spec: SiteSpec = {
                    blocks: [
                        {
                            id: `test-${name}`,
                            type: name,
                            props: { ...(mod.defaults as object) },
                        },
                    ],
                };
                const { container } = renderSpec(spec);

                // No error placeholders should appear
                const errors = container.querySelectorAll('.builder__error');
                expect(errors).toHaveLength(0);
            },
        );

        it('has exactly 13 modules registered', () => {
            expect(allModules).toHaveLength(13);
        });
    });

    // Edge case: Container with an unknown nested child shows error inline
    it('shows error placeholder for unknown nested children in Container', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'c1',
                    type: 'Container',
                    props: {
                        children: [
                            {
                                type: 'TextBlock',
                                props: { body: 'Valid nested block' },
                            },
                            {
                                type: 'Bogus',
                                props: {},
                            },
                        ],
                    },
                },
            ],
        };
        renderSpec(spec);

        expect(screen.getByText('Valid nested block')).toBeInTheDocument();
        expect(screen.getByText('Unknown module "Bogus"')).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// specHelpers tests
// ---------------------------------------------------------------------------
describe('specFromTypes', () => {
    // 13. Valid types
    it('returns a spec with the correct number of blocks for valid types', () => {
        const spec = specFromTypes(['Header', 'TextBlock', 'FooterSimple']);

        expect(spec.blocks).toHaveLength(3);
        expect(spec.blocks[0].type).toBe('Header');
        expect(spec.blocks[1].type).toBe('TextBlock');
        expect(spec.blocks[2].type).toBe('FooterSimple');
    });

    // 14. Unknown type — skipped with warning
    it('skips unknown types and logs a warning', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const spec = specFromTypes(['Header', 'DoesNotExist', 'TextBlock']);

        expect(spec.blocks).toHaveLength(2);
        expect(spec.blocks[0].type).toBe('Header');
        expect(spec.blocks[1].type).toBe('TextBlock');

        expect(warnSpy).toHaveBeenCalledWith(
            'specFromTypes: unknown module "DoesNotExist" — skipped',
        );

        warnSpy.mockRestore();
    });

    // 15. Block IDs assigned
    it('assigns an id to every block', () => {
        const spec = specFromTypes(['Header', 'TextBlock', 'FooterSimple']);

        for (const block of spec.blocks) {
            expect(block.id).toBeDefined();
            expect(typeof block.id).toBe('string');
            expect(block.id!.length).toBeGreaterThan(0);
        }
    });

    it('assigns unique ids to all blocks', () => {
        const spec = specFromTypes([
            'Header',
            'TextBlock',
            'TextBlock',
            'FooterSimple',
        ]);

        const ids = spec.blocks.map((b) => b.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    // 16. Theme is passed through
    it('passes theme through to the returned spec', () => {
        const theme = { primary: '#abc', secondary: '#def' };
        const spec = specFromTypes(['TextBlock'], theme);

        expect(spec.theme).toEqual(theme);
    });

    it('returns spec with no theme when none is provided', () => {
        const spec = specFromTypes(['TextBlock']);

        expect(spec.theme).toBeUndefined();
    });

    // Defaults are used as props
    it('populates each block with the module defaults as props', () => {
        const spec = specFromTypes(['TextBlock']);

        const textBlockDefaults = getModule('TextBlock')!.defaults as Record<string, unknown>;
        // The block's props should contain the default values
        expect(spec.blocks[0].props).toEqual(expect.objectContaining(textBlockDefaults));
    });

    // Empty input
    it('returns a spec with no blocks for an empty types array', () => {
        const spec = specFromTypes([]);

        expect(spec.blocks).toHaveLength(0);
    });
});
