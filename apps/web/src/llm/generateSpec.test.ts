import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GoogleGenAI } from '@google/genai';
import { generateSpec } from './generateSpec';
import { __resetClientForTests } from './client';

/**
 * Builds a minimal GoogleGenAI-like mock whose `models.generateContent`
 * resolves or rejects as specified. The cast via `unknown as GoogleGenAI`
 * is intentional — we only exercise the one method.
 */
function mockClient(
    impl:
        | { resolve: { text?: string } }
        | { reject: unknown },
): GoogleGenAI {
    const generateContent =
        'resolve' in impl
            ? vi.fn().mockResolvedValue(impl.resolve)
            : vi.fn().mockRejectedValue(impl.reject);
    return { models: { generateContent } } as unknown as GoogleGenAI;
}

const VALID_SPEC = {
    blocks: [
        {
            type: 'Header',
            props: { title: 'Hello', subtitle: 'World' },
        },
    ],
};

describe('generateSpec', () => {
    beforeEach(() => {
        // Make sure no cached production client leaks into a test.
        __resetClientForTests();
    });

    it('returns { kind: "ok" } on happy path with valid JSON response', async () => {
        const client = mockClient({
            resolve: { text: JSON.stringify(VALID_SPEC) },
        });

        const result = await generateSpec('Build me a page', { client });

        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.spec.blocks).toHaveLength(1);
            expect(result.spec.blocks[0].type).toBe('Header');
        }
    });

    it('returns { kind: "missing_key" } when no client is available', async () => {
        const result = await generateSpec('anything', { client: null });
        expect(result).toEqual({ kind: 'missing_key' });
    });

    it('returns { kind: "api_error" } when generateContent throws', async () => {
        const client = mockClient({ reject: new Error('401 unauthorized') });

        const result = await generateSpec('hi', { client });

        expect(result.kind).toBe('api_error');
        if (result.kind === 'api_error') {
            expect(result.message).toBe('401 unauthorized');
        }
    });

    it('returns { kind: "invalid_json" } when the response has no text', async () => {
        const client = mockClient({
            resolve: { text: '' },
        });

        const result = await generateSpec('hi', { client });

        expect(result.kind).toBe('invalid_json');
        if (result.kind === 'invalid_json') {
            expect(result.message).toMatch(/no text/i);
        }
    });

    it('returns { kind: "invalid_json" } with rawText when response is not valid JSON', async () => {
        const client = mockClient({
            resolve: { text: 'not valid json {' },
        });

        const result = await generateSpec('hi', { client });

        expect(result.kind).toBe('invalid_json');
        if (result.kind === 'invalid_json') {
            expect(result.message).toMatch(/not valid JSON/i);
            expect(result.rawText).toBe('not valid json {');
        }
    });

    it('returns { kind: "validation_failed" } for unknown module types', async () => {
        const badInput = {
            blocks: [{ type: 'DoesNotExist', props: {} }],
        };
        const client = mockClient({
            resolve: { text: JSON.stringify(badInput) },
        });

        const result = await generateSpec('x', { client });

        expect(result.kind).toBe('validation_failed');
        if (result.kind === 'validation_failed') {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].path).toBe('blocks[0]');
            expect(result.errors[0].message).toMatch(/DoesNotExist/);
            expect(result.rawInput).toEqual(badInput);
        }
    });

    it('returns { kind: "validation_failed" } when props do not match the module schema', async () => {
        const badInput = {
            // Header requires `title`
            blocks: [{ type: 'Header', props: {} }],
        };
        const client = mockClient({
            resolve: { text: JSON.stringify(badInput) },
        });

        const result = await generateSpec('x', { client });

        expect(result.kind).toBe('validation_failed');
        if (result.kind === 'validation_failed') {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((e) => e.path.includes('blocks[0].props'))).toBe(true);
            expect(result.rawInput).toEqual(badInput);
        }
    });
});
