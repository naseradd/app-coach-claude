import type { SseEvent } from '@coach/shared';

export type SseConnectionStatus = 'connected' | 'disconnected';

interface SseState {
  reconnectMs: number;
  stopped: boolean;
  es: EventSource | null;
}

/**
 * Subscribe to the server's SSE event stream with exponential backoff
 * reconnect. EventSource cannot send custom headers, so the bearer is
 * passed via the `?token=` query (server accepts both Authorization
 * header and this query param).
 *
 * Returns an unsubscribe function that closes the stream.
 */
export function subscribeEvents(
  baseUrl: string,
  bearer: string,
  onEvent: (e: SseEvent) => void,
  onStatus?: (status: SseConnectionStatus) => void,
): () => void {
  const state: SseState = { reconnectMs: 1000, stopped: false, es: null };
  const url = `${baseUrl.replace(/\/+$/, '')}/api/events?token=${encodeURIComponent(bearer)}`;

  const open = () => {
    if (state.stopped) return;
    const es = new EventSource(url);
    state.es = es;

    // Server emits all events under the `event: event` SSE name.
    es.addEventListener('event', (msg) => {
      try {
        const data: SseEvent = JSON.parse((msg as MessageEvent).data);
        onEvent(data);
      } catch {
        // Ignore malformed payloads silently — never crash the subscriber.
      }
    });

    es.onopen = () => {
      state.reconnectMs = 1000;
      onStatus?.('connected');
    };

    es.onerror = () => {
      es.close();
      state.es = null;
      onStatus?.('disconnected');
      if (state.stopped) return;
      const wait = state.reconnectMs;
      state.reconnectMs = Math.min(state.reconnectMs * 2, 30000);
      window.setTimeout(open, wait);
    };
  };

  open();

  return () => {
    state.stopped = true;
    state.es?.close();
    state.es = null;
  };
}
