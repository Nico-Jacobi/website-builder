import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refineSpec } from './refineSpec';
import { clearLog } from './logger';
import { clearTrace } from './llmTrace';
import type { SiteSpec } from '@website-builder/shared';

const originalFetch = globalThis.fetch;

const emptySpec: SiteSpec = { blocks: [] };

beforeEach(() => {
    clearLog();
    clearTrace();
});

afterEach(() => {
    globalThis.fetch = originalFetch;
});

describe('refineSpec (frontend fetch wrapper)', () => {
    it('returns ok with nextSpec + explanation from backend', async () => {
        const fakeResp = {
            kind:        'ok',
            nextSpec:    { blocks: [{ type: 'Header', props: { title: 'hi' } }] },
            explanation: 'Added a header.',
            log:         [],
            trace:       null,
        };
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response(JSON.stringify(fakeResp), { status: 200 })) as unknown as typeof fetch;

        const result = await refineSpec({
            currentSpec: emptySpec,
            history:     [],
            userMessage: 'add a header',
        });
        expect(result.kind).toBe('ok');
        if (result.kind === 'ok') {
            expect(result.nextSpec.blocks).toHaveLength(1);
            expect(result.explanation).toBe('Added a header.');
        }
    });

    it('returns api_error when fetch rejects', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
        const result = await refineSpec({
            currentSpec: emptySpec,
            history:     [],
            userMessage: 'anything',
        });
        expect(result.kind).toBe('api_error');
    });

    it('sends the correct body shape to /api/llm/refine', async () => {
        const spy = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({ kind: 'ok', nextSpec: { blocks: [] }, explanation: '', log: [], trace: null }),
                { status: 200 },
            ),
        );
        globalThis.fetch = spy as unknown as typeof fetch;
        await refineSpec({
            currentSpec: emptySpec,
            history:     [{ role: 'user', content: 'first' }],
            userMessage: 'second',
        });
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('/api/llm/refine'),
            expect.objectContaining({
                method: 'POST',
                body:   JSON.stringify({
                    currentSpec: emptySpec,
                    history:     [{ role: 'user', content: 'first' }],
                    userMessage: 'second',
                }),
            }),
        );
    });
});
