/**
 * specOps — Pure Spec-Manipulations-Helpers.
 *
 * Einzige Quelle der strukturellen Spec-Mutationen (Top-Level & nested).
 * Sowohl die LLM-Diff-Pipeline (`applyPatchOps.ts`) als auch die direkten
 * UI-Actions im EditModeContext (`reorderBlocks`, `addBlock`, `removeBlock`)
 * importieren von hier. Keine Duplikation.
 *
 * Alle Funktionen sind rein: sie mutieren keinen Input, sondern geben einen
 * neuen Spec zurück.
 */

import type { BlockSpec, SiteSpec } from '@website-builder/shared';

// ---------------------------------------------------------------------------
// Internal helpers (exported so applyPatchOps.ts can reuse them for its own
// tone/theme/field mutators without duplicating logic)
// ---------------------------------------------------------------------------

export function mapBlocks(
    blocks: BlockSpec[],
    fn: (block: BlockSpec) => BlockSpec | null,
): BlockSpec[] {
    const out: BlockSpec[] = [];
    for (const block of blocks) {
        const next = fn(block);
        if (next === null) continue;
        const children = getChildren(next);
        if (children) {
            const mappedChildren = mapBlocks(children, fn);
            out.push({
                ...next,
                props: { ...next.props, children: mappedChildren },
            });
        } else {
            out.push(next);
        }
    }
    return out;
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

function insertAt<T>(arr: readonly T[], item: T, index: number): T[] {
    const clamped = Math.max(0, Math.min(arr.length, index));
    return [...arr.slice(0, clamped), item, ...arr.slice(clamped)];
}

function extractBlock(
    spec: SiteSpec,
    blockId: string,
): { block: BlockSpec; specWithoutBlock: SiteSpec } | null {
    let found: BlockSpec | null = null;
    const blocks = mapBlocks(spec.blocks, (b) => {
        if (b.id === blockId) {
            found = b;
            return null;
        }
        return b;
    });
    if (!found) return null;
    return { block: found, specWithoutBlock: { ...spec, blocks } };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function removeBlockFromSpec(spec: SiteSpec, blockId: string): SiteSpec {
    const blocks = mapBlocks(spec.blocks, (b) => (b.id === blockId ? null : b));
    return { ...spec, blocks };
}

/**
 * Insert `block` at `position` below `parentBlockId`. If `parentBlockId` is
 * null, insertion happens at the spec's top level.
 */
export function insertBlockInSpec(
    spec:          SiteSpec,
    block:         BlockSpec,
    parentBlockId: string | null,
    position:      number,
): SiteSpec {
    if (parentBlockId === null) {
        const blocks = insertAt(spec.blocks, block, position);
        return { ...spec, blocks };
    }
    const blocks = mapBlocks(spec.blocks, (b) => {
        if (b.id !== parentBlockId) return b;
        const children = getChildren(b) ?? [];
        const nextChildren = insertAt(children, block, position);
        return { ...b, props: { ...b.props, children: nextChildren } };
    });
    return { ...spec, blocks };
}

/**
 * Move a block to a new parent/position. Works in two steps:
 *   - remove the block from its current location (by id)
 *   - insert it at the target location
 * If the block isn't found, this is a structural invariant violation — the
 * backend just accepted the move but our local spec doesn't know that block.
 * We surface that as a thrown error so `applyPatchOps` returns a `partial`
 * result instead of silently drifting from the server.
 */
export function moveBlockInSpec(
    spec:             SiteSpec,
    blockId:          string,
    newParentBlockId: string | null,
    newPosition:      number,
): SiteSpec {
    const extracted = extractBlock(spec, blockId);
    if (!extracted) {
        throw new Error(`moveBlock: block "${blockId}" not found in local spec`);
    }
    const { block, specWithoutBlock } = extracted;
    return insertBlockInSpec(specWithoutBlock, block, newParentBlockId, newPosition);
}

/**
 * Reorder the top-level blocks by index. Used by the UI for direct
 * reorder-actions (↑/↓ buttons, @dnd-kit/sortable drops) — umgeht die
 * LLM-Diff-Pipeline bewusst. UI ist autoritativ für Struktur.
 */
export function reorderTopLevelBlocks(
    spec:      SiteSpec,
    fromIndex: number,
    toIndex:   number,
): SiteSpec {
    if (fromIndex === toIndex) return spec;
    const next = [...spec.blocks];
    const [moved] = next.splice(fromIndex, 1);
    if (moved === undefined) return spec;
    next.splice(toIndex, 0, moved);
    return { ...spec, blocks: next };
}

/**
 * Append a block at the end of the top-level blocks list.
 */
export function appendBlockToSpec(spec: SiteSpec, block: BlockSpec): SiteSpec {
    return { ...spec, blocks: [...spec.blocks, block] };
}
