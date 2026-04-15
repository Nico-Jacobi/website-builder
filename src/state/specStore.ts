import type { SiteSpec } from '../builder/schemas';

/**
 * Persisted state shape. Everything that should survive reloads and
 * new tabs lives here.
 */
export interface StoredState {
    /** Last entered prompt text. Empty string if nothing has been typed. */
    prompt: string;
    /** Last successfully generated spec. Null if none yet. */
    spec: SiteSpec | null;
}

const STORAGE_KEY = 'website-builder:state';
const DEFAULT: StoredState = { prompt: '', spec: null };

/**
 * Reads the full persisted state from localStorage.
 *
 * Returns DEFAULT on: unavailable storage, missing key, invalid JSON,
 * or shape mismatch. Bad data never crashes the app, it resets.
 */
export function loadState(): StoredState {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return DEFAULT;
        return {
            prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
            spec: isSpecShape(parsed.spec) ? (parsed.spec as SiteSpec) : null,
        };
    } catch {
        return DEFAULT;
    }
}

/** Overwrites the full persisted state. Silently no-ops on write errors. */
export function saveState(state: StoredState): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('specStore.saveState failed', err);
    }
}

/** Update only the prompt field, leave spec intact. */
export function savePrompt(prompt: string): void {
    const current = loadState();
    saveState({ ...current, prompt });
}

/** Update only the spec field, leave prompt intact. */
export function saveSpec(spec: SiteSpec): void {
    const current = loadState();
    saveState({ ...current, spec });
}

/** Clears everything. */
export function clearState(): void {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.warn('specStore.clearState failed', err);
    }
}

function isSpecShape(v: unknown): v is SiteSpec {
    return (
        !!v &&
        typeof v === 'object' &&
        Array.isArray((v as SiteSpec).blocks)
    );
}
