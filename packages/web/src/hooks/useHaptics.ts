import { useCallback } from 'react';
import { useSettings } from '../store/settings.store.js';

/**
 * Haptic feedback abstraction over `navigator.vibrate`. iOS Safari ignores
 * the API entirely (no vibration motor exposed to web), but it's a no-op
 * rather than a throw, so we can call this freely.
 *
 * Patterns chosen to be felt without being annoying:
 *   - light:   single short tap (set valid, button confirm)
 *   - warn:    triple buzz (rest 10s warning)
 *   - success: double buzz (rest end, PR, submit)
 */
export type HapticPattern = 'light' | 'warn' | 'success';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  warn: [20, 40, 20],
  success: [50, 30, 50],
};

export function useHaptics() {
  const haptics = useSettings((s) => s.haptics);
  return useCallback(
    (pattern: HapticPattern) => {
      if (!haptics) return;
      if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // Some browsers throw if called from a non-user-gesture context.
      }
    },
    [haptics],
  );
}
