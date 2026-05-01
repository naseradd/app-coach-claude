import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { openDb } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrations.js';
import { activeSessionRoute } from '../src/routes/active-session.js';

const sample = {
  programId: '550e8400-e29b-41d4-a716-446655440000',
  sessionId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  startedAt: '2026-04-30T10:00:00Z',
  phase: 'set' as const,
  exerciseIndex: 0,
  setIndex: 0,
  preSession: { energy_level: 7, sleep_quality: 6, soreness_level: 3, notes: '' },
  setsLog: [],
};

describe('active-session route', () => {
  let app: Hono;
  beforeEach(() => {
    const db = openDb(':memory:');
    runMigrations(db);
    app = new Hono().route('/active-session', activeSessionRoute(db));
  });

  it('GET returns null when nothing active', async () => {
    const res = await app.request('/active-session');
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it('PUT round-trips state, then GET returns it', async () => {
    const put = await app.request('/active-session', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sample),
    });
    expect(put.status).toBe(200);

    const get = await app.request('/active-session');
    const got = (await get.json()) as typeof sample;
    expect(got.programId).toBe(sample.programId);
    expect(got.sessionId).toBe(sample.sessionId);
    expect(got.phase).toBe('set');
  });

  it('DELETE clears the active session', async () => {
    await app.request('/active-session', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sample),
    });
    const del = await app.request('/active-session', { method: 'DELETE' });
    expect(del.status).toBe(200);
    const get = await app.request('/active-session');
    expect(await get.json()).toBeNull();
  });

  it('PUT rejects malformed payload with 400', async () => {
    const res = await app.request('/active-session', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    });
    expect(res.status).toBe(400);
  });
});
