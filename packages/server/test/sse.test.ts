import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { eventsRoute } from '../src/routes/events.js';
import { eventBus } from '../src/events/bus.js';

describe('sse', () => {
  it('responds with text/event-stream', async () => {
    const app = new Hono().route('/events', eventsRoute);
    const ctrl = new AbortController();
    const resPromise = app.request('/events', { signal: ctrl.signal });
    // Tear down quickly so vitest doesn't wait on the open stream.
    setTimeout(() => ctrl.abort(), 50);
    const res = await resPromise;
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });

  it('forwards bus events and cleans up listener on abort', async () => {
    const app = new Hono().route('/events', eventsRoute);
    const before = eventBus.listenerCount('event');

    const ctrl = new AbortController();
    const res = await app.request('/events', { signal: ctrl.signal });
    expect(res.status).toBe(200);

    // Read the hello event to confirm the stream is live and the listener is registered.
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const { value: helloChunk } = await reader.read();
    const helloText = decoder.decode(helloChunk);
    expect(helloText).toContain('"type":"hello"');

    // After hello, listener count should be exactly 1 above baseline.
    expect(eventBus.listenerCount('event')).toBe(before + 1);

    // Publish a typed event and confirm it lands on the stream.
    eventBus.publish({ type: 'history_changed', report_id: '11111111-1111-4111-8111-111111111111' });
    const { value: pushedChunk } = await reader.read();
    expect(decoder.decode(pushedChunk)).toContain('"type":"history_changed"');

    // Abort and let cleanup run.
    ctrl.abort();
    await reader.cancel().catch(() => {});
    // Give the runtime one tick for onAbort to fire.
    await new Promise((r) => setTimeout(r, 30));
    expect(eventBus.listenerCount('event')).toBe(before);
  });
});
