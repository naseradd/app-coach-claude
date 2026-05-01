import { Hono } from 'hono';
import type { DB } from '../db/connection.js';
import {
  getActiveSession,
  setActiveSession,
  clearActiveSession,
} from '../db/repo/active.repo.js';

/**
 * /api/active-session — single-row CRUD for the in-flight workout state.
 * GET returns null when no session is active (client uses that to decide
 * whether to offer "resume"). PUT stores the entire blob (debounced from the
 * client). DELETE clears at workout end.
 */
export function activeSessionRoute(db: DB) {
  const r = new Hono();

  r.get('/', (c) => c.json(getActiveSession(db)));

  r.put('/', async (c) => {
    const body = (await c.req.json()) as unknown;
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).programId !== 'string' ||
      typeof (body as Record<string, unknown>).sessionId !== 'string'
    ) {
      return c.json({ error: 'invalid' }, 400);
    }
    setActiveSession(db, body as Parameters<typeof setActiveSession>[1]);
    return c.json({ ok: true });
  });

  r.delete('/', (c) => {
    clearActiveSession(db);
    return c.json({ ok: true });
  });

  return r;
}
