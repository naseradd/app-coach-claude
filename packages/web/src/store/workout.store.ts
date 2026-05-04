import { create } from 'zustand';
import { apiClient } from '../api/endpoints.js';

/**
 * Phase 8: real workout state machine with debounced server-side persistence.
 *
 * The store is the source of truth during a workout. Every mutation triggers
 * a 1s-debounced PUT /api/active-session so a crash, reload, or device
 * switch can resume at the exact phase + set + log entries.
 *
 * Why server-side and not IndexedDB: there is already exactly one server,
 * exactly one user, and the PWA needs a server-side artifact for Claude/MCP
 * to inspect anyway. Avoids a second source of truth.
 */
export type WorkoutPhase = 'set' | 'rest' | 'done';

export interface SetLogEntry {
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  type: 'warmup' | 'working' | 'amrap' | 'dropset' | 'backoff' | 'timed';
  planned_reps: number | null;
  planned_weight_kg: number | null;
  rpe_planned: number | null;
  rest_planned_seconds: number;
  actual_reps: number | null;
  actual_weight_kg: number | null;
  rpe_actual: number | null;
  rest_taken_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  is_pr: boolean;
  notes: string;
}

export interface PreSessionCheckIn {
  energy_level: number | null;
  sleep_quality: number | null;
  soreness_level: number | null;
  notes: string;
}

interface WorkoutState {
  programId: string | null;
  sessionId: string | null;
  startedAt: string | null;
  phase: WorkoutPhase;
  exerciseIndex: number;
  setIndex: number;
  preSession: PreSessionCheckIn;
  setsLog: SetLogEntry[];
  restStartedAt: string | null;
  /** True once for the boot cycle that successfully resumed remote state. */
  resumed: boolean;
  syncDebounce: ReturnType<typeof setTimeout> | null;

  start: (programId: string, sessionId: string, preSession: PreSessionCheckIn) => Promise<void>;
  resume: () => Promise<boolean>;
  setPhase: (p: WorkoutPhase) => void;
  startRest: () => void;
  /** Returns elapsed seconds since rest started. Clears restStartedAt. */
  endRest: () => number;
  logSet: (entry: SetLogEntry) => void;
  /** Updates the most recent set log's rest_taken_seconds (called after endRest). */
  updateLastSetRest: (seconds: number) => void;
  setExerciseSetIndex: (exerciseIndex: number, setIndex: number) => void;
  /** Advances based on the structure of the current session. Returns the transition kind. */
  advanceSet: (totalSetsInExercise: number, totalExercises: number) => 'next-set' | 'next-exercise' | 'done';
  setPreSession: (p: Partial<PreSessionCheckIn>) => void;
  end: () => Promise<void>;
  clearResumed: () => void;
}

const emptyPreSession: PreSessionCheckIn = {
  energy_level: null,
  sleep_quality: null,
  soreness_level: null,
  notes: '',
};

const initialState = {
  programId: null,
  sessionId: null,
  startedAt: null,
  phase: 'set' as WorkoutPhase,
  exerciseIndex: 0,
  setIndex: 0,
  preSession: emptyPreSession,
  setsLog: [] as SetLogEntry[],
  restStartedAt: null as string | null,
  resumed: false,
  syncDebounce: null as ReturnType<typeof setTimeout> | null,
};

const SYNC_DEBOUNCE_MS = 1000;

function syncPayload(s: WorkoutState) {
  return {
    programId: s.programId,
    sessionId: s.sessionId,
    startedAt: s.startedAt,
    phase: s.phase,
    exerciseIndex: s.exerciseIndex,
    setIndex: s.setIndex,
    preSession: s.preSession,
    setsLog: s.setsLog,
    restStartedAt: s.restStartedAt ?? undefined,
  };
}

function pushSync(state: WorkoutState) {
  if (!state.programId || !state.sessionId || !state.startedAt) return;
  void apiClient.putActiveSession(syncPayload(state)).catch(() => {
    // Fire-and-forget; we don't block UI on transient network failures.
    // The next mutation will retry.
  });
}

