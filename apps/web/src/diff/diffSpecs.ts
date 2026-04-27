/**
 * Diff two `SiteSpec`s and return a list of `PatchOp`s whose application to
 * `before` reproduces `after`.
 *
 * Matching is strictly by `block.id`:
 *   - A block id present in `before` but not in `after` is a remove.
 *   - A block id present in `after` but not in `before`, or an after-block
 *     without an id at all, is an add. In both cases any id on the produced
 *     `addBlock.block` is stripped so the backend gets to mint a fresh UUID
 *     (the LLM does not get to invent server-side ids).
 *   - A block id present in both gets a `moveBlock` op iff its (parentId,
 *     position) changed, plus per-leaf `updateField` ops for every `props`
 *     leaf whose value changed, plus an `updateTone` op iff `tone` changed.
 *
 * Nested children: any `props.children` that is an array of `BlockSpec`s is
 * walked recursively; the parent block's id is passed down as `parentId`.
 *
 * Removed containers are emitted as a single `removeBlock` for the top of the
 * removal subtree — child removes are left to the backend cascade. This keeps
 * the op list small and avoids "remove before its parent is gone" ordering
 * headaches.
 *
 * Op order is stable and chosen so sequential application is safe:
 *   updateTheme → removeBlock → moveBlock → addBlock → updateTone → updateField.
 * Theme sits at the front because it's independent of block state — the server
 * accepts/rejects it on its own, and we want the inline style to appear before
 * any block ops render new content.
 */

import type { BlockSpec, SiteSpec } from '@website-builder/shared';
import type { PatchOp } from './types';

interface BlockLocation {
    block: BlockSpec;
    parentId: string | null;
    position: number;
}

