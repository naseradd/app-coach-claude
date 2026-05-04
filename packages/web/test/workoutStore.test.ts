import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API client BEFORE importing the store (which imports the client at
// module load). All store mutations debounce-sync to the server; we don't care
// about the network in these tests.
vi.mock('../src/api/endpoints.js', () => ({
  apiClient: {
    putActiveSession: vi.fn().mockResolvedValue({ ok: true }),
    deleteActiveSession: vi.fn().mockResolvedValue({ ok: true }),
    getActiveSession: vi.fn().mockResolvedValue(null),
  },
}));

import { useWorkout, type SetLogEntry } from '../src/store/workout.store.js';

const baseEntry = (overrides: Partial<SetLogEntry> = {}): SetLogEntry => ({
  exercise_id: 'ex-1',
  exercise_name: 'Bench',
  set_number: 1,
  type: 'working',
  planned_reps: 5,
  planned_weight_kg: 80,
  rpe_planned: 8,
  rest_planned_seconds: 120,
  actual_reps: 5,
  actual_weight_kg: 80,
  rpe_actual: 8,
  rest_taken_seconds: 0,
  duration_seconds: null,
  completed: true,
  is_pr: false,
  notes: '',
  ...overrides,
});

beforeEach(async () => {
  // Reset store between tests.
  await useWorkout.getState().end();
  await useWorkout
    .getState()
    .start('prog-1', 'sess-1', {
      energy_level: 7,
      sleep_quality: 7,
      soreness_level: 2,
      notes: '',
    });
});

describe('workout store — rest phase invariants', () => {
  it('startRest moves phase to rest and stamps restStartedAt', () => {
    const before = useWorkout.getState();
    expect(before.phase).toBe('set');
    useWorkout.getState().startRest();
    const after = useWorkout.getState();
    expect(after.phase).toBe('rest');
    expect(after.restStartedAt).not.toBeNull();
  });

  // Regression: previously endRest only cleared restStartedAt. The Workout
  // page then advanced the cursor without ever flipping phase out of 'rest',
  // so RestTimer stayed on screen showing the *next* set's preview while the
  // exercise card was hidden. The fix makes endRest a state-machine transition
  // that always leaves 'rest'.
  it('endRest leaves phase=rest → phase=set (regression)', () => {
    useWorkout.getState().startRest();
    expect(useWorkout.getState().phase).toBe('rest');
    const elapsed = useWorkout.getState().endRest();
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(useWorkout.getState().phase).toBe('set');
    expect(useWorkout.getState().restStartedAt).toBeNull();
  });

  it('endRest does not clobber phase=done (final set path)', () => {
    useWorkout.getState().startRest();
    // Caller may have already concluded this is the last set.
    useWorkout.getState().setPhase('done');
    useWorkout.getState().endRest();
    expect(useWorkout.getState().phase).toBe('done');
  });

  it('endRest is a no-op when not resting (returns 0, keeps phase)', () => {
    expect(useWorkout.getState().phase).toBe('set');
    const elapsed = useWorkout.getState().endRest();
    expect(elapsed).toBe(0);
    expect(useWorkout.getState().phase).toBe('set');
  });

  it('full set→rest→set cycle: cursor advances and phase ends on set', () => {
    // Simulate: log a set, start rest, end rest, advance cursor.
    useWorkout.getState().logSet(baseEntry());
    useWorkout.getState().startRest();
    expect(useWorkout.getState().phase).toBe('rest');

    const elapsed = useWorkout.getState().endRest();
    useWorkout.getState().updateLastSetRest(elapsed);
    useWorkout.getState().setExerciseSetIndex(0, 1);

    const s = useWorkout.getState();
    expect(s.phase).toBe('set');
    expect(s.setIndex).toBe(1);
    expect(s.setsLog).toHaveLength(1);
    expect(s.setsLog[0]!.rest_taken_seconds).toBe(elapsed);
  });

  it('updateLastSetRest mutates only the last entry', () => {
    useWorkout.getState().logSet(baseEntry({ set_number: 1 }));
    useWorkout.getState().logSet(baseEntry({ set_number: 2 }));
    useWorkout.getState().updateLastSetRest(95);
    const log = useWorkout.getState().setsLog;
    expect(log[0]!.rest_taken_seconds).toBe(0);
    expect(log[1]!.rest_taken_seconds).toBe(95);
  });
});

describe('workout store — advanceSet transitions', () => {
  it('next-set within same exercise', () => {
    const kind = useWorkout.getState().advanceSet(3, 2);
    expect(kind).toBe('next-set');
    const s = useWorkout.getState();
    expect(s.exerciseIndex).toBe(0);
    expect(s.setIndex).toBe(1);
    expect(s.phase).toBe('set');
  });

  it('next-exercise when last set of current exercise', () => {
    useWorkout.getState().setExerciseSetIndex(0, 2); // last set of 3
    const kind = useWorkout.getState().advanceSet(3, 2);
    expect(kind).toBe('next-exercise');
    const s = useWorkout.getState();
    expect(s.exerciseIndex).toBe(1);
    expect(s.setIndex).toBe(0);
    expect(s.phase).toBe('set');
  });

  it('done when last set of last exercise', () => {
    useWorkout.getState().setExerciseSetIndex(1, 2);
    const kind = useWorkout.getState().advanceSet(3, 2);
    expect(kind).toBe('done');
    expect(useWorkout.getState().phase).toBe('done');
  });
});
