import { describe, expect, it } from 'vitest';
import { BlockSpecSchema, SiteSpecSchema } from './schemas';

describe('SiteSpecSchema', () => {
    it('accepts an empty blocks array', () => {
        const result = SiteSpecSchema.safeParse({ blocks: [] });
        expect(result.success).toBe(true);
    });

    it('accepts a spec with theme and a block', () => {
        const result = SiteSpecSchema.safeParse({
            theme: { primary: '#f06' },
            blocks: [{ type: 'X', props: {} }],
        });
        expect(result.success).toBe(true);
    });

    it('rejects a block missing props', () => {
        const result = SiteSpecSchema.safeParse({ blocks: [{ type: 'X' }] });
        expect(result.success).toBe(false);
    });

    it('rejects a block whose type is not a string', () => {
        const result = SiteSpecSchema.safeParse({
            blocks: [{ type: 123, props: {} }],
        });
        expect(result.success).toBe(false);
    });

    it('rejects a spec missing blocks', () => {
        const result = SiteSpecSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

describe('BlockSpecSchema', () => {
    it('accepts nested BlockSpecs inside props.children', () => {
        const result = BlockSpecSchema.safeParse({
            type: 'Foo',
            props: { children: [{ type: 'Bar', props: {} }] },
        });
        expect(result.success).toBe(true);
    });
});
