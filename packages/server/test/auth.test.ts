import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { bearerAuth } from '../src/auth.js';

describe('bearerAuth', () => {
  const TOKEN = 'a'.repeat(32);
  const app = new Hono();
  app.use('/secure/*', bearerAuth(TOKEN));
  app.get('/secure/ping', (c) => c.json({ ok: true }));
  app.get('/open', (c) => c.json({ ok: true }));

  it('rejects missing token with 401', async () => {
    const res = await app.request('/secure/ping');
    expect(res.status).toBe(401);
  });

  it('rejects wrong token with 401', async () => {
    const res = await app.request('/secure/ping', { headers: { Authorization: 'Bearer wrong' } });
    expect(res.status).toBe(401);
  });

  it('accepts correct token', async () => {
    const res = await app.request('/secure/ping', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(res.status).toBe(200);
  });

  it('does not affect open routes', async () => {
    const res = await app.request('/open');
    expect(res.status).toBe(200);
  });
});
