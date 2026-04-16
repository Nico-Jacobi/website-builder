import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearState,
    loadState,
    savePrompt,
    saveSpec,
    saveState,
} from './specStore';
import type { SiteSpec } from '../builder/schemas';

const STORAGE_KEY = 'website-builder:state';

const validSpec: SiteSpec = {
    blocks: [{ type: 'TextBlock', props: { body: 'hi' } }],
};

describe('specStore', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('returns default state when storage is empty', () => {
        expect(loadState()).toEqual({ prompt: '', spec: null });
    });

    it('roundtrips a full state via saveState/loadState', () => {
        saveState({ prompt: 'hello', spec: validSpec });
        expect(loadState()).toEqual({ prompt: 'hello', spec: validSpec });
    });

    it('savePrompt preserves existing spec', () => {
        saveSpec(validSpec);
        savePrompt('x');
        const state = loadState();
        expect(state.prompt).toBe('x');
        expect(state.spec).toEqual(validSpec);
    });

    it('saveSpec preserves existing prompt', () => {
        savePrompt('keep me');
        saveSpec(validSpec);
        const state = loadState();
        expect(state.prompt).toBe('keep me');
        expect(state.spec).toEqual(validSpec);
    });

    it('returns default on corrupt JSON', () => {
        window.localStorage.setItem(STORAGE_KEY, '{{{ not json');
        expect(loadState()).toEqual({ prompt: '', spec: null });
    });

    it('falls back per-field on shape mismatch', () => {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ prompt: 42, spec: 'not an object' }),
        );
        expect(loadState()).toEqual({ prompt: '', spec: null });
    });

    it('clearState removes the storage entry', () => {
        saveState({ prompt: 'a', spec: validSpec });
        clearState();
        expect(loadState()).toEqual({ prompt: '', spec: null });
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});
