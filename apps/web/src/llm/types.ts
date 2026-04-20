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

/**
 * Shared core-result of a raw LLM call (client invocation + parse +
 * registry validation). `generateSpec` and `refineSpec` both consume this
 * and map it onto their own public result shapes.
 *
 * `rawText` is the original response body (for debugging / optional
 * parse-out of auxiliary fields like `_explanation`).
 */
export type CoreResult =
    | { kind: 'ok';                spec: SiteSpec; rawText: string }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'invalid_json';      message: string; rawText?: string };

/**
 * Outcome of a single refineSpec() call. Same error kinds as
 * GenerateResult, but the success case returns the new spec plus an
 * optional short explanation the LLM may have included.
 */
export type RefineResult =
    | { kind: 'ok';                nextSpec: SiteSpec; explanation: string }
    | { kind: 'validation_failed'; errors: SpecError[]; rawInput: unknown }
    | { kind: 'api_error';         message: string }
    | { kind: 'missing_key' }
    | { kind: 'invalid_json';      message: string; rawText?: string };

/**
 * One entry in the chat history sent back to the LLM on each refine
 * turn. Kept intentionally minimal; Plan 05/06 will extend the chat UI
 * around it but the wire format to the LLM stays this shape.
 */
export interface ChatHistoryEntry {
    role: 'user' | 'assistant';
    content: string;
}
