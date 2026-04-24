/**
 * BlockOpsAdapter — Frontend-Factory für strukturelle Block-Operationen
 * (addBlock, removeBlock, moveBlock, patchTone). Analog zu `autoSave.ts`,
 * aber ohne Debounce: Jeder Call geht sofort ans Backend, weil diese Ops
 * vom LLM-Diff kommen und in definierter Reihenfolge seriell ausgeführt
 * werden müssen (siehe `applyPatchOps`).
 *
 * Status-Semantik identisch zu `AutoSaveAdapter`:
 *   idle → saving → saved → idle (nach savedResetMs)
 * Auf Fehler wird 'error' gesetzt und bleibt bis zum nächsten erfolgreichen
 * Call hängen.
 */

import {
    addBlock as addBlockHttp,
    removeBlock as removeBlockHttp,
    moveBlock as moveBlockHttp,
    patchBlockTone as patchBlockToneHttp,
    patchSiteTheme as patchSiteThemeHttp,
} from './siteClient';
import type { BlockSpec, Tone } from '@website-builder/shared';
import type { SaveStatus } from '../builder/autoSaveTypes';

export interface BlockOpsAdapter {
    addBlock(opts: {
        parentBlockId?: string | null;
        position:       number;
        block:          BlockSpec;
    }): Promise<{ id: string; position: number }>;

    removeBlock(opts: { blockId: string }): Promise<void>;

    moveBlock(opts: {
        blockId:           string;
        newPosition:       number;
        newParentBlockId?: string | null;
    }): Promise<void>;

    patchTone(opts: { blockId: string; tone: Tone | null }): Promise<void>;

    patchTheme(opts: { theme: Record<string, string> | null }): Promise<void>;

    subscribe(cb: (s: SaveStatus) => void): () => void;
    getStatus(): SaveStatus;
    dispose(): void;
}

export interface MakeBlockOpsAdapterOptions {
    identifier:    string;
    savedResetMs?: number;
}

export function makeBlockOpsAdapter({
    identifier,
    savedResetMs = 2000,
}: MakeBlockOpsAdapterOptions): BlockOpsAdapter {
    const listeners = new Set<(s: SaveStatus) => void>();
    let status: SaveStatus = 'idle';
    let inflight = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function setStatus(next: SaveStatus): void {
        if (next === status) return;
        status = next;
        listeners.forEach((cb) => cb(status));

        if (resetTimer) {
            clearTimeout(resetTimer);
            resetTimer = null;
        }
        if (next === 'saved') {
            resetTimer = setTimeout(() => {
                resetTimer = null;
                if (status === 'saved') setStatus('idle');
            }, savedResetMs);
        }
    }

    async function withStatus<T>(fn: () => Promise<T>): Promise<T> {
        if (disposed) throw new Error('blockOps adapter disposed');
        inflight++;
        setStatus('saving');
        try {
            const result = await fn();
            inflight--;
            if (!disposed && inflight === 0 && status === 'saving') {
                setStatus('saved');
            }
            return result;
        } catch (err) {
            inflight--;
            if (!disposed) setStatus('error');
            throw err;
        }
    }

    return {
        addBlock(opts) {
            return withStatus(() =>
                addBlockHttp({
                    identifier,
                    parentBlockId: opts.parentBlockId ?? null,
                    position:      opts.position,
                    block:         opts.block,
                }),
            );
        },

        removeBlock(opts) {
            return withStatus(() =>
                removeBlockHttp({ identifier, blockId: opts.blockId }),
            );
        },

        moveBlock(opts) {
            return withStatus(() =>
                moveBlockHttp({
                    identifier,
                    blockId:          opts.blockId,
                    newPosition:      opts.newPosition,
                    newParentBlockId: opts.newParentBlockId,
                }),
            );
        },

        patchTone(opts) {
            return withStatus(() =>
                patchBlockToneHttp({
                    identifier,
                    blockId: opts.blockId,
                    tone:    opts.tone,
                }),
            );
        },

        patchTheme(opts) {
            return withStatus(() => patchSiteThemeHttp(identifier, opts.theme));
        },

        subscribe(cb) {
            listeners.add(cb);
            return () => { listeners.delete(cb); };
        },

        getStatus() {
            return status;
        },

        dispose() {
            disposed = true;
            if (resetTimer) clearTimeout(resetTimer);
            listeners.clear();
        },
    };
}
