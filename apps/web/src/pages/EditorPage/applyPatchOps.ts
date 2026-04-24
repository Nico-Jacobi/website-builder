/**
 * applyPatchOps — Orchestrator, der eine `PatchOp[]` seriell gegen Backend
 * und lokalen `SiteSpec`-State anwendet.
 *
 * Ablauf pro Op (seriell, in stabiler Reihenfolge):
 *   1. removeBlock  → HTTP DELETE + aus nextSpec entfernen (inkl. Kinder-Cascade)
 *   2. moveBlock    → HTTP PATCH position + in nextSpec umhängen
 *   3. addBlock     → HTTP POST (Backend vergibt UUID) + in nextSpec einsetzen
 *   4. updateTone   → HTTP PATCH tone + in nextSpec setzen
 *   5. updateField  → HTTP PATCH content (direkter siteClient-Call, umgeht
 *                     das Debouncing des AutoSaveAdapters) + nextSpec.props
 *                     per `setNestedProp` mutieren
 *
 * Bei einem Fehler bricht die Schleife ab und gibt den bisherigen nextSpec-
 * Stand als `partial` zurück. Der Caller macht am Ende genau EINEN
 * `setSpec(result.nextSpec)`-Call — so rendert React nur einmal pro Chat-Turn
 * neu.
 *
 * Status für `updateField`-Calls wird NICHT an `blockOps` gemeldet — das
 * passiert über den `patchBlockContent`-Direktaufruf, der keinen Adapter hat.
 * Der `BlockOpsAdapter` deckt nur die anderen vier Op-Typen ab; das reicht
 * für die UX (der Header-Status-Dot blinkt während der Strukturänderungen,
 * und die Feld-Patches gehen typischerweise schnell durch).
 *
 * Image-Filling für neue Blöcke mit `imageQuery` ist bewusst NICHT Teil
 * dieser Funktion. `fillImages` läuft jetzt serverseitig im
 * `/api/llm/generate`-Endpoint (siehe `apps/api/src/services/llm/imageFiller.ts`).
 * Der initiale Generate-Pfad liefert deshalb eine bereits bildbefüllte Spec
 * zurück. Refine-Turns bekommen weiterhin keine neuen Bilder vom Backend —
 * neue Slots bleiben leer bis zum nächsten Generate-Turn bzw. bis der User
 * via Inline-Image-Picker manuell eines zuweist.
 */

import type { BlockSpec, SiteSpec } from '@website-builder/shared';
import type { PatchOp } from '../../diff/types';
import { setNestedProp } from '../../builder/propPath';
import { patchBlockContent } from '../../data/siteClient';
import type { BlockOpsAdapter } from '../../data/blockOps';

export interface ApplyPatchOpsArgs {
    ops:         PatchOp[];
    currentSpec: SiteSpec;
    identifier:  string;
    blockOps:    BlockOpsAdapter;
}

export type ApplyResult =
    | { kind: 'ok';      applied: number; nextSpec: SiteSpec }
    | {
          kind:     'partial';
          applied:  number;
          failedAt: PatchOp;
          error:    string;
          nextSpec: SiteSpec;
      };

/**
 * Stable execution order: theme first (independent of block state), then
 * removes (free up their positions), then moves, then adds, then tone
 * updates, then field updates. Matches what `diffSpecs` emits but we re-sort
 * defensively.
 */
function opSortIndex(op: PatchOp): number {
    switch (op.type) {
        case 'updateTheme': return 0;
        case 'removeBlock': return 1;
        case 'moveBlock':   return 2;
        case 'addBlock':    return 3;
        case 'updateTone':  return 4;
        case 'updateField': return 5;
    }
}

export async function applyPatchOps(args: ApplyPatchOpsArgs): Promise<ApplyResult> {
    const { ops, currentSpec, identifier, blockOps } = args;

    let nextSpec: SiteSpec = structuredClone(currentSpec);
    let applied = 0;

    const sorted = [...ops].sort((a, b) => opSortIndex(a) - opSortIndex(b));

    for (const op of sorted) {
        try {
            nextSpec = await applyOne(op, nextSpec, identifier, blockOps);
            applied++;
        } catch (err) {
            return {
                kind:     'partial',
                applied,
                failedAt: op,
                error:    err instanceof Error ? err.message : String(err),
                nextSpec,
            };
        }
    }

    return { kind: 'ok', applied, nextSpec };
}

// ---------------------------------------------------------------------------
// Per-op dispatch
// ---------------------------------------------------------------------------

