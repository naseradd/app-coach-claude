import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { loadEnv } from './env.js';
import { openDb } from './db/connection.js';
import { runMigrations } from './db/migrations.js';
import { bearerAuth } from './auth.js';
import { healthRoute } from './routes/health.js';
import { profileRoute } from './routes/profile.js';
import { programsRoute } from './routes/programs.js';
import { sessionsRoute } from './routes/sessions.js';
import { setupRoute } from './routes/setup.js';
import { dataRoute } from './routes/data.js';

const env = loadEnv();
const db = openDb(env.DB_PATH);
runMigrations(db);

const app = new Hono();
app.route('/health', healthRoute);

const api = new Hono();
api.use('*', bearerAuth(env.BEARER_TOKEN));
api.route('/profile', profileRoute(db));
api.route('/program', programsRoute(db));
api.route('/sessions', sessionsRoute(db));
api.route('/setup-status', setupRoute(db));
api.route('/data', dataRoute(db));
app.route('/api', api);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`coach-claude server listening on :${info.port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing db');
  db.close();
  process.exit(0);
});
