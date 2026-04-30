import { Hono } from 'hono';
import type { DB } from '../db/connection.js';
import { getProfile } from '../db/repo/profile.repo.js';
import { getActiveProgram } from '../db/repo/program.repo.js';

export function setupRoute(db: DB) {
  const r = new Hono();
  r.get('/', (c) => {
    const missing: string[] = [];
    const profile = getProfile(db);
    if (!profile) missing.push('profile');
    const program = getActiveProgram(db);
    if (!program) missing.push('program');
    return c.json({ complete: missing.length === 0, missing });
  });
  return r;
}
