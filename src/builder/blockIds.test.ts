import { describe, expect, it } from 'vitest';
import { ensureBlockIds } from './blockIds';
import type { SiteSpec } from './schemas';

describe('ensureBlockIds', () => {
    it('assigns a unique id to every block', () => {
        const spec: SiteSpec = {
            blocks: [
                { type: 'Header', props: {} },
                { type: 'TextBlock', props: { body: 'hi' } },
                { type: 'Footer', props: {} },
            ],
        };
        const out = ensureBlockIds(spec);
        const ids = out.blocks.map((b) => b.id);
        expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('preserves existing ids', () => {
        const spec: SiteSpec = {
            blocks: [
                { id: 'keep-me', type: 'Header', props: {} },
                { type: 'TextBlock', props: { body: 'hi' } },
            ],
        };
        const out = ensureBlockIds(spec);
        expect(out.blocks[0].id).toBe('keep-me');
        expect(out.blocks[1].id).toBeDefined();
    });

    it('recurses into nested child BlockSpec arrays', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    type: 'Container',
                    props: {
                        children: [
                            { type: 'TextBlock', props: { body: 'a' } },
                            { type: 'TextBlock', props: { body: 'b' } },
                        ],
                    },
                },
            ],
        };
        const out = ensureBlockIds(spec);
        const container = out.blocks[0];
        expect(container.id).toBeDefined();
        const children = container.props.children as Array<{ id?: string }>;
        expect(children).toHaveLength(2);
        expect(children[0].id).toBeDefined();
        expect(children[1].id).toBeDefined();
        expect(children[0].id).not.toBe(children[1].id);
    });

    it('does not mutate the input spec', () => {
        const spec: SiteSpec = {
            blocks: [{ type: 'Header', props: {} }],
        };
        const snapshot = JSON.parse(JSON.stringify(spec));
        ensureBlockIds(spec);
        expect(spec).toEqual(snapshot);
    });

    it('leaves non-BlockSpec arrays untouched', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    type: 'CardRow',
                    props: {
                        cards: [
                            { title: 'a', body: 'x' },
                            { title: 'b', body: 'y' },
                        ],
                    },
                },
            ],
        };
        const out = ensureBlockIds(spec);
        expect(out.blocks[0].props.cards).toEqual([
            { title: 'a', body: 'x' },
            { title: 'b', body: 'y' },
        ]);
    });
});