async function applyOne(
    op:         PatchOp,
    spec:       SiteSpec,
    identifier: string,
    blockOps:   BlockOpsAdapter,
): Promise<SiteSpec> {
    switch (op.type) {
        case 'removeBlock': {
            await blockOps.removeBlock({ blockId: op.blockId });
            return removeBlockFromSpec(spec, op.blockId);
        }

        case 'moveBlock': {
            await blockOps.moveBlock({
                blockId:          op.blockId,
                newPosition:      op.newPosition,
                newParentBlockId: op.newParentBlockId,
            });
            return moveBlockInSpec(
                spec,
                op.blockId,
                op.newParentBlockId,
                op.newPosition,
            );
        }

        case 'addBlock': {
            const { id, position } = await blockOps.addBlock({
                parentBlockId: op.parentBlockId,
                position:      op.position,
                block:         op.block,
            });
            const blockWithId: BlockSpec = { ...op.block, id };
            return insertBlockInSpec(spec, blockWithId, op.parentBlockId, position);
        }

        case 'updateTone': {
            // Cast first (narrow from generic `string | null` to the enum),
            // then `?? null` peels `undefined` out of `BlockSpec['tone']`.
            // Do NOT reorder — a plain `?? null` before the cast lets
            // `undefined` back in via the target enum type.
            await blockOps.patchTone({
                blockId: op.blockId,
                tone:    op.tone as BlockSpec['tone'] | null ?? null,
            });
            return updateToneInSpec(spec, op.blockId, op.tone);
        }

        case 'updateTheme': {
            await blockOps.patchTheme({ theme: op.theme });
            return updateThemeInSpec(spec, op.theme);
        }

        case 'updateField': {
            // Direkter Call ans Backend: umgeht den Debounce des
            // AutoSaveAdapters, damit eine LLM-Op sofort persistiert wird.
            // Backend erwartet `string | null`; diffSpecs kann aber auch
            // number/boolean/Sentinels liefern — serialisieren statt casten.
            await patchBlockContent(
                identifier,
                op.blockId,
                op.path,
                serializeFieldValue(op.value),
            );
            return updateFieldInSpec(spec, op.blockId, op.path, op.value);
        }
    }
}

/**
 * Normalize a leaf-value emitted by `diffSpecs` into the `string | null` shape
 * that the backend content PATCH endpoint accepts. Primitives stringify as-is;
 * arrays/objects (incl. empty-sentinels) become JSON text.
 */
function serializeFieldValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}

// ---------------------------------------------------------------------------
// Pure spec-tree mutators (work on the cloned nextSpec — no in-place mutation
// of the caller's spec)
// ---------------------------------------------------------------------------

function mapBlocks(
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

function removeBlockFromSpec(spec: SiteSpec, blockId: string): SiteSpec {
    const blocks = mapBlocks(spec.blocks, (b) => (b.id === blockId ? null : b));
    return { ...spec, blocks };
}

function updateThemeInSpec(
    spec:  SiteSpec,
    theme: Record<string, string> | null,
): SiteSpec {
    if (theme === null) {
        const { theme: _theme, ...rest } = spec;
        void _theme;
        return rest as SiteSpec;
    }
    return { ...spec, theme };
}

function updateToneInSpec(
    spec:    SiteSpec,
    blockId: string,
    tone:    string | null,
): SiteSpec {
    const blocks = mapBlocks(spec.blocks, (b) => {
        if (b.id !== blockId) return b;
        if (tone === null) {
            const { tone: _tone, ...rest } = b;
            void _tone;
            return rest as BlockSpec;
        }
        return { ...b, tone: tone as BlockSpec['tone'] };
    });
    return { ...spec, blocks };
}

function updateFieldInSpec(
    spec:    SiteSpec,
    blockId: string,
    path:    string,
    value:   unknown,
): SiteSpec {
    const blocks = mapBlocks(spec.blocks, (b) => {
        if (b.id !== blockId) return b;
        return { ...b, props: setNestedProp(b.props, path, value) };
    });
    return { ...spec, blocks };
}

/**
 * Insert `block` at `position` below `parentBlockId`. If `parentBlockId` is
 * null, insertion happens at the spec's top level.
 */
function insertBlockInSpec(
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

function insertAt<T>(arr: readonly T[], item: T, index: number): T[] {
    const clamped = Math.max(0, Math.min(arr.length, index));
    return [...arr.slice(0, clamped), item, ...arr.slice(clamped)];
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
function moveBlockInSpec(
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
