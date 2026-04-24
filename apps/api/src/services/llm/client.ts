import { GoogleGenAI } from '@google/genai';

/**
 * Lazy-initialised Google GenAI SDK instance.
 *
 * Liest GOOGLE_API_KEY aus process.env. Wenn leer/fehlend, wird null
 * zurückgegeben — Aufrufer short-circuiten dann mit "missing_key".
 */
let cached: GoogleGenAI | null | undefined;

export function getClient(): GoogleGenAI | null {
    if (cached !== undefined) return cached;

    const key = process.env.GOOGLE_API_KEY;
    if (!key || typeof key !== 'string' || key.trim() === '') {
        cached = null;
        return null;
    }

    cached = new GoogleGenAI({ apiKey: key });
    return cached;
}

/** Für Tests: Singleton zurücksetzen, damit ENV-Änderungen greifen. */
export function __resetClientForTests(): void {
    cached = undefined;
}
