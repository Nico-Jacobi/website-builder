import 'dotenv/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { sql as drizzleSql } from 'drizzle-orm';
import { sitesRouter } from './sites';
import { db } from '../db/client';

// Mount the router under /api/sites so all paths match production.
const app = new Hono();
app.route('/api/sites', sitesRouter);

async function req(
    method: string,
    path: string,
    body?: unknown,
): Promise<Response> {
    const init: RequestInit = { method };
    if (body !== undefined) {
        init.headers = { 'content-type': 'application/json' };
        init.body = JSON.stringify(body);
    }
    return app.request(path, init);
}

async function createDraftSite(
    name: string,
    initialPrompt: string = 'Test-Prompt',
): Promise<{ id: string; identifier: string }> {
    const resp = await req('POST', '/api/sites', { name, initialPrompt });
    expect(resp.status).toBe(201);
    const data = (await resp.json()) as { id: string; identifier: string };
    return data;
}

async function cleanAll() {
    await db.execute(drizzleSql`TRUNCATE TABLE site_messages, block_content, page_blocks, pages, assets, sites RESTART IDENTITY CASCADE`);
}

beforeAll(async () => {
    // Ensure tables exist. Drizzle-kit push is expected to have been run.
});

afterAll(async () => {
    // Leave the DB intact (other tests may depend on it).
});

beforeEach(async () => {
    await cleanAll();
});

describe('POST /api/sites', () => {
    it('creates a draft site with auto-generated identifier', async () => {
        const resp = await req('POST', '/api/sites', {
            name:          'My Draft',
            initialPrompt: 'Beschreibung der Site',
        });
        expect(resp.status).toBe(201);
        const data = (await resp.json()) as { id: string; identifier: string; name: string };
        expect(data.name).toBe('My Draft');
        expect(data.identifier).toMatch(/^draft-[a-z0-9]{6}$/);
        expect(data.id).toBeTruthy();
    });

    it('rejects empty name', async () => {
        const resp = await req('POST', '/api/sites', { name: '   ', initialPrompt: 'desc' });
        expect(resp.status).toBe(400);
    });

    it('rejects overly long name', async () => {
        const resp = await req('POST', '/api/sites', {
            name:          'x'.repeat(201),
            initialPrompt: 'desc',
        });
        expect(resp.status).toBe(400);
    });

    it('rejects missing initialPrompt', async () => {
        const resp = await req('POST', '/api/sites', { name: 'x' });
        expect(resp.status).toBe(400);
    });

    it('rejects empty initialPrompt', async () => {
        const resp = await req('POST', '/api/sites', { name: 'x', initialPrompt: '   ' });
        expect(resp.status).toBe(400);
    });

    it('rejects overly long initialPrompt', async () => {
        const resp = await req('POST', '/api/sites', {
            name:          'x',
            initialPrompt: 'a'.repeat(2001),
        });
        expect(resp.status).toBe(400);
    });

    it('trims initialPrompt and persists it on the meta endpoint', async () => {
        const { identifier } = await createDraftSite('Site', '  hallo welt  ');
        const get = await req('GET', `/api/sites/${identifier}`);
        const data = (await get.json()) as { initialPrompt: string | null };
        expect(data.initialPrompt).toBe('hallo welt');
    });
});

describe('GET /api/sites/:identifier meta', () => {
    it('returns initialPrompt on the meta endpoint', async () => {
        const { identifier } = await createDraftSite('Site', 'beschreibung');
        const resp = await req('GET', `/api/sites/${identifier}`);
        expect(resp.status).toBe(200);
        const data = (await resp.json()) as { initialPrompt: string | null };
        expect(data.initialPrompt).toBe('beschreibung');
    });

    it('clears initialPrompt after the first addBlock', async () => {
        const { identifier } = await createDraftSite('Site', 'beschreibung');

        const ins = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block:    { type: 'TextBlock', props: { heading: 'h', body: 'b' } },
        });
        expect(ins.status).toBe(201);

        const resp = await req('GET', `/api/sites/${identifier}`);
        const data = (await resp.json()) as { initialPrompt: string | null };
        expect(data.initialPrompt).toBeNull();
    });
});

describe('PATCH /api/sites/:identifier', () => {
    it('renames a site', async () => {
        const { identifier } = await createDraftSite('Old Name');
        const resp = await req('PATCH', `/api/sites/${identifier}`, { name: 'New Name' });
        expect(resp.status).toBe(204);

        const get = await req('GET', `/api/sites/${identifier}`);
        const data = (await get.json()) as { name: string };
        expect(data.name).toBe('New Name');
    });

    it('returns 404 for unknown site', async () => {
        const resp = await req('PATCH', '/api/sites/does-not-exist', { name: 'x' });
        expect(resp.status).toBe(404);
    });
});

