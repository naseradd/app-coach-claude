import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '../design/themes.js';

interface SettingsState {
  theme: ThemeId;
  serverUrl: string;
  bearer: string;
  weightUnit: 'kg' | 'lbs';
  haptics: boolean;
  set: (p: Partial<Omit<SettingsState, 'set'>>) => void;
}

/**
 * Persisted settings (theme, server config, prefs).
 * Persisted under `coach.settings` in localStorage so users don't have to
 * reconfigure after a hard refresh / PWA reinstall.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'warm-cream',
      serverUrl: '',
      bearer: '',
      weightUnit: 'lbs',
      haptics: true,
      set: (p) => set(p),
    }),
    {
      name: 'coach.settings',
      version: 2,
      migrate: (persisted, fromVersion) => {
        // v1 → v2: force lbs as the only weight unit.
        const s = (persisted ?? {}) as Partial<SettingsState>;
        if (fromVersion < 2) s.weightUnit = 'lbs';
        return s as SettingsState;
      },
    },
  ),
);
