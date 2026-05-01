import { create } from 'zustand';
import type { WorkoutProgram } from '@coach/shared';
import { apiClient } from '../api/endpoints.js';
import { isApiConfigured } from '../api/client.js';

export type ConnectionStatus = 'unknown' | 'connected' | 'disconnected';

interface SetupStatus {
  complete: boolean;
  missing: string[];
}

interface ProgramState {
  program: WorkoutProgram | null;
  setupStatus: SetupStatus | null;
  loading: boolean;
  error: string | null;
  /** Live-updated by the SSE subscriber in `useApiBoot`. */
  connectionStatus: ConnectionStatus;
  fetch: () => Promise<void>;
  setProgram: (p: WorkoutProgram | null) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  reset: () => void;
}

export const useProgram = create<ProgramState>((set) => ({
  program: null,
  setupStatus: null,
  loading: false,
  error: null,
  connectionStatus: 'unknown',
  fetch: async () => {
    if (!isApiConfigured()) {
      set({ program: null, setupStatus: null, error: null, loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const [program, setupStatus] = await Promise.all([
        apiClient.getActiveProgram(),
        apiClient.setupStatus(),
      ]);
      set({ program, setupStatus, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'fetch_failed',
        loading: false,
      });
    }
  },
  setProgram: (p) => set({ program: p }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  reset: () =>
    set({
      program: null,
      setupStatus: null,
      loading: false,
      error: null,
      connectionStatus: 'unknown',
    }),
}));