export const useWorkout = create<WorkoutState>((set, get) => {
  function debouncedSync() {
    const { syncDebounce } = get();
    if (syncDebounce) clearTimeout(syncDebounce);
    const t = setTimeout(() => {
      pushSync(get());
      set({ syncDebounce: null });
    }, SYNC_DEBOUNCE_MS);
    set({ syncDebounce: t });
  }

  return {
    ...initialState,

    start: async (programId, sessionId, preSession) => {
      const startedAt = new Date().toISOString();
      set({
        ...initialState,
        programId,
        sessionId,
        startedAt,
        preSession,
      });
      // Immediate (not debounced) sync on start so resume works even if the
      // app is killed within the first second.
      pushSync(get());
    },

    resume: async () => {
      try {
        const remote = await apiClient.getActiveSession();
        if (!remote || typeof remote !== 'object') return false;
        const r = remote as Record<string, unknown>;
        if (typeof r.programId !== 'string' || typeof r.sessionId !== 'string') return false;
        set({
          programId: r.programId,
          sessionId: r.sessionId,
          startedAt: typeof r.startedAt === 'string' ? r.startedAt : new Date().toISOString(),
          phase: (r.phase as WorkoutPhase) ?? 'set',
          exerciseIndex: typeof r.exerciseIndex === 'number' ? r.exerciseIndex : 0,
          setIndex: typeof r.setIndex === 'number' ? r.setIndex : 0,
          preSession: (r.preSession as PreSessionCheckIn) ?? emptyPreSession,
          setsLog: (r.setsLog as SetLogEntry[]) ?? [],
          restStartedAt: typeof r.restStartedAt === 'string' ? r.restStartedAt : null,
          resumed: true,
        });
        return true;
      } catch {
        return false;
      }
    },

    setPhase: (p) => {
      set({ phase: p });
      debouncedSync();
    },

    startRest: () => {
      set({ phase: 'rest', restStartedAt: new Date().toISOString() });
      debouncedSync();
    },

    endRest: () => {
      const { restStartedAt, phase } = get();
      const elapsed = restStartedAt
        ? Math.max(
            0,
            Math.round((Date.now() - new Date(restStartedAt).getTime()) / 1000),
          )
        : 0;
      // Ending rest is a state-machine invariant: phase must leave 'rest'.
      // Caller decides 'set' vs 'done' afterward (advanceToNext may flip to 'done').
      set({ restStartedAt: null, phase: phase === 'rest' ? 'set' : phase });
      debouncedSync();
      return elapsed;
    },

    logSet: (entry) => {
      set((s) => ({ setsLog: [...s.setsLog, entry] }));
      debouncedSync();
    },

    updateLastSetRest: (seconds) => {
      set((s) => {
        if (s.setsLog.length === 0) return {} as Partial<WorkoutState>;
        const next = s.setsLog.slice();
        const last = next[next.length - 1]!;
        next[next.length - 1] = { ...last, rest_taken_seconds: seconds };
        return { setsLog: next };
      });
      debouncedSync();
    },

    setExerciseSetIndex: (exerciseIndex, setIndex) => {
      set({ exerciseIndex, setIndex });
      debouncedSync();
    },

    advanceSet: (totalSetsInExercise, totalExercises) => {
      const { exerciseIndex, setIndex } = get();
      if (setIndex + 1 < totalSetsInExercise) {
        set({ setIndex: setIndex + 1, phase: 'set' });
        debouncedSync();
        return 'next-set';
      }
      if (exerciseIndex + 1 < totalExercises) {
        set({ exerciseIndex: exerciseIndex + 1, setIndex: 0, phase: 'set' });
        debouncedSync();
        return 'next-exercise';
      }
      set({ phase: 'done' });
      debouncedSync();
      return 'done';
    },

    setPreSession: (p) => {
      set((s) => ({ preSession: { ...s.preSession, ...p } }));
      debouncedSync();
    },

    end: async () => {
      const { syncDebounce } = get();
      if (syncDebounce) clearTimeout(syncDebounce);
      set({ ...initialState });
      try {
        await apiClient.deleteActiveSession();
      } catch {
        // Best-effort. If deletion fails, the next start() overwrites anyway.
      }
    },

    clearResumed: () => set({ resumed: false }),
  };
});
