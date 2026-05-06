import { patchBlockContent, uploadAsset as uploadAssetHttp } from './siteClient';
import { putChrome } from './chromeClient';
import type { AutoSaveAdapter, SaveStatus } from '../builder/autoSaveTypes';
import type { SiteChrome } from '@website-builder/shared';

interface AutoSaveOptions {
    identifier: string;
    debounceMs?: number;
    savedResetMs?: number;
}

interface PendingTimer {
    timerId: ReturnType<typeof setTimeout>;
    blockId: string;
    fieldPath: string;
    value: unknown;
}

function serializeFieldValue(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
}

export function makeAutoSaveAdapter({
    identifier,
    debounceMs = 500,
    savedResetMs = 2000,
}: AutoSaveOptions): AutoSaveAdapter & { dispose: () => void } {
    const timers = new Map<string, PendingTimer>();
    const listeners = new Set<(s: SaveStatus) => void>();
    let status: SaveStatus = 'idle';
    let inflight = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function setStatus(next: SaveStatus) {
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

    async function executePatch(blockId: string, fieldPath: string, value: unknown) {
        if (disposed) return;
        inflight++;
        setStatus('saving');
        try {
            await patchBlockContent(identifier, blockId, fieldPath, serializeFieldValue(value));
            inflight--;
            if (!disposed && inflight === 0 && status === 'saving') setStatus('saved');
        } catch {
            inflight--;
            if (!disposed) setStatus('error');
        }
    }

    return {
        patchContent(blockId, fieldPath, value) {
            if (disposed) return;
            const key = `${blockId}:${fieldPath}`;
            const existing = timers.get(key);
            if (existing) clearTimeout(existing.timerId);

            const timerId = setTimeout(() => {
                timers.delete(key);
                void executePatch(blockId, fieldPath, value);
            }, debounceMs);
            timers.set(key, { timerId, blockId, fieldPath, value });
        },

        async uploadAsset(file) {
            if (disposed) throw new Error('autoSave adapter disposed');
            inflight++;
            setStatus('saving');
            try {
                const result = await uploadAssetHttp(identifier, file);
                inflight--;
                if (!disposed && inflight === 0 && status === 'saving') setStatus('saved');
                return result;
            } catch (err) {
                inflight--;
                if (!disposed) setStatus('error');
                throw err;
            }
        },

        subscribe(cb) {
            listeners.add(cb);
            return () => { listeners.delete(cb); };
        },

        getStatus() {
            return status;
        },

        dispose() {
            // Flush all pending debounced patches synchronously before disposing
            // so that in-flight typed changes are not silently dropped.
            timers.forEach((entry) => {
                clearTimeout(entry.timerId);
                void executePatch(entry.blockId, entry.fieldPath, entry.value);
            });
            timers.clear();
            disposed = true;
            if (resetTimer) clearTimeout(resetTimer);
            listeners.clear();
        },
    };
}

// ── Chrome Auto-Save (module-level, not tied to an adapter instance) ──────────
// Chrome is a whole-replace PUT, so we only keep the most-recent pending value
// and debounce it with a 1500ms delay. `flushAutoSave` drains this before any
// page-navigation so edits are never lost during a page switch.

let pendingChromeSave: { identifier: string; chrome: SiteChrome } | undefined;
let chromeTimer: ReturnType<typeof setTimeout> | null = null;
let chromeSavePromise: Promise<void> | null = null;
let chromeResolve: (() => void) | null = null;

const CHROME_DEBOUNCE_MS = 1500;

export function scheduleChromeSave(identifier: string, chrome: SiteChrome): void {
    pendingChromeSave = { identifier, chrome };

    if (chromeTimer !== null) {
        clearTimeout(chromeTimer);
    }

    // If there's no in-progress flush promise, create one so flushAutoSave can await it.
    if (chromeSavePromise === null) {
        chromeSavePromise = new Promise<void>((resolve) => {
            chromeResolve = resolve;
        });
    }

    chromeTimer = setTimeout(() => {
        chromeTimer = null;
        const snapshot = pendingChromeSave;
        pendingChromeSave = undefined;
        const resolve = chromeResolve;
        chromeSavePromise = null;
        chromeResolve = null;
        if (snapshot) {
            void putChrome(snapshot.identifier, snapshot.chrome).finally(() => {
                resolve?.();
            });
        } else {
            resolve?.();
        }
    }, CHROME_DEBOUNCE_MS);
}

/**
 * Flush any pending chrome save immediately (bypassing the debounce).
 * Called before page navigation to ensure no edits are lost.
 */
export async function flushAutoSave(): Promise<void> {
    if (chromeTimer !== null) {
        clearTimeout(chromeTimer);
        chromeTimer = null;

        const snapshot = pendingChromeSave;
        pendingChromeSave = undefined;
        const resolve = chromeResolve;
        chromeSavePromise = null;
        chromeResolve = null;

        if (snapshot) {
            await putChrome(snapshot.identifier, snapshot.chrome);
        }
        resolve?.();
        return;
    }

    // If a save is already in-flight (timer fired, putChrome running), await it.
    if (chromeSavePromise !== null) {
        await chromeSavePromise;
    }
}
