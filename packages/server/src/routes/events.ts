import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { eventBus } from '../events/bus.js';

export const eventsRoute = new Hono();

eventsRoute.get('/', (c) => {
  return streamSSE(c, async (stream) => {
    let id = 0;
    const send = (data: unknown) =>
      stream.writeSSE({ id: String(++id), event: 'event', data: JSON.stringify(data) });

    await send({ type: 'hello', ts: new Date().toISOString() });

    const unsub = eventBus.subscribe((ev) => {
      void send(ev);
    });
    const heartbeat = setInterval(() => {
      void send({ type: 'heartbeat', ts: new Date().toISOString() });
    }, 25000);

    stream.onAbort(() => {
      clearInterval(heartbeat);
      unsub();
    });

    await new Promise<void>(() => {
      // hold open until aborted
    });
  });
});
