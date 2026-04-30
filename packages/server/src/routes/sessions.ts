import { Hono } from 'hono';
import { SessionReport } from '@coach/shared';
import type { DB } from '../db/connection.js';
import { insertReport, listReports, getReport } from '../db/repo/session.repo.js';
import { eventBus } from '../events/bus.js';

export function sessionsRoute(db: DB) {
  const r = new Hono();
  r.get('/', (c) => {
    const limit = parseInt(c.req.query('limit') ?? '50', 10);
    const offset = parseInt(c.req.query('offset') ?? '0', 10);
    return c.json(listReports(db, limit, offset));
  });
  r.get('/:id', (c) => {
    const rep = getReport(db, c.req.param('id'));
    if (!rep) return c.json({ error: 'not_found' }, 404);
    return c.json(rep);
  });
  r.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = SessionReport.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid', issues: parsed.error.flatten() }, 400);
    }
    const saved = insertReport(db, parsed.data);
    eventBus.publish({ type: 'history_changed', report_id: saved.id });
    return c.json(saved, 201);
  });
  return r;
}
