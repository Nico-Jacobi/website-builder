/**
 * Split a list of `PatchOp`s into "apply" and "rejected" buckets based on
 * which blocks / fields the user has just touched inline.
 *
 * This is the safety-net for the "LLM was working on a stale snapshot" case:
 * while the LLM was thinking, the user inline-edited a field. The engine
 * records each inline edit as a key (see `InlineEditedKey` in `./types`). If
 * the LLM's response tries to change the same thing, we drop that op so the
 * user's work never silently gets overwritten.
 *
 * Rules:
 *   - `updateField`: conflict if `${blockId}:${path}` is in the set.
 *   - `updateTone` : conflict if `${blockId}:__tone` is in the set.
 *   - `removeBlock`: conflict if *any* key in the set targets this block
 *     (exact `${blockId}` or `${blockId}:...` prefix).
 *   - `moveBlock`  : same rule as `removeBlock`.
 *   - `addBlock`   : never conflicts — the block didn't exist yet, so nobody
 *                    can have inline-edited it.
 *   - `updateTheme`: never conflicts — the theme has no inline-edit surface.
 *
 * Op order is preserved in both output arrays.
 */

import type { ConflictResult, InlineEditedKey, PatchOp, RejectedOp } from './types';

export function detectConflicts(
    ops: PatchOp[],
    inlineEditedKeys: Set<InlineEditedKey>,
): ConflictResult {
    const apply: PatchOp[] = [];
    const rejected: RejectedOp[] = [];

    for (const op of ops) {
        if (isConflicting(op, inlineEditedKeys)) {
            rejected.push({
                op,
                reason: 'inline-edit-conflict',
                blockId: blockIdOf(op),
            });
        } else {
            apply.push(op);
        }
    }

    return { apply, rejected };
}

function isConflicting(op: PatchOp, keys: Set<InlineEditedKey>): boolean {
    switch (op.type) {
        case 'updateField':
            return keys.has(`${op.blockId}:${op.path}`);
        case 'updateTone':
            return keys.has(`${op.blockId}:__tone`);
        case 'removeBlock':
        case 'moveBlock':
            return hasAnyKeyFor(keys, op.blockId);
        case 'addBlock':
        case 'updateTheme':
            return false;
    }
}

function hasAnyKeyFor(keys: Set<InlineEditedKey>, blockId: string): boolean {
    if (keys.has(blockId)) return true;
    const prefix = `${blockId}:`;
    for (const key of keys) {
        if (key.startsWith(prefix)) return true;
    }
    return false;
}

function blockIdOf(op: PatchOp): string {
    switch (op.type) {
        case 'updateField':
        case 'updateTone':
        case 'removeBlock':
        case 'moveBlock':
            return op.blockId;
        case 'addBlock':
            // addBlock never conflicts so this branch is unreachable in
            // practice, but keep the function total for callers that inspect
            // `rejected` without narrowing first.
            return op.block.id ?? '';
        case 'updateTheme':
            // Theme ops aren't tied to a block; same total-function rationale.
            return '';
    }
}
