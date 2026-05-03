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
import { eventsRoute } from './routes/events.js';
import { activeSessionRoute } from './routes/active-session.js';
import { mountMcp } from './mcp/handler.js';
import { staticRoute } from './routes/static.js';
import { oauthRoute } from './routes/oauth.js';
import { discoveryRoute } from './routes/discovery.js';

const env = loadEnv();
const db = openDb(env.DB_PATH);
runMigrations(db);

const app = new Hono();
app.route('/health', healthRoute);

// Public OAuth 2.0 + discovery for Claude.ai's MCP connector.
// MUST be mounted before any bearer-auth middleware (Claude hits these unauthed).
app.route('/', discoveryRoute(env.PUBLIC_BASE_URL));
app.route('/', oauthRoute({ bearerToken: env.BEARER_TOKEN }));

const api = new Hono();
api.use('*', bearerAuth(env.BEARER_TOKEN));
api.route('/profile', profileRoute(db));
api.route('/program', programsRoute(db));
api.route('/sessions', sessionsRoute(db));
api.route('/setup-status', setupRoute(db));
api.route('/data', dataRoute(db));
api.route('/active-session', activeSessionRoute(db));
api.route('/events', eventsRoute);
app.route('/api', api);

// MCP transport — separate sub-app, same Bearer auth as /api.
// Claude.ai connects here over Streamable HTTP (POST/GET/DELETE).
const mcp = new Hono();
mcp.use('*', bearerAuth(env.BEARER_TOKEN));
mcp.all('/*', async (c) => mountMcp(c.req.raw, db));
app.route('/mcp', mcp);

// Static PWA — must be mounted LAST so SPA fallback doesn't shadow API/MCP routes.
app.route('/', staticRoute(env.STATIC_DIR));

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`coach-claude server listening on :${info.port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing db');
  db.close();
  process.exit(0);
});