describe('PATCH /api/sites/:identifier/theme', () => {
    it('sets a theme and returns it on the spec and meta endpoints', async () => {
        const { identifier } = await createDraftSite('Site');
        const theme = { primary: '#f06', accent: '#0ff' };

        const resp = await req('PATCH', `/api/sites/${identifier}/theme`, { theme });
        expect(resp.status).toBe(204);

        const meta = await req('GET', `/api/sites/${identifier}`);
        const metaData = (await meta.json()) as { theme: Record<string, string> | null };
        expect(metaData.theme).toEqual(theme);

        const spec = await req('GET', `/api/sites/${identifier}/spec?path=/`);
        const specData = (await spec.json()) as { theme?: Record<string, string> };
        expect(specData.theme).toEqual(theme);
    });

    it('clears the theme when passed null', async () => {
        const { identifier } = await createDraftSite('Site');
        await req('PATCH', `/api/sites/${identifier}/theme`, { theme: { primary: '#f06' } });

        const clear = await req('PATCH', `/api/sites/${identifier}/theme`, { theme: null });
        expect(clear.status).toBe(204);

        const meta = await req('GET', `/api/sites/${identifier}`);
        const metaData = (await meta.json()) as { theme: Record<string, string> | null };
        expect(metaData.theme).toBeNull();
    });

    it('rejects non-string values', async () => {
        const { identifier } = await createDraftSite('Site');
        const resp = await req('PATCH', `/api/sites/${identifier}/theme`, {
            theme: { primary: 123 },
        });
        expect(resp.status).toBe(400);
    });

    it('rejects missing theme field', async () => {
        const { identifier } = await createDraftSite('Site');
        const resp = await req('PATCH', `/api/sites/${identifier}/theme`, {});
        expect(resp.status).toBe(400);
    });

    it('returns 404 for unknown site', async () => {
        const resp = await req('PATCH', '/api/sites/does-not-exist/theme', { theme: null });
        expect(resp.status).toBe(404);
    });
});

describe('POST /api/sites/:identifier/blocks', () => {
    it('inserts a block at the given position and shifts siblings', async () => {
        const { identifier } = await createDraftSite('Site');

        // Insert first block at 0.
        const a = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block: { type: 'TextBlock', props: { heading: 'A', body: 'a' } },
        });
        expect(a.status).toBe(201);

        // Insert second block at 0 → A shifted to position 1.
        const b = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block: { type: 'TextBlock', props: { heading: 'B', body: 'b' } },
        });
        expect(b.status).toBe(201);

        const specResp = await req('GET', `/api/sites/${identifier}/spec?path=/`);
        expect(specResp.status).toBe(200);
        const spec = (await specResp.json()) as { blocks: Array<{ props: { heading: string } }> };
        expect(spec.blocks.map((bl) => bl.props.heading)).toEqual(['B', 'A']);
    });

    it('clamps position to the current sibling count', async () => {
        const { identifier } = await createDraftSite('Site');
        const a = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 99,
            block: { type: 'TextBlock', props: { heading: 'only', body: 'x' } },
        });
        expect(a.status).toBe(201);
        const data = (await a.json()) as { position: number };
        expect(data.position).toBe(0);
    });

    it('rejects unknown module type structure', async () => {
        const { identifier } = await createDraftSite('Site');
        // Empty type is the only case `isKnownContainerlessType` rejects.
        const resp = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block: { type: '', props: {} },
        });
        // Zod's BlockSpecSchema happily accepts any non-empty string,
        // but an empty "type" triggers our guard.
        expect([400, 400]).toContain(resp.status);
    });

    it('rejects missing body', async () => {
        const { identifier } = await createDraftSite('Site');
        const resp = await req('POST', `/api/sites/${identifier}/blocks`, {});
        expect(resp.status).toBe(400);
    });
});

describe('DELETE /api/sites/:identifier/blocks/:blockId', () => {
    it('removes a block and re-compacts positions', async () => {
        const { identifier } = await createDraftSite('Site');
        const ids: string[] = [];
        for (const label of ['A', 'B', 'C']) {
            const resp = await req('POST', `/api/sites/${identifier}/blocks`, {
                position: ids.length,
                block: { type: 'TextBlock', props: { heading: label, body: label } },
            });
            const data = (await resp.json()) as { id: string };
            ids.push(data.id);
        }

        // Delete the middle one.
        const del = await req('DELETE', `/api/sites/${identifier}/blocks/${ids[1]}`);
        expect(del.status).toBe(204);

        const specResp = await req('GET', `/api/sites/${identifier}/spec?path=/`);
        const spec = (await specResp.json()) as { blocks: Array<{ props: { heading: string } }> };
        expect(spec.blocks.map((b) => b.props.heading)).toEqual(['A', 'C']);
    });
});

