import { describe, expect, it } from 'vitest';
import type { SiteSpec } from '@website-builder/shared';
import { diffSpecs } from './diffSpecs';
import type { PatchOp } from './types';

const EMPTY_SPEC: SiteSpec = { blocks: [] };

function pick<T extends PatchOp['type']>(
    ops: PatchOp[],
    type: T,
): Array<Extract<PatchOp, { type: T }>> {
    return ops.filter((o): o is Extract<PatchOp, { type: T }> => o.type === type);
}

describe('diffSpecs', () => {
    describe('baseline cases', () => {
        it('returns an empty op list when specs are identical', () => {
            const spec: SiteSpec = {
                blocks: [
                    { id: 'a', type: 'Header', props: { title: 'x' } },
                    { id: 'b', type: 'TextBlock', props: { body: 'hi' } },
                ],
            };
            expect(diffSpecs(spec, spec)).toEqual([]);
        });

        it('emits only addBlocks when before is empty and strips ids', () => {
            const after: SiteSpec = {
                blocks: [
                    { id: 'llm-invented-1', type: 'Header', props: { title: 'x' } },
                    { type: 'TextBlock', props: { body: 'hi' } },
                ],
            };
            const ops = diffSpecs(EMPTY_SPEC, after);
            const adds = pick(ops, 'addBlock');
            expect(ops).toHaveLength(2);
            expect(adds).toHaveLength(2);
            expect(adds[0].block.id).toBeUndefined();
            expect(adds[1].block.id).toBeUndefined();
            expect(adds[0].parentBlockId).toBeNull();
            expect(adds[0].position).toBe(0);
            expect(adds[1].position).toBe(1);
            expect(adds[0].block.type).toBe('Header');
            expect(adds[1].block.type).toBe('TextBlock');
        });

        it('emits only removeBlocks when after is empty', () => {
            const before: SiteSpec = {
                blocks: [
                    { id: 'a', type: 'Header', props: {} },
                    { id: 'b', type: 'TextBlock', props: { body: 'hi' } },
                ],
            };
            const ops = diffSpecs(before, EMPTY_SPEC);
            const removes = pick(ops, 'removeBlock');
            expect(ops).toHaveLength(2);
            expect(removes.map((o) => o.blockId).sort()).toEqual(['a', 'b']);
        });
    });

    describe('field updates', () => {
        it('emits exactly one updateField for a changed heading', () => {
            const before: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: { title: 'old' } }],
            };
            const after: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: { title: 'new' } }],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toHaveLength(1);
            expect(ops[0]).toEqual({
                type: 'updateField',
                blockId: 'h',
                path: 'title',
                value: 'new',
                previousValue: 'old',
            });
        });

        it('diffs nested array leaves with bracket paths', () => {
            const before: SiteSpec = {
                blocks: [
                    {
                        id: 'cr',
                        type: 'CardRow',
                        props: {
                            cards: [
                                { title: 'a', body: '1' },
                                { title: 'b', body: '2' },
                            ],
                        },
                    },
                ],
            };
            const after: SiteSpec = {
                blocks: [
                    {
                        id: 'cr',
                        type: 'CardRow',
                        props: {
                            cards: [
                                { title: 'a', body: '1' },
                                { title: 'B!', body: '2' },
                            ],
                        },
                    },
                ],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toHaveLength(1);
            expect(ops[0]).toMatchObject({
                type: 'updateField',
                blockId: 'cr',
                path: 'cards[1].title',
                value: 'B!',
                previousValue: 'b',
            });
        });

        it('emits updateField with undefined value for removed leaves', () => {
            const before: SiteSpec = {
                blocks: [
                    { id: 'h', type: 'Header', props: { title: 'x', subtitle: 's' } },
                ],
            };
            const after: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: { title: 'x' } }],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toHaveLength(1);
            expect(ops[0]).toEqual({
                type: 'updateField',
                blockId: 'h',
                path: 'subtitle',
                value: undefined,
                previousValue: 's',
            });
        });
    });

    describe('structural changes', () => {
        it('emits a single removeBlock when a block is deleted', () => {
            const before: SiteSpec = {
                blocks: [
                    { id: 'a', type: 'Header', props: {} },
                    { id: 'b', type: 'TextBlock', props: { body: 'hi' } },
                ],
            };
            const after: SiteSpec = {
                blocks: [{ id: 'a', type: 'Header', props: {} }],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toEqual([{ type: 'removeBlock', blockId: 'b' }]);
        });

        it('does not emit child removes when a container is removed', () => {
            const before: SiteSpec = {
                blocks: [
                    {
                        id: 'cont',
                        type: 'Container',
                        props: {
                            children: [
                                { id: 'kid1', type: 'TextBlock', props: { body: '1' } },
                                { id: 'kid2', type: 'TextBlock', props: { body: '2' } },
                            ],
                        },
                    },
                ],
            };
            const after: SiteSpec = { blocks: [] };
            const ops = diffSpecs(before, after);
            expect(ops).toEqual([{ type: 'removeBlock', blockId: 'cont' }]);
        });

        it('emits a moveBlock when a block is reordered', () => {
            const before: SiteSpec = {
                blocks: [
                    { id: 'a', type: 'Header', props: {} },
                    { id: 'b', type: 'TextBlock', props: { body: 'hi' } },
                ],
            };
            const after: SiteSpec = {
                blocks: [
                    { id: 'b', type: 'TextBlock', props: { body: 'hi' } },
                    { id: 'a', type: 'Header', props: {} },
                ],
            };
            const ops = diffSpecs(before, after);
            const moves = pick(ops, 'moveBlock');
            // At least one of the two swapped blocks must get a move op.
            expect(moves.length).toBeGreaterThanOrEqual(1);
            expect(moves.every((m) => m.newParentBlockId === null)).toBe(true);
            const moved = moves.find((m) => m.blockId === 'a' || m.blockId === 'b');
            expect(moved).toBeDefined();
        });

        it('emits a single addBlock for a brand-new block without id', () => {
            const before: SiteSpec = {
                blocks: [{ id: 'a', type: 'Header', props: {} }],
            };
            const after: SiteSpec = {
                blocks: [
                    { id: 'a', type: 'Header', props: {} },
                    { type: 'TextBlock', props: { body: 'new' } },
                ],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toHaveLength(1);
            expect(ops[0]).toMatchObject({
                type: 'addBlock',
                parentBlockId: null,
                position: 1,
            });
            const add = ops[0] as Extract<PatchOp, { type: 'addBlock' }>;
            expect(add.block.id).toBeUndefined();
            expect(add.block.type).toBe('TextBlock');
        });

        it('strips LLM-invented ids that do not exist in the before-spec', () => {
            const before: SiteSpec = { blocks: [] };
            const after: SiteSpec = {
                blocks: [
                    { id: 'hallucinated', type: 'Header', props: { title: 'x' } },
                ],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toHaveLength(1);
            const add = ops[0] as Extract<PatchOp, { type: 'addBlock' }>;
            expect(add.type).toBe('addBlock');
            expect(add.block.id).toBeUndefined();
        });
    });

    describe('tone', () => {
        it('emits updateTone when tone changes', () => {
            const before: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: {}, tone: 'surface' }],
            };
            const after: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: {}, tone: 'dark' }],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toEqual([
                {
                    type: 'updateTone',
                    blockId: 'h',
                    tone: 'dark',
                    previousTone: 'surface',
                },
            ]);
        });

        it('normalises missing tone to null', () => {
            const before: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: {} }],
            };
            const after: SiteSpec = {
                blocks: [{ id: 'h', type: 'Header', props: {}, tone: 'accent' }],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toEqual([
                {
                    type: 'updateTone',
                    blockId: 'h',
                    tone: 'accent',
                    previousTone: null,
                },
            ]);
        });
    });

    describe('nested containers', () => {
        it('diffs child props when a child is unchanged structurally', () => {
            const before: SiteSpec = {
                blocks: [
                    {
                        id: 'cont',
                        type: 'Container',
                        props: {
                            children: [
                                {
                                    id: 'kid',
                                    type: 'TextBlock',
                                    props: { heading: 'old' },
                                },
                            ],
                        },
                    },
                ],
            };
            const after: SiteSpec = {
                blocks: [
                    {
                        id: 'cont',
                        type: 'Container',
                        props: {
                            children: [
                                {
                                    id: 'kid',
                                    type: 'TextBlock',
                                    props: { heading: 'new' },
                                },
                            ],
                        },
                    },
                ],
            };
            const ops = diffSpecs(before, after);
            expect(ops).toHaveLength(1);
            expect(ops[0]).toEqual({
                type: 'updateField',
                blockId: 'kid',
                path: 'heading',
                value: 'new',
                previousValue: 'old',
            });
        });

        it('does not diff the props.children array as a content field', () => {
            // Structural reorder inside a container must not surface as an
            // updateField on "children" — it's handled via moveBlock only.
            const before: SiteSpec = {
                blocks: [
                    {
                        id: 'cont',
                        type: 'Container',
                        props: {
                            heading: 'H',
                            children: [
                                { id: 'k1', type: 'TextBlock', props: { body: '1' } },
                                { id: 'k2', type: 'TextBlock', props: { body: '2' } },
                            ],
                        },
                    },
                ],
            };
            const after: SiteSpec = {
                blocks: [
                    {
                        id: 'cont',
                        type: 'Container',
                        props: {
                            heading: 'H',
                            children: [
                                { id: 'k2', type: 'TextBlock', props: { body: '2' } },
                                { id: 'k1', type: 'TextBlock', props: { body: '1' } },
                            ],
                        },
                    },
                ],
            };
            const ops = diffSpecs(before, after);
            expect(pick(ops, 'updateField')).toEqual([]);
            expect(pick(ops, 'moveBlock').length).toBeGreaterThanOrEqual(1);
        });

        it('detects a cross-parent move', () => {
            const before: SiteSpec = {
                blocks: [
                    {
                        id: 'c1',
                        type: 'Container',
                        props: {
                            children: [
                                { id: 'kid', type: 'TextBlock', props: { body: 'x' } },
                            ],
                        },
                    },
                    { id: 'c2', type: 'Container', props: { children: [] } },
                ],
            };
            const after: SiteSpec = {
                blocks: [
                    { id: 'c1', type: 'Container', props: { children: [] } },
                    {
                        id: 'c2',
                        type: 'Container',
                        props: {
                            children: [
                                { id: 'kid', type: 'TextBlock', props: { body: 'x' } },
                            ],
                        },
                    },
                ],
            };
            const ops = diffSpecs(before, after);
            const move = pick(ops, 'moveBlock').find((m) => m.blockId === 'kid');
            expect(move).toEqual({
                type: 'moveBlock',
                blockId: 'kid',
                newParentBlockId: 'c2',
                newPosition: 0,
            });
        });
    });

    describe('complex combinations', () => {
        it('produces removes before moves before adds before tone before fields', () => {
            const before: SiteSpec = {
                blocks: [
                    { id: 'keep', type: 'Header', props: { title: 'old' } },
                    { id: 'drop', type: 'TextBlock', props: { body: 'bye' } },
                    { id: 'mv', type: 'Footer', props: {}, tone: 'surface' },
                ],
            };
            const after: SiteSpec = {
                blocks: [
                    { id: 'mv', type: 'Footer', props: {}, tone: 'dark' },
                    { id: 'keep', type: 'Header', props: { title: 'new' } },
                    { type: 'TextBlock', props: { body: 'fresh' } },
                ],
            };
            const ops = diffSpecs(before, after);
            const types: PatchOp['type'][] = ops.map((o) => o.type);
            // Every op-category must come in the documented order. There's
            // exactly one of each kind here so just check the sequence.
            const expectedOrder: PatchOp['type'][] = [
                'removeBlock',
                'moveBlock',
                'addBlock',
                'updateTone',
                'updateField',
            ];
            // Filter to only the categories that actually appeared and keep
            // first-occurrence order.
            const firstIndexOf = (t: PatchOp['type']): number => types.indexOf(t);
            const seen = expectedOrder.filter((t) => types.includes(t));
            const sortedSeen = [...seen].sort(
                (a, b) => firstIndexOf(a) - firstIndexOf(b),
            );
            expect(sortedSeen).toEqual(seen);

            expect(pick(ops, 'removeBlock')).toEqual([
                { type: 'removeBlock', blockId: 'drop' },
            ]);
            expect(pick(ops, 'addBlock')).toHaveLength(1);
            expect(pick(ops, 'updateField')).toHaveLength(1);
            expect(pick(ops, 'updateTone')).toHaveLength(1);
        });
    });

    describe('theme', () => {
        it('emits no theme op when both specs have no theme', () => {
            const ops = diffSpecs({ blocks: [] }, { blocks: [] });
            expect(pick(ops, 'updateTheme')).toEqual([]);
        });

        it('emits no theme op when themes are deeply equal', () => {
            const before: SiteSpec = {
                theme:  { primary: '#f06', secondary: '#0ff' },
                blocks: [],
            };
            const after: SiteSpec = {
                theme:  { secondary: '#0ff', primary: '#f06' },
                blocks: [],
            };
            expect(pick(diffSpecs(before, after), 'updateTheme')).toEqual([]);
        });

        it('emits updateTheme when theme is added', () => {
            const before: SiteSpec = { blocks: [] };
            const after: SiteSpec = { theme: { primary: '#f06' }, blocks: [] };
            const ops = pick(diffSpecs(before, after), 'updateTheme');
            expect(ops).toEqual([
                {
                    type:          'updateTheme',
                    theme:         { primary: '#f06' },
                    previousTheme: null,
                },
            ]);
        });

        it('emits updateTheme when theme is removed', () => {
            const before: SiteSpec = { theme: { primary: '#f06' }, blocks: [] };
            const after: SiteSpec = { blocks: [] };
            const ops = pick(diffSpecs(before, after), 'updateTheme');
            expect(ops).toEqual([
                {
                    type:          'updateTheme',
                    theme:         null,
                    previousTheme: { primary: '#f06' },
                },
            ]);
        });

        it('emits updateTheme when a value changes', () => {
            const before: SiteSpec = { theme: { primary: '#f06' }, blocks: [] };
            const after:  SiteSpec = { theme: { primary: '#0f6' }, blocks: [] };
            expect(pick(diffSpecs(before, after), 'updateTheme')).toHaveLength(1);
        });

        it('places updateTheme before block ops', () => {
            const before: SiteSpec = {
                blocks: [{ id: 'a', type: 'Header', props: { title: 'x' } }],
            };
            const after: SiteSpec = {
                theme:  { primary: '#f06' },
                blocks: [{ id: 'a', type: 'Header', props: { title: 'y' } }],
            };
            const ops = diffSpecs(before, after);
            expect(ops[0]?.type).toBe('updateTheme');
        });
    });
});
