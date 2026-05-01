import { create } from 'zustand';

/**
 * Phase 7 stub: holds a minimal session-state machine.
 * Phase 8 will expand to set-by-set tracking, rest timer state, PR detection,
 * crash recovery via IndexedDB, etc.
 */
export type WorkoutPhase = 'set' | 'rest' | 'done';

export interface ActiveWorkout {
  sessionId: string;
  startedAt: string;
  phase: WorkoutPhase;
}

interface WorkoutState {
  active: ActiveWorkout | null;
  start: (sessionId: string) => void;
  setPhase: (p: WorkoutPhase) => void;
  end: () => void;
}

export const useWorkout = create<WorkoutState>((set) => ({
  active: null,
  start: (sessionId) =>
    set({
      active: {
        sessionId,
        startedAt: new Date().toISOString(),
        phase: 'set',
      },
    }),
  setPhase: (p) =>
    set((s) => ({ active: s.active ? { ...s.active, phase: p } : null })),
  end: () => set({ active: null }),
}));
