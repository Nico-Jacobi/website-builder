import { Hono } from 'hono';
import { z } from 'zod';
import { refineSpec } from '../services/llm/refineSpec';
import { refineChrome } from '../services/llm/refineChrome';
import { startGenerationJob } from '../services/generationJob';

export const llmRouter = new Hono();

const GenerateBody = z.object({
    identifier: z.string().min(1),
    userPrompt:  z.string().trim().min(1).max(10_000),
});

const ChatMessageSchema = z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string().max(50_000),
});

const PageRefineBody = z.object({
    siteIdentifier: z.string(),
    pagePath:       z.string(),
    history:        z.array(ChatMessageSchema).max(50),
    userMessage:    z.string().trim().min(1).max(10_000),
});

const ChromeRefineBody = z.object({
    siteIdentifier: z.string(),
    history:        z.array(ChatMessageSchema).max(50),
    userMessage:    z.string().trim().min(1).max(10_000),
});

/** Startet eine asynchrone Multi-Page-Generierung. Returnt sofort 202 Accepted. */
llmRouter.post('/generate', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = GenerateBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    startGenerationJob(parsed.data.identifier, parsed.data.userPrompt);
    return c.json({ identifier: parsed.data.identifier, status: 'started' }, 202);
});

/** Page-scoped Refinement: LLM bekommt Page-Blocks + locked chrome/sitemap, liefert updated Page-Blocks. */
llmRouter.post('/refine', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = PageRefineBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    const result = await refineSpec(parsed.data);
    return c.json(result, 200);
});

/** Chrome-Refinement: LLM bekommt aktuelles Chrome + locked theme/sitemap, liefert updated chrome. */
llmRouter.post('/refine-chrome', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = ChromeRefineBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    const result = await refineChrome(parsed.data);
    return c.json(result, 200);
});
