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
import {
    mapBlocks,
    moveBlockInSpec,
    removeBlockFromSpec,
    insertBlockInSpec,
} from './specOps';

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
        case 'updateTheme':  return 0;
        case 'updateChrome': return 0;
        case 'removeBlock':  return 1;
        case 'moveBlock':    return 2;
        case 'addBlock':     return 3;
        case 'updateTone':   return 4;
        case 'updateField':  return 5;
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

        case 'updateChrome': {
            // Chrome updates are applied locally; persistence is handled by
            // the chrome-specific endpoint (see Plan 03.3 / AutoSave routing).
            return { ...spec, chrome: op.chrome };
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
// of the caller's spec). Block-structural helpers (move/remove/insert/mapBlocks)
// live in `./specOps.ts`; theme/tone/field mutators stay here because they are
// only relevant to the LLM-diff pipeline.
// ---------------------------------------------------------------------------

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

