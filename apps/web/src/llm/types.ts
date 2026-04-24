import type { SiteSpec, SpecError } from '@website-builder/shared';

/**
 * Ergebnis eines `generateSpec()`-Calls (Frontend-Sicht, nach fetch).
 * Discriminated per `kind`. `log` und `trace` werden von den Wrappern in
 * die Pub/Sub-Stores geschrieben und vor der Rückgabe entfernt.
 */
export type GenerateResult =
    | { kind: 'ok';                spec: SiteSpec }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'safety_block';      message: string }
    | { kind: 'invalid_json';      message: string };

export type RefineResult =
    | { kind: 'ok';                nextSpec: SiteSpec; explanation: string }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'safety_block';      message: string }
    | { kind: 'invalid_json';      message: string };

export interface ChatHistoryEntry {
    role: 'user' | 'assistant';
    content: string;
}
