import type { SiteSpec } from '../builder/schemas';
import type { SpecError } from '../builder/validateSpec';

/**
 * Outcome of a single generateSpec() call. Discriminated by `kind` so
 * callers can exhaustively handle each case at compile time.
 */
export type GenerateResult =
    | { kind: 'ok';                spec: SiteSpec }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'invalid_json';      message: string; rawText?: string };
