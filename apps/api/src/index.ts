import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sitesRouter } from './routes/sites';
import { seedRouter } from './routes/seed';

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
app.route('/api/_seed', seedRouter);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
    // eslint-disable-next-line no-console
    console.log(`api listening on http://localhost:${info.port}`);
});

export { app };
