import { Hono } from 'hono';
import type { DB } from '../db/connection.js';

export function dataRoute(db: DB) {
  const r = new Hono();
  r.delete('/', (c) => {
    const tx = db.transaction(() => {
      db.exec(
        'DELETE FROM session_reports; DELETE FROM programs; DELETE FROM active_session; DELETE FROM profile;',
      );
    });
    tx();
    return c.json({ ok: true });
  });
  return r;
}
