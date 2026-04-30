import { Hono } from 'hono';
import type { DB } from '../db/connection.js';
import { getActiveProgram } from '../db/repo/program.repo.js';

export function programsRoute(db: DB) {
  const r = new Hono();
  r.get('/', (c) => c.json(getActiveProgram(db)));
  return r;
}
