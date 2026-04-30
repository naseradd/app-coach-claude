import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { eventsRoute } from '../src/routes/events.js';

describe('sse', () => {
  it('responds with text/event-stream', async () => {
    const app = new Hono().route('/events', eventsRoute);
    const res = await app.request('/events');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });
});
