import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SiteSpec } from '@website-builder/shared';
import { applyPatchOps } from './applyPatchOps';
import type { BlockOpsAdapter } from '../../data/blockOps';
import type { PatchOp } from '../../diff/types';

// Mock the siteClient so updateField-Ops don't hit real HTTP.
vi.mock('../../data/siteClient', () => ({
    patchBlockContent: vi.fn(async () => {}),
}));

import { patchBlockContent } from '../../data/siteClient';

function makeBlockOpsMock(overrides: Partial<BlockOpsAdapter> = {}): BlockOpsAdapter {
    return {
        addBlock:    vi.fn(async (_opts) => ({ id: 'server-new-id', position: 0 })),
        removeBlock: vi.fn(async () => {}),
        moveBlock:   vi.fn(async () => {}),
        patchTone:   vi.fn(async () => {}),
        subscribe:   vi.fn(() => () => {}),
        getStatus:   vi.fn((): 'idle' => 'idle'),
        dispose:     vi.fn(),
        ...overrides,
    };
}

beforeEach(() => {
    vi.mocked(patchBlockContent).mockClear();
});

describe('applyPatchOps', () => {
    it('returns ok with nextSpec for empty ops', async () => {
        const spec: SiteSpec = { blocks: [{ id: 'a', type: 'Header', props: {} }] };
        const blockOps = makeBlockOpsMock();
        const result = await applyPatchOps({
            ops: [],
            currentSpec: spec,
            identifier:  'site-1',
            blockOps,
        });
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.applied).toBe(0);
            expect(result.nextSpec).toEqual(spec);
            // should be a clone, not the same reference
            expect(result.nextSpec).not.toBe(spec);
        }
    });

    it('applies updateField ops via direct patchBlockContent (no adapter)', async () => {
        const spec: SiteSpec = {
            blocks: [{ id: 'a', type: 'Header', props: { title: 'old' } }],
        };
        const blockOps = makeBlockOpsMock();
        const ops: PatchOp[] = [
            {
                type:          'updateField',
                blockId:       'a',
                path:          'title',
                value:         'new',
                previousValue: 'old',
            },
        ];

        const result = await applyPatchOps({
            ops,
            currentSpec: spec,
            identifier:  'site-1',
            blockOps,
        });

        expect(result.kind).toBe('ok');
        expect(patchBlockContent).toHaveBeenCalledWith('site-1', 'a', 'title', 'new');
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks[0].props.title).toBe('new');
        }
    });

    it('removeBlock removes the block from nextSpec', async () => {
        const spec: SiteSpec = {
            blocks: [
                { id: 'a', type: 'Header', props: {} },
                { id: 'b', type: 'TextBlock', props: {} },
            ],
        };
        const blockOps = makeBlockOpsMock();
        const result = await applyPatchOps({
            ops:         [{ type: 'removeBlock', blockId: 'a' }],
            currentSpec: spec,
            identifier:  'site-1',
            blockOps,
        });
        expect(result.kind).toBe('ok');
        expect(blockOps.removeBlock).toHaveBeenCalledWith({ blockId: 'a' });
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks).toHaveLength(1);
            expect(result.nextSpec.blocks[0].id).toBe('b');
        }
    });

    it('addBlock assigns the backend-minted id in nextSpec', async () => {
        const spec: SiteSpec = { blocks: [] };
        const blockOps = makeBlockOpsMock({
            addBlock: vi.fn(async () => ({ id: 'srv-42', position: 0 })),
        });
        const result = await applyPatchOps({
            ops: [
                {
                    type:          'addBlock',
                    block:         { type: 'Header', props: { title: 'x' } },
                    parentBlockId: null,
                    position:      0,
                },
            ],
            currentSpec: spec,
            identifier:  'site-1',
            blockOps,
        });
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks).toHaveLength(1);
            expect(result.nextSpec.blocks[0].id).toBe('srv-42');
            expect(result.nextSpec.blocks[0].type).toBe('Header');
        }
    });

    it('enforces op order: remove → move → add → tone → field', async () => {
        const callOrder: string[] = [];
        const blockOps = makeBlockOpsMock({
            removeBlock: vi.fn(async () => { callOrder.push('remove'); }),
            moveBlock:   vi.fn(async () => { callOrder.push('move'); }),
            addBlock:    vi.fn(async () => { callOrder.push('add'); return { id: 'new', position: 0 }; }),
            patchTone:   vi.fn(async () => { callOrder.push('tone'); }),
        });
        vi.mocked(patchBlockContent).mockImplementation(async () => {
            callOrder.push('field');
        });

        // Feed them in REVERSE order to prove the sort works.
        const ops: PatchOp[] = [
            { type: 'updateField', blockId: 'a', path: 't', value: 'v', previousValue: null },
            { type: 'updateTone',  blockId: 'a', tone: 'muted', previousTone: null },
            { type: 'addBlock',    block: { type: 'Header', props: {} }, parentBlockId: null, position: 0 },
            { type: 'moveBlock',   blockId: 'a', newParentBlockId: null, newPosition: 0 },
            { type: 'removeBlock', blockId: 'z' },
        ];

        const spec: SiteSpec = {
            blocks: [
                { id: 'a', type: 'Header', props: { t: 'old' } },
                { id: 'z', type: 'TextBlock', props: {} },
            ],
        };

        await applyPatchOps({ ops, currentSpec: spec, identifier: 's', blockOps });
        expect(callOrder).toEqual(['remove', 'move', 'add', 'tone', 'field']);
    });

    it('returns partial when an op throws, stops further ops', async () => {
        const blockOps = makeBlockOpsMock({
            removeBlock: vi.fn(async () => { throw new Error('boom'); }),
        });

        const spec: SiteSpec = {
            blocks: [
                { id: 'a', type: 'Header', props: {} },
                { id: 'b', type: 'TextBlock', props: {} },
            ],
        };

        const ops: PatchOp[] = [
            { type: 'removeBlock', blockId: 'a' },
            { type: 'updateField', blockId: 'b', path: 't', value: 'v', previousValue: null },
        ];

        const result = await applyPatchOps({
            ops,
            currentSpec: spec,
            identifier:  's',
            blockOps,
        });

        expect(result.kind).toBe('partial');
        if (result.kind === 'partial') {
            expect(result.applied).toBe(0);
            expect(result.error).toContain('boom');
            expect(result.failedAt.type).toBe('removeBlock');
        }
        // second op was never sent
        expect(patchBlockContent).not.toHaveBeenCalled();
    });

    it('updateTone with null removes tone from nextSpec', async () => {
        const spec: SiteSpec = {
            blocks: [{ id: 'a', type: 'Header', props: {}, tone: 'primary' }],
        };
        const blockOps = makeBlockOpsMock();
        const result = await applyPatchOps({
            ops: [
                { type: 'updateTone', blockId: 'a', tone: null, previousTone: 'primary' },
            ],
            currentSpec: spec,
            identifier:  's',
            blockOps,
        });
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks[0].tone).toBeUndefined();
        }
    });

    it('moveBlock repositions inside nextSpec', async () => {
        const spec: SiteSpec = {
            blocks: [
                { id: 'a', type: 'Header', props: {} },
                { id: 'b', type: 'TextBlock', props: {} },
                { id: 'c', type: 'Footer', props: {} },
            ],
        };
        const blockOps = makeBlockOpsMock();
        const result = await applyPatchOps({
            ops: [
                {
                    type:             'moveBlock',
                    blockId:          'a',
                    newParentBlockId: null,
                    newPosition:      2,
                },
            ],
            currentSpec: spec,
            identifier:  's',
            blockOps,
        });
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks.map((b) => b.id)).toEqual(['b', 'c', 'a']);
        }
    });

    it('does not mutate the input currentSpec', async () => {
        const spec: SiteSpec = {
            blocks: [{ id: 'a', type: 'Header', props: { title: 'old' } }],
        };
        const frozen = JSON.parse(JSON.stringify(spec));
        const blockOps = makeBlockOpsMock();
        await applyPatchOps({
            ops: [
                { type: 'updateField', blockId: 'a', path: 'title', value: 'new', previousValue: 'old' },
            ],
            currentSpec: spec,
            identifier:  's',
            blockOps,
        });
        expect(spec).toEqual(frozen);
    });
});
