import { patchBlockContent, uploadAsset as uploadAssetHttp } from './siteClient';
import type { AutoSaveAdapter, SaveStatus } from '../builder/autoSaveTypes';

interface AutoSaveOptions {
    identifier: string;
    debounceMs?: number;
    savedResetMs?: number;
}

export function makeAutoSaveAdapter({
    identifier,
    debounceMs = 500,
    savedResetMs = 2000,
}: AutoSaveOptions): AutoSaveAdapter & { dispose: () => void } {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
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
            await patchBlockContent(identifier, blockId, fieldPath, value as string | null);
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
            if (existing) clearTimeout(existing);

            timers.set(
                key,
                setTimeout(() => {
                    timers.delete(key);
                    void executePatch(blockId, fieldPath, value);
                }, debounceMs),
            );
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
            disposed = true;
            timers.forEach(clearTimeout);
            timers.clear();
            if (resetTimer) clearTimeout(resetTimer);
            listeners.clear();
        },
    };
}
