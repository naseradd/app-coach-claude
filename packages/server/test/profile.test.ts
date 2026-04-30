import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { openDb } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrations.js';
import { profileRoute } from '../src/routes/profile.js';

const sample = {
  schema_version: '1.0.0',
  display_name: 'Dany',
  age: 30,
  height_cm: 180,
  weight_kg: 78,
  experience_level: 'intermediate',
  goals: ['strength'],
  equipment: ['barbell', 'dumbbells'],
  injuries: [],
  one_rep_max_kg: { bench: 100 },
  weight_unit_preference: 'kg',
  updated_at: new Date().toISOString(),
};

describe('profile route', () => {
  let app: Hono;
  beforeEach(() => {
    const db = openDb(':memory:');
    runMigrations(db);
    app = new Hono().route('/profile', profileRoute(db));
  });

  it('GET returns null when empty', async () => {
    const res = await app.request('/profile');
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it('PUT validates & stores, then GET returns it', async () => {
    const put = await app.request('/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sample),
    });
    expect(put.status).toBe(200);
    const get = await app.request('/profile');
    const got = (await get.json()) as { display_name: string };
    expect(got.display_name).toBe('Dany');
  });

  it('PUT rejects invalid', async () => {
    const put = await app.request('/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ display_name: 'x' }),
    });
    expect(put.status).toBe(400);
  });
});
