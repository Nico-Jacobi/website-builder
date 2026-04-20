import { describe, expect, it } from 'vitest';
import { detectConflicts } from './detectConflicts';
import type { PatchOp } from './types';

const noEdits = (): Set<string> => new Set<string>();

describe('detectConflicts', () => {
    it('passes everything through when no inline edits are tracked', () => {
        const ops: PatchOp[] = [
            {
                type: 'updateField',
                blockId: 'a',
                path: 'title',
                value: 'x',
                previousValue: 'y',
            },
            { type: 'removeBlock', blockId: 'b' },
            {
                type: 'moveBlock',
                blockId: 'c',
                newParentBlockId: null,
                newPosition: 0,
            },
            {
                type: 'updateTone',
                blockId: 'd',
                tone: 'dark',
                previousTone: null,
            },
        ];
        const { apply, rejected } = detectConflicts(ops, noEdits());
        expect(apply).toEqual(ops);
        expect(rejected).toEqual([]);
    });

    it('rejects updateField when the exact path was inline-edited', () => {
        const op: PatchOp = {
            type: 'updateField',
            blockId: 'a',
            path: 'title',
            value: 'llm',
            previousValue: 'orig',
        };
        const edited = new Set(['a:title']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([]);
        expect(rejected).toEqual([
            { op, reason: 'inline-edit-conflict', blockId: 'a' },
        ]);
    });

    it('allows updateField on a different path of the same block', () => {
        const op: PatchOp = {
            type: 'updateField',
            blockId: 'a',
            path: 'subtitle',
            value: 'new',
            previousValue: 'old',
        };
        const edited = new Set(['a:title']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([op]);
        expect(rejected).toEqual([]);
    });

    it('rejects updateTone when tone was inline-edited', () => {
        const op: PatchOp = {
            type: 'updateTone',
            blockId: 'a',
            tone: 'dark',
            previousTone: null,
        };
        const edited = new Set(['a:__tone']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([]);
        expect(rejected).toHaveLength(1);
        expect(rejected[0].blockId).toBe('a');
    });

    it('rejects removeBlock when any field of the block was inline-edited', () => {
        const op: PatchOp = { type: 'removeBlock', blockId: 'a' };
        const edited = new Set(['a:title']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([]);
        expect(rejected).toHaveLength(1);
    });

    it('rejects removeBlock when the block itself is structurally locked', () => {
        const op: PatchOp = { type: 'removeBlock', blockId: 'a' };
        const edited = new Set(['a']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([]);
        expect(rejected).toHaveLength(1);
    });

    it('rejects moveBlock on inline-edited block', () => {
        const op: PatchOp = {
            type: 'moveBlock',
            blockId: 'a',
            newParentBlockId: null,
            newPosition: 2,
        };
        const edited = new Set(['a:heading']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([]);
        expect(rejected).toHaveLength(1);
    });

    it('never rejects addBlock even if the set is populated', () => {
        const op: PatchOp = {
            type: 'addBlock',
            block: { type: 'Header', props: {} },
            parentBlockId: null,
            position: 0,
        };
        const edited = new Set(['a', 'a:title', 'b:__tone']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([op]);
        expect(rejected).toEqual([]);
    });

    it('does not match block ids by accidental prefix', () => {
        // "block" should not match "block10:title" by being a string prefix.
        const op: PatchOp = { type: 'removeBlock', blockId: 'block' };
        const edited = new Set(['block10:title']);
        const { apply, rejected } = detectConflicts([op], edited);
        expect(apply).toEqual([op]);
        expect(rejected).toEqual([]);
    });

    it('preserves the original op order across apply and rejected', () => {
        const op1: PatchOp = { type: 'removeBlock', blockId: 'x' };
        const op2: PatchOp = {
            type: 'updateField',
            blockId: 'y',
            path: 'title',
            value: 'a',
            previousValue: 'b',
        };
        const op3: PatchOp = {
            type: 'addBlock',
            block: { type: 'Header', props: {} },
            parentBlockId: null,
            position: 0,
        };
        const op4: PatchOp = {
            type: 'updateField',
            blockId: 'y',
            path: 'subtitle',
            value: 'c',
            previousValue: 'd',
        };
        const edited = new Set(['y:title']);
        const { apply, rejected } = detectConflicts([op1, op2, op3, op4], edited);
        expect(apply).toEqual([op1, op3, op4]);
        expect(rejected.map((r) => r.op)).toEqual([op2]);
    });
});
