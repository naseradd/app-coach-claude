import { Hono } from 'hono';
import { z } from 'zod';
import { SessionReport } from '@coach/shared';
import type { DB } from '../db/connection.js';
import { insertReport, listReports, getReport } from '../db/repo/session.repo.js';
import { eventBus } from '../events/bus.js';

const ListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function sessionsRoute(db: DB) {
  const r = new Hono();

  r.get('/', (c) => {
    const parsed = ListQuery.safeParse({
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    });
    if (!parsed.success) {
      return c.json({ error: 'invalid_query', issues: parsed.error.flatten() }, 400);
    }
    return c.json(listReports(db, parsed.data.limit, parsed.data.offset));
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