function sameChrome(
    a: SiteSpec['chrome'],
    b: SiteSpec['chrome'],
): boolean {
    // Simple structural compare via JSON — chrome is small enough that this is fine.
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function diffSpecs(before: SiteSpec, after: SiteSpec): PatchOp[] {
    const beforeById = new Map<string, BlockLocation>();
    const afterById = new Map<string, BlockLocation>();
    indexBlocks(before.blocks, null, beforeById);
    indexBlocks(after.blocks, null, afterById);

    const themeUpdates: PatchOp[] = [];
    const removes: PatchOp[] = [];
    const moves: PatchOp[] = [];
    const adds: PatchOp[] = [];
    const toneUpdates: PatchOp[] = [];
    const fieldUpdates: PatchOp[] = [];

    // --- chrome: whole-replace diff (chrome is small; granular would be overhead).
    if (!sameChrome(before.chrome, after.chrome)) {
        themeUpdates.push({
            type: 'updateChrome',
            chrome: after.chrome ?? {},
            previousChrome: before.chrome ?? null,
        });
    }

    // --- theme: full-replace diff. Compared by canonical JSON so key-order
    // noise doesn't register as a change.
    const prevTheme = before.theme ?? null;
    const nextTheme = after.theme ?? null;
    if (!sameTheme(prevTheme, nextTheme)) {
        themeUpdates.push({
            type: 'updateTheme',
            theme: nextTheme,
            previousTheme: prevTheme,
        });
    }

    // --- removes: drop descendants that are already covered by an ancestor
    // removal so the backend cascade can do the heavy lifting.
    const removedIds = new Set<string>();
    for (const id of beforeById.keys()) {
        if (!afterById.has(id)) removedIds.add(id);
    }
    for (const id of removedIds) {
        if (!hasAncestorIn(beforeById, id, removedIds)) {
            removes.push({ type: 'removeBlock', blockId: id });
        }
    }

    // --- adds + moves + field/tone updates: walk the after-spec top-down so
    // parents come before their children in the add list.
    walkAfterTopDown(after.blocks, null, (entry) => {
        const { block, parentId, position } = entry;
        const id = block.id;

        // If the after-block either has no id, or has an id we've never seen
        // in before, treat as new. Strip any id from the emitted block so the
        // backend can mint its own.
        const isNew = id === undefined || !beforeById.has(id);
        if (isNew) {
            adds.push({
                type: 'addBlock',
                block: stripBlockId(block),
                parentBlockId: parentId,
                position,
            });
            return;
        }

        const prev = beforeById.get(id)!;

        if (prev.parentId !== parentId || prev.position !== position) {
            moves.push({
                type: 'moveBlock',
                blockId: id,
                newParentBlockId: parentId,
                newPosition: position,
            });
        }

        const prevTone = prev.block.tone ?? null;
        const nextTone = block.tone ?? null;
        if (prevTone !== nextTone) {
            toneUpdates.push({
                type: 'updateTone',
                blockId: id,
                tone: nextTone,
                previousTone: prevTone,
            });
        }

        const prevLeaves = new Map<string, unknown>();
        const nextLeaves = new Map<string, unknown>();
        walkLeaves(stripChildren(prev.block.props), '', prevLeaves);
        walkLeaves(stripChildren(block.props), '', nextLeaves);

        const paths = new Set<string>([...prevLeaves.keys(), ...nextLeaves.keys()]);
        for (const path of paths) {
            const hadPrev = prevLeaves.has(path);
            const hasNext = nextLeaves.has(path);
            const prevValue = hadPrev ? prevLeaves.get(path) : undefined;
            const nextValue = hasNext ? nextLeaves.get(path) : undefined;
            if (hadPrev && hasNext && Object.is(prevValue, nextValue)) continue;
            fieldUpdates.push({
                type: 'updateField',
                blockId: id,
                path,
                value: nextValue,
                previousValue: prevValue,
            });
        }
    });

    return [...themeUpdates, ...removes, ...moves, ...adds, ...toneUpdates, ...fieldUpdates];
}

function sameTheme(
    a: Record<string, string> | null,
    b: Record<string, string> | null,
): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
        const k = keysA[i]!;
        if (k !== keysB[i]) return false;
        if (a[k] !== b[k]) return false;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function indexBlocks(
    blocks: BlockSpec[],
    parentId: string | null,
    sink: Map<string, BlockLocation>,
): void {
    blocks.forEach((block, position) => {
        if (typeof block.id === 'string' && block.id.length > 0) {
            sink.set(block.id, { block, parentId, position });
        }
        const children = getChildren(block);
        if (children) {
            // Only recurse through blocks whose id we know — otherwise the
            // parent is a new block and its children will be walked via the
            // top-down add-walker instead.
            const effectiveParentId = typeof block.id === 'string' ? block.id : null;
            indexBlocks(children, effectiveParentId, sink);
        }
    });
}

function walkAfterTopDown(
    blocks: BlockSpec[],
    parentId: string | null,
    visit: (loc: BlockLocation) => void,
): void {
    blocks.forEach((block, position) => {
        visit({ block, parentId, position });
        const children = getChildren(block);
        if (children) {
            // For id-less (new) blocks, children are still walked so they
            // come out as adds too, parented under "null" — plan 06 is
            // expected to map that onto the newly-minted parent. For now we
            // pass the block's id (undefined → null).
            const effectiveParentId = typeof block.id === 'string' ? block.id : null;
            walkAfterTopDown(children, effectiveParentId, visit);
        }
    });
}

function hasAncestorIn(
    byId: Map<string, BlockLocation>,
    id: string,
    set: Set<string>,
): boolean {
    let current = byId.get(id)?.parentId ?? null;
    while (current !== null) {
        if (set.has(current)) return true;
        current = byId.get(current)?.parentId ?? null;
    }
    return false;
}

function getChildren(block: BlockSpec): BlockSpec[] | null {
    const children = (block.props as Record<string, unknown>)?.children;
    if (!Array.isArray(children)) return null;
    if (!children.every(isBlockSpec)) return null;
    return children as BlockSpec[];
}

function isBlockSpec(v: unknown): v is BlockSpec {
    return (
        !!v &&
        typeof v === 'object' &&
        typeof (v as BlockSpec).type === 'string' &&
        typeof (v as BlockSpec).props === 'object' &&
        (v as BlockSpec).props !== null
    );
}

function stripBlockId(block: BlockSpec): BlockSpec {
    // Shallow strip of the top-level id only — nested block ids (inside
    // props.children) are preserved because they'll be walked separately.
    const { id: _id, ...rest } = block;
    void _id;
    return rest as BlockSpec;
}

function stripChildren(props: Record<string, unknown>): Record<string, unknown> {
    // Field-diff operates on everything except the structural `children`
    // array, which is handled by the add/remove/move path instead.
    if (!('children' in props)) return props;
    const { children: _children, ...rest } = props;
    void _children;
    return rest;
}

/**
 * Flattens an object/array tree into a map of leaf-paths → leaf-values.
 *
 *   walkLeaves({ heading: 'x', cards: [{ title: 'a' }] })
 *   → Map {
 *       'heading'        → 'x',
 *       'cards[0].title' → 'a',
 *     }
 *
 * Empty arrays and empty objects nested under a real path are recorded as
 * leaves themselves (with a `[]`/`{}` sentinel) so that "now empty" vs "was
 * populated" still produces a diff entry. At the root (`pathPrefix === ''`)
 * we do NOT emit a sentinel — an empty props object legitimately has zero
 * leaves, and emitting a `""` key would make every no-change block look
 * different because `{} !== {}` under `Object.is`.
 */
function walkLeaves(
    value: unknown,
    pathPrefix: string,
    sink: Map<string, unknown>,
): void {
    if (value === null || value === undefined) {
        if (pathPrefix === '') return;
        sink.set(pathPrefix, value);
        return;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            if (pathPrefix === '') return;
            sink.set(pathPrefix, EMPTY_ARRAY_SENTINEL);
            return;
        }
        value.forEach((v, i) => walkLeaves(v, `${pathPrefix}[${i}]`, sink));
        return;
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value as Record<string, unknown>);
        if (keys.length === 0) {
            if (pathPrefix === '') return;
            sink.set(pathPrefix, EMPTY_OBJECT_SENTINEL);
            return;
        }
        for (const k of keys) {
            const nextPath = pathPrefix ? `${pathPrefix}.${k}` : k;
            walkLeaves((value as Record<string, unknown>)[k], nextPath, sink);
        }
        return;
    }
    sink.set(pathPrefix, value);
}

// Stable singletons for empty-container sentinels so `Object.is` comparisons
// work: two "was already empty" markers at the same path must compare equal.
const EMPTY_ARRAY_SENTINEL: readonly never[] = Object.freeze([]);
const EMPTY_OBJECT_SENTINEL: Readonly<Record<string, never>> = Object.freeze({});
