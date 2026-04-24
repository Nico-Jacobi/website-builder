import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateSpec } from './generateSpec';
import { clearLog, getLogSnapshot } from './logger';
import { clearTrace, getTrace } from './llmTrace';

const originalFetch = globalThis.fetch;

beforeEach(() => {
    clearLog();
    clearTrace();
});

afterEach(() => {
    globalThis.fetch = originalFetch;
});

describe('generateSpec (frontend fetch wrapper)', () => {
    it('returns ok and pushes log + trace into stores', async () => {
        const fakeResp = {
            kind:  'ok',
            spec:  { blocks: [] },
            log:   [{ id: 0, ts: 1, level: 'ok', message: 'Done' }],
            trace: { systemPrompt: 'sys', userPrompt: 'usr', rawResponse: '{}' },
        };
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response(JSON.stringify(fakeResp), { status: 200 })) as unknown as typeof fetch;

        const result = await generateSpec('hi');
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') expect(result.spec.blocks).toEqual([]);
        expect(getLogSnapshot()).toHaveLength(1);
        expect(getTrace()?.systemPrompt).toBe('sys');
    });

    it('returns api_error when fetch rejects', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch;
        const result = await generateSpec('hi');
        expect(result.kind).toBe('api_error');
        if (result.kind === 'api_error') expect(result.message).toContain('boom');
    });

    it('returns api_error on non-2xx response', async () => {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response('nope', { status: 500 })) as unknown as typeof fetch;
        const result = await generateSpec('hi');
        expect(result.kind).toBe('api_error');
    });

    it('passes userPrompt in the request body', async () => {
        const spy = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({ kind: 'ok', spec: { blocks: [] }, log: [], trace: null }),
                { status: 200 },
            ),
        );
        globalThis.fetch = spy as unknown as typeof fetch;
        await generateSpec('my prompt');
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('/api/llm/generate'),
            expect.objectContaining({
                method: 'POST',
                body:   JSON.stringify({ userPrompt: 'my prompt' }),
            }),
        );
    });

    it('propagates non-ok kinds (missing_key) without a spec field', async () => {
        const fakeResp = { kind: 'missing_key', log: [], trace: null };
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response(JSON.stringify(fakeResp), { status: 200 })) as unknown as typeof fetch;
        const result = await generateSpec('hi');
        expect(result.kind).toBe('missing_key');
    });
});
