import { describe, it, expect } from 'vitest';
import type { SessionDef } from '@coach/shared';
import { buildFlatPlan } from '../src/utils/flatPlan.js';

const ex = (id: string, sets: number) => ({
  id,
  order: 1,
  name: id,
  category: 'compound' as const,
  muscle_groups_primary: [],
  muscle_groups_secondary: [],
  equipment: [],
  sets: Array.from({ length: sets }, (_, i) => ({
    set_number: i + 1,
    type: 'working' as const,
    reps: 5,
    reps_min: null,
    reps_max: null,
    weight_kg: 80,
    weight_unit: 'kg' as const,
    rpe_target: 8,
    duration_seconds: null,
    rest_seconds: 60,
    notes: '',
  })),
  coaching_cues: [],
  progression_note: null,
  alternatives: [],
});

const session = (blocks: SessionDef['blocks']): SessionDef => ({
  id: 's',
  session_number: 1,
  name: 'Session',
  estimated_duration_minutes: 60,
  tags: [],
  blocks,
});

describe('buildFlatPlan', () => {
  it('strength block runs sequentially per exercise', () => {
    const s = session([
      { id: 'b', name: 'B', type: 'strength', notes: '', exercises: [ex('A', 3), ex('B', 2)] },
    ]);
    const plan = buildFlatPlan(s);
    expect(plan.map((p) => `${p.exercise.id}-${p.set.set_number}`)).toEqual([
      'A-1', 'A-2', 'A-3', 'B-1', 'B-2',
    ]);
    expect(plan.every((p) => p.blockType === 'strength')).toBe(true);
  });

  it('superset block interleaves A/B by round', () => {
    const s = session([
      { id: 'b', name: 'SS', type: 'superset', notes: '', exercises: [ex('A', 3), ex('B', 3)] },
    ]);
    const plan = buildFlatPlan(s);
    expect(plan.map((p) => `${p.exercise.id}-${p.set.set_number}`)).toEqual([
      'A-1', 'B-1', 'A-2', 'B-2', 'A-3', 'B-3',
    ]);
    expect(plan.every((p) => p.blockType === 'superset')).toBe(true);
    expect(plan[0]!.roundIndex).toBe(0);
    expect(plan[2]!.roundIndex).toBe(1);
  });

  it('superset with mismatched set counts uses max rounds and skips missing slots', () => {
    const s = session([
      { id: 'b', name: 'SS', type: 'superset', notes: '', exercises: [ex('A', 3), ex('B', 2)] },
    ]);
    const plan = buildFlatPlan(s);
    expect(plan.map((p) => `${p.exercise.id}-${p.set.set_number}`)).toEqual([
      'A-1', 'B-1', 'A-2', 'B-2', 'A-3',
    ]);
  });

  it('circuit block interleaves all exercises by round', () => {
    const s = session([
      { id: 'b', name: 'C', type: 'circuit', notes: '', exercises: [ex('A', 2), ex('B', 2), ex('C', 2)] },
    ]);
    const plan = buildFlatPlan(s);
    expect(plan.map((p) => `${p.exercise.id}-${p.set.set_number}`)).toEqual([
      'A-1', 'B-1', 'C-1', 'A-2', 'B-2', 'C-2',
    ]);
  });

  it('preserves block order across multiple blocks', () => {
    const s = session([
      { id: 'b1', name: 'Strength', type: 'strength', notes: '', exercises: [ex('A', 2)] },
      { id: 'b2', name: 'SS', type: 'superset', notes: '', exercises: [ex('X', 2), ex('Y', 2)] },
    ]);
    const plan = buildFlatPlan(s);
    expect(plan.map((p) => `${p.exercise.id}-${p.set.set_number}`)).toEqual([
      'A-1', 'A-2', 'X-1', 'Y-1', 'X-2', 'Y-2',
    ]);
  });
});
