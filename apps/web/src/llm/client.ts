import { GoogleGenAI } from '@google/genai';

/**
 * Lazy-initialised Google GenAI SDK instance.
 *
 * Reads VITE_GOOGLE_API_KEY from Vite env. If empty/missing, returns null
 * — callers then short-circuit with a user-visible "missing key" message
 * instead of attempting a doomed network call.
 *
 * Security note: The API key is bundled into the client-side build (Vite
 * exposes any VITE_*-prefixed env var to the browser). For this local dev
 * demo, that's intentional and acceptable. See .env.example for the caveat.
 */
let cached: GoogleGenAI | null | undefined;

export function getClient(): GoogleGenAI | null {
    if (cached !== undefined) return cached;

    const key = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!key || typeof key !== 'string' || key.trim() === '') {
        cached = null;
        return null;
    }

    cached = new GoogleGenAI({ apiKey: key });
    return cached;
}

/** For tests only — clears the memoised client so env changes take effect. */
export function __resetClientForTests(): void {
    cached = undefined;
}
