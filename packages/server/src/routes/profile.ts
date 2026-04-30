import { Hono } from 'hono';
import { UserProfile } from '@coach/shared';
import type { DB } from '../db/connection.js';
import { getProfile, upsertProfile } from '../db/repo/profile.repo.js';
import { eventBus } from '../events/bus.js';

export function profileRoute(db: DB) {
  const r = new Hono();
  r.get('/', (c) => c.json(getProfile(db)));
  r.put('/', async (c) => {
    const body = await c.req.json();
    const parsed = UserProfile.safeParse({ ...body, updated_at: new Date().toISOString() });
    if (!parsed.success) {
      return c.json({ error: 'invalid', issues: parsed.error.flatten() }, 400);
    }
    const saved = upsertProfile(db, parsed.data);
    eventBus.publish({ type: 'profile_updated', profile: saved });
    return c.json(saved);
  });
  return r;
}
