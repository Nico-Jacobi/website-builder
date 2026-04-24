import { Hono } from 'hono';
import { z } from 'zod';
import { SiteSpecSchema } from '@website-builder/shared';
import { generateSpec } from '../services/llm/generateSpec';
import { refineSpec } from '../services/llm/refineSpec';

export const llmRouter = new Hono();

const GenerateBody = z.object({
    userPrompt: z.string().trim().min(1).max(10_000),
});

const HistoryEntry = z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string().max(50_000),
});

const RefineBody = z.object({
    currentSpec: SiteSpecSchema,
    history:     z.array(HistoryEntry).max(50),
    userMessage: z.string().trim().min(1).max(10_000),
});

/** One-shot Erstgenerierung einer SiteSpec aus freiem Prompt. */
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

    const result = await generateSpec(parsed.data.userPrompt);
    return c.json(result, 200);
});

/** Refinement-Turn: LLM bekommt aktuellen Spec + History + neue Message, liefert next-Spec. */
llmRouter.post('/refine', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'body must be JSON' }, 400);
    }
    const parsed = RefineBody.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: 'invalid body', issues: parsed.error.issues }, 400);
    }

    const result = await refineSpec({
        currentSpec: parsed.data.currentSpec,
        history:     parsed.data.history,
        userMessage: parsed.data.userMessage,
    });
    return c.json(result, 200);
});
