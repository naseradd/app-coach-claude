import { useEffect, useRef } from 'react';
import type { SseEvent } from '@coach/shared';
import { setApiConfig } from '../api/client.js';
import { subscribeEvents } from '../api/sse.js';
import { useSettings } from '../store/settings.store.js';
import { useProgram } from '../store/program.store.js';
import { useHistory } from '../store/history.store.js';

/**
 * Wires settings → API config + subscribes to SSE.
 * Re-runs whenever the user reconfigures the server URL or bearer.
 *
 * Owns the lifecycle of the SSE subscription so pages don't have to.
 */
export function useApiBoot(): void {
  const serverUrl = useSettings((s) => s.serverUrl);
  const bearer = useSettings((s) => s.bearer);

  const programFetch = useProgram((s) => s.fetch);
  const programSet = useProgram((s) => s.setProgram);
  const programReset = useProgram((s) => s.reset);
  const setConnectionStatus = useProgram((s) => s.setConnectionStatus);

  const historyFetch = useHistory((s) => s.fetch);
  const historyReset = useHistory((s) => s.reset);

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Tear down any previous subscription before reconfiguring.
    unsubRef.current?.();
    unsubRef.current = null;

    if (!serverUrl || !bearer) {
      setApiConfig({ baseUrl: '', bearer: '' });
      programReset();
      historyReset();
      return;
    }

    setApiConfig({ baseUrl: serverUrl, bearer });

    // Initial load — fire and forget; stores set their own loading flag.
    void programFetch();
    void historyFetch();

    const onEvent = (e: SseEvent) => {
      switch (e.type) {
        case 'program_received':
          programSet(e.program);
          // Setup status flips when a program arrives, refetch to be safe.
          void programFetch();
          break;
        case 'profile_updated':
          // Setup status depends on profile presence too.
          void programFetch();
          break;
        case 'history_changed':
          void historyFetch();
          break;
        case 'hello':
        case 'heartbeat':
        default:
          // No action needed; reception alone proves the channel is alive.
          break;
      }
    };

    unsubRef.current = subscribeEvents(serverUrl, bearer, onEvent, (status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, bearer]);
}