describe('PATCH /api/sites/:identifier/blocks/:blockId/position', () => {
    it('reorders siblings', async () => {
        const { identifier } = await createDraftSite('Site');
        const ids: string[] = [];
        for (const label of ['A', 'B', 'C']) {
            const resp = await req('POST', `/api/sites/${identifier}/blocks`, {
                position: ids.length,
                block: { type: 'TextBlock', props: { heading: label, body: label } },
            });
            const data = (await resp.json()) as { id: string };
            ids.push(data.id);
        }

        // Move C to position 0.
        const mv = await req('PATCH', `/api/sites/${identifier}/blocks/${ids[2]}/position`, {
            newPosition: 0,
        });
        expect(mv.status).toBe(204);

        const specResp = await req('GET', `/api/sites/${identifier}/spec?path=/`);
        const spec = (await specResp.json()) as { blocks: Array<{ props: { heading: string } }> };
        expect(spec.blocks.map((b) => b.props.heading)).toEqual(['C', 'A', 'B']);
    });
});

describe('PATCH /api/sites/:identifier/blocks/:blockId/tone', () => {
    it('sets a valid tone', async () => {
        const { identifier } = await createDraftSite('Site');
        const ins = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block: { type: 'TextBlock', props: { heading: 'h', body: 'b' } },
        });
        const { id } = (await ins.json()) as { id: string };

        const resp = await req('PATCH', `/api/sites/${identifier}/blocks/${id}/tone`, {
            tone: 'muted',
        });
        expect(resp.status).toBe(204);

        const specResp = await req('GET', `/api/sites/${identifier}/spec?path=/`);
        const spec = (await specResp.json()) as { blocks: Array<{ tone?: string }> };
        expect(spec.blocks[0]!.tone).toBe('muted');
    });

    it('clears the tone when null is sent', async () => {
        const { identifier } = await createDraftSite('Site');
        const ins = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block: { type: 'TextBlock', tone: 'primary', props: { heading: 'h', body: 'b' } },
        });
        const { id } = (await ins.json()) as { id: string };

        const resp = await req('PATCH', `/api/sites/${identifier}/blocks/${id}/tone`, {
            tone: null,
        });
        expect(resp.status).toBe(204);
    });

    it('rejects an invalid tone', async () => {
        const { identifier } = await createDraftSite('Site');
        const ins = await req('POST', `/api/sites/${identifier}/blocks`, {
            position: 0,
            block: { type: 'TextBlock', props: { heading: 'h', body: 'b' } },
        });
        const { id } = (await ins.json()) as { id: string };

        const resp = await req('PATCH', `/api/sites/${identifier}/blocks/${id}/tone`, {
            tone: 'rainbow',
        });
        expect(resp.status).toBe(400);
    });
});

describe('GET/POST /api/sites/:identifier/messages', () => {
    it('round-trips messages in insertion order', async () => {
        const { identifier } = await createDraftSite('Site');

        const first = await req('POST', `/api/sites/${identifier}/messages`, {
            role: 'user', content: 'hello',
        });
        expect(first.status).toBe(201);

        const second = await req('POST', `/api/sites/${identifier}/messages`, {
            role: 'assistant', content: 'hi there', metadata: { ops: 0 },
        });
        expect(second.status).toBe(201);

        const list = await req('GET', `/api/sites/${identifier}/messages`);
        expect(list.status).toBe(200);
        const messages = (await list.json()) as Array<{ role: string; content: string; metadata: unknown }>;
        expect(messages).toHaveLength(2);
        expect(messages[0]!.role).toBe('user');
        expect(messages[0]!.content).toBe('hello');
        expect(messages[1]!.role).toBe('assistant');
        expect(messages[1]!.metadata).toEqual({ ops: 0 });
    });

    it('rejects an invalid role', async () => {
        const { identifier } = await createDraftSite('Site');
        const resp = await req('POST', `/api/sites/${identifier}/messages`, {
            role: 'hacker', content: 'x',
        });
        expect(resp.status).toBe(400);
    });

    it('cascades messages when the site is deleted', async () => {
        const { identifier } = await createDraftSite('Site');
        await req('POST', `/api/sites/${identifier}/messages`, { role: 'user', content: 'x' });

        const del = await req('DELETE', `/api/sites/${identifier}`);
        expect(del.status).toBe(204);

        const list = await req('GET', `/api/sites/${identifier}/messages`);
        expect(list.status).toBe(404);
    });
});
