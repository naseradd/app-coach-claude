import { describe, it, expect } from 'vitest';
import { WorkoutProgram, SessionReport, UserProfile, SCHEMA_VERSION } from '../src/index.js';

// Imports kept to match plan; ensure exports resolve
void SessionReport;
void UserProfile;

const validProgram = {
  schema_version: '1.0.0',
  program: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test',
    generated_at: '2026-04-08T10:00:00Z',
    generated_by: 'claude-test',
    goal: 'strength',
    notes: '',
    duration_weeks: 4,
    sessions_per_week: 3,
  },
  sessions: [
    {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      session_number: 1,
      name: 'Day A',
      estimated_duration_minutes: 60,
      tags: [],
      blocks: [
        {
          id: 'b1',
          name: 'Main',
          type: 'strength',
          notes: '',
          exercises: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              order: 1,
              name: 'Bench',
              category: 'compound',
              muscle_groups_primary: ['chest'],
              muscle_groups_secondary: [],
              equipment: ['barbell'],
              sets: [
                {
                  set_number: 1,
                  type: 'working',
                  reps: 5,
                  reps_min: null,
                  reps_max: null,
                  weight_kg: 80,
                  weight_unit: 'kg',
                  rpe_target: 8,
                  duration_seconds: null,
                  rest_seconds: 180,
                  notes: '',
                },
              ],
              coaching_cues: [],
              progression_note: null,
              alternatives: [],
            },
          ],
        },
      ],
    },
  ],
};

describe('WorkoutProgram', () => {
  it('parses a valid program', () => {
    const r = WorkoutProgram.safeParse(validProgram);
    expect(r.success).toBe(true);
  });

  it('rejects bad schema_version', () => {
    const r = WorkoutProgram.safeParse({ ...validProgram, schema_version: '0.9.0' });
    expect(r.success).toBe(false);
  });

  it('rejects bad uuid', () => {
    const bad = JSON.parse(JSON.stringify(validProgram));
    bad.program.id = 'not-a-uuid';
    expect(WorkoutProgram.safeParse(bad).success).toBe(false);
  });
});

describe('SCHEMA_VERSION', () => {
  it('is 1.0.0', () => expect(SCHEMA_VERSION).toBe('1.0.0'));
});
