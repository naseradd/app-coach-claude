import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { loadEnv } from './env.js';
import { openDb } from './db/connection.js';
import { runMigrations } from './db/migrations.js';

const env = loadEnv();
const db = openDb(env.DB_PATH);
runMigrations(db);

const app = new Hono();
app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`coach-claude server listening on :${info.port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing db');
  db.close();
  process.exit(0);
});
