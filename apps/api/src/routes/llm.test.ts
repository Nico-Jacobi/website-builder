import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { llmRouter } from './llm';
import { __resetClientForTests } from '../services/llm/client';

const app = new Hono();
app.route('/api/llm', llmRouter);

async function req(path: string, body: unknown): Promise<Response> {
    return app.request(path, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(body),
    });
}

const originalKey = process.env.GOOGLE_API_KEY;

beforeEach(() => {
    __resetClientForTests();
    delete process.env.GOOGLE_API_KEY;
});

afterEach(() => {
    __resetClientForTests();
    if (originalKey !== undefined) {
        process.env.GOOGLE_API_KEY = originalKey;
    }
});

describe('POST /api/llm/generate', () => {
    it('rejects invalid body shape with 400', async () => {
        const resp = await req('/api/llm/generate', { wrong: 'shape' });
        expect(resp.status).toBe(400);
    });

    it('rejects empty userPrompt', async () => {
        const resp = await req('/api/llm/generate', { userPrompt: '   ' });
        expect(resp.status).toBe(400);
    });

    it('rejects overly long userPrompt', async () => {
        const resp = await req('/api/llm/generate', { userPrompt: 'x'.repeat(10_001) });
        expect(resp.status).toBe(400);
    });

    it('returns missing_key kind when no API key is set', async () => {
        const resp = await req('/api/llm/generate', { userPrompt: 'hi' });
        expect(resp.status).toBe(200);
        const body = (await resp.json()) as { kind: string; log: unknown[] };
        expect(body.kind).toBe('missing_key');
        expect(Array.isArray(body.log)).toBe(true);
    });
});

describe('POST /api/llm/refine', () => {
    it('rejects invalid body shape', async () => {
        const resp = await req('/api/llm/refine', { foo: 'bar' });
        expect(resp.status).toBe(400);
    });

    it('rejects missing userMessage', async () => {
        const resp = await req('/api/llm/refine', {
            currentSpec: { blocks: [] },
            history: [],
        });
        expect(resp.status).toBe(400);
    });

    it('returns missing_key kind when no API key is set', async () => {
        const resp = await req('/api/llm/refine', {
            currentSpec: { blocks: [] },
            history:     [],
            userMessage: 'hi',
        });
        expect(resp.status).toBe(200);
        const body = (await resp.json()) as { kind: string };
        expect(body.kind).toBe('missing_key');
    });
});
