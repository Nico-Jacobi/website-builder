import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GoogleGenAI } from '@google/genai';
import { refineSpec, composeRefineUserPrompt, REFINE_HISTORY_MAX } from './refineSpec';
import { __resetClientForTests } from './client';
import type { SiteSpec } from '../builder/schemas';
import type { ChatHistoryEntry } from './types';

/**
 * Minimal GoogleGenAI-like mock. Same pattern as in generateSpec.test.ts:
 * we only use the one method, so the cast via `unknown as GoogleGenAI`
 * is intentional.
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

const CURRENT_SPEC: SiteSpec = {
    blocks: [
        {
            id: 'block-1',
            type: 'Header',
            props: { title: 'Old Title', subtitle: 'Old Sub' },
        },
    ],
};

const NEXT_SPEC_WITH_ID = {
    blocks: [
        {
            id: 'block-1',
            type: 'Header',
            props: { title: 'New Title', subtitle: 'New Sub' },
        },
    ],
};

describe('refineSpec', () => {
    beforeEach(() => {
        __resetClientForTests();
    });

    it('returns { kind: "ok" } with the parsed next spec on happy path', async () => {
        const client = mockClient({
            resolve: { text: JSON.stringify(NEXT_SPEC_WITH_ID) },
        });

        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'change the heading',
            client,
        });

        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks).toHaveLength(1);
            expect(result.nextSpec.blocks[0].type).toBe('Header');
            // Explanation defaults to '' when the model didn't send one.
            expect(result.explanation).toBe('');
        }
    });

    it('preserves block ids returned by the model', async () => {
        const client = mockClient({
            resolve: { text: JSON.stringify(NEXT_SPEC_WITH_ID) },
        });

        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'change the heading',
            client,
        });

        if (result.kind !== 'ok') throw new Error(`unexpected kind ${result.kind}`);
        expect(result.nextSpec.blocks[0].id).toBe('block-1');
    });

    it('extracts the optional _explanation field from the raw response', async () => {
        const withExplanation = {
            _explanation: 'Updated the header title.',
            ...NEXT_SPEC_WITH_ID,
        };
        const client = mockClient({
            resolve: { text: JSON.stringify(withExplanation) },
        });

        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'change the heading',
            client,
        });

        if (result.kind !== 'ok') throw new Error(`unexpected kind ${result.kind}`);
        expect(result.explanation).toBe('Updated the header title.');
        // The _explanation field is stripped from the stored spec (Zod
        // non-strict parse silently drops it).
        expect((result.nextSpec as unknown as Record<string, unknown>)._explanation).toBeUndefined();
    });

    it('returns { kind: "missing_key" } when no client is available', async () => {
        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'anything',
            client: null,
        });
        expect(result).toEqual({ kind: 'missing_key' });
    });

    it('returns { kind: "api_error" } when generateContent throws', async () => {
        const client = mockClient({ reject: new Error('429 quota') });

        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'boom',
            client,
        });

        expect(result.kind).toBe('api_error');
        if (result.kind === 'api_error') {
            expect(result.message).toBe('429 quota');
        }
    });

    it('returns { kind: "invalid_json" } when response is not JSON', async () => {
        const client = mockClient({
            resolve: { text: 'not json at all' },
        });

        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'hi',
            client,
        });

        expect(result.kind).toBe('invalid_json');
        if (result.kind === 'invalid_json') {
            expect(result.rawText).toBe('not json at all');
        }
    });

    it('returns { kind: "validation_failed" } for unknown module type', async () => {
        const badNextSpec = {
            blocks: [{ type: 'DoesNotExist', props: {} }],
        };
        const client = mockClient({
            resolve: { text: JSON.stringify(badNextSpec) },
        });

        const result = await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: [],
            userMessage: 'x',
            client,
        });

        expect(result.kind).toBe('validation_failed');
        if (result.kind === 'validation_failed') {
            expect(result.errors[0].message).toMatch(/DoesNotExist/);
            expect(result.rawInput).toEqual(badNextSpec);
        }
    });

    it('trims history to REFINE_HISTORY_MAX entries before sending', async () => {
        const generateContent = vi
            .fn()
            .mockResolvedValue({ text: JSON.stringify(NEXT_SPEC_WITH_ID) });
        const client = { models: { generateContent } } as unknown as GoogleGenAI;

        // Build an over-long history.
        const longHistory: ChatHistoryEntry[] = [];
        for (let i = 0; i < REFINE_HISTORY_MAX + 5; i++) {
            longHistory.push({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `turn-${i}`,
            });
        }

        await refineSpec({
            currentSpec: CURRENT_SPEC,
            history: longHistory,
            userMessage: 'next',
            client,
        });

        expect(generateContent).toHaveBeenCalledTimes(1);
        const callArg = generateContent.mock.calls[0][0] as { contents: string };
        // The earliest turns must have been dropped; only the final N stay.
        const firstExpectedKept = `turn-${longHistory.length - REFINE_HISTORY_MAX}`;
        const firstDropped = 'turn-0';
        expect(callArg.contents).toContain(firstExpectedKept);
        expect(callArg.contents).not.toContain(`: ${firstDropped}\n`);
    });
});

describe('composeRefineUserPrompt', () => {
    it('includes the three labelled sections', () => {
        const out = composeRefineUserPrompt(CURRENT_SPEC, [], 'hello');
        expect(out).toContain('CURRENT_SPEC:');
        expect(out).toContain('HISTORY:');
        expect(out).toContain('USER_MESSAGE:');
        expect(out).toContain('hello');
    });

    it('embeds the current spec as pretty-printed JSON', () => {
        const out = composeRefineUserPrompt(CURRENT_SPEC, [], '');
        expect(out).toContain(JSON.stringify(CURRENT_SPEC, null, 2));
    });

    it('renders empty history as "(none)"', () => {
        const out = composeRefineUserPrompt(CURRENT_SPEC, [], 'x');
        expect(out).toContain('HISTORY:\n(none)');
    });

    it('renders history turns with uppercased roles', () => {
        const history: ChatHistoryEntry[] = [
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'second' },
        ];
        const out = composeRefineUserPrompt(CURRENT_SPEC, history, 'x');
        expect(out).toContain('USER: first');
        expect(out).toContain('ASSISTANT: second');
    });
});
