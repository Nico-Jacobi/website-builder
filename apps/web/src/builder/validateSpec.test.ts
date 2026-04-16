import { describe, expect, it } from 'vitest';
import { validateSpecAgainstRegistry } from './validateSpec';
import { specFromTypes } from './specHelpers';

describe('validateSpecAgainstRegistry', () => {
    it('accepts a valid demo spec from specFromTypes', () => {
        const spec = specFromTypes(['Header', 'TextBlock', 'FooterSimple']);
        const result = validateSpecAgainstRegistry(spec);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.spec.blocks.length).toBe(3);
        }
    });

    it('reports unknown module types with a helpful message', () => {
        const result = validateSpecAgainstRegistry({
            blocks: [{ type: 'DoesNotExist', props: {} }],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].path).toBe('blocks[0]');
            expect(result.errors[0].message).toMatch(/Unknown module/);
        }
    });

    it('reports missing required props on a known module (Header without title)', () => {
        const result = validateSpecAgainstRegistry({
            blocks: [{ type: 'Header', props: {} }],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].path.startsWith('blocks[0].props')).toBe(true);
        }
    });

    it('recurses into Container.children and reports the nested path', () => {
        const result = validateSpecAgainstRegistry({
            blocks: [
                {
                    type: 'Container',
                    props: {
                        children: [{ type: 'DoesNotExist', props: {} }],
                    },
                },
            ],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            const nested = result.errors.find((e) =>
                e.path === 'blocks[0].props.children[0]',
            );
            expect(nested).toBeDefined();
            expect(nested?.message).toMatch(/Unknown module/);
        }
    });

    it('rejects obvious garbage at the shape pass', () => {
        for (const garbage of [null, 42, 'hello']) {
            const result = validateSpecAgainstRegistry(garbage);
            expect(result.ok).toBe(false);
        }
    });

    it('collects multiple errors instead of stopping at the first', () => {
        const result = validateSpecAgainstRegistry({
            blocks: [
                { type: 'DoesNotExist', props: {} },
                { type: 'AlsoMissing', props: {} },
                { type: 'Header', props: {} },
            ],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            // Two unknown modules + at least one Header-prop error = >= 3.
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
        }
    });
});
