import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { loadEnv } from './env.js';

const env = loadEnv();
const app = new Hono();

app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`coach-claude server listening on :${info.port}`);
});
