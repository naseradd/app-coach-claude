import { useEffect, useRef } from 'react';

/**
 * Holds a Screen Wake Lock while `active` is true. Re-acquires on tab
 * visibility changes (browsers release the lock when you background the tab).
 *
 * Fail-silent: if the API is unsupported (Safari < 16.4, Firefox flag) or the
 * user denies permission, the workout still works — the screen just dims.
 */
interface WakeLockSentinel {
  release: () => Promise<void>;
  released: boolean;
}

export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const wakeLock = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockSentinel> } }).wakeLock;
    if (!wakeLock) return;

    const acquire = async () => {
      try {
        const s = await wakeLock.request('screen');
        if (cancelled) {
          await s.release();
          return;
        }
        sentinelRef.current = s;
      } catch {
        // Permission denied / unsupported / already-locked: degrade silently.
      }
    };

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinelRef.current || sentinelRef.current.released)) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [active]);
}
