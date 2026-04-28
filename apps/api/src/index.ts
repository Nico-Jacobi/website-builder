import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sitesRouter } from './routes/sites';
import { llmRouter } from './routes/llm';
import { runMigrations } from './db/migrate';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
await runMigrations(url);

const app = new Hono();

app.use(
    '*',
    cors({
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
        credentials: true,
    }),
);

app.use('/uploads/*', serveStatic({ root: './' }));

app.get('/health', (c) => c.json({ ok: true }));
app.route('/api/sites', sitesRouter);
app.route('/api/llm', llmRouter);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
    // eslint-disable-next-line no-console
    console.log(`api listening on http://localhost:${info.port}`);
});

export { app };
