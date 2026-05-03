import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { openDb } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrations.js';
import { sessionsRoute } from '../src/routes/sessions.js';
import { pushProgram } from '../src/db/repo/program.repo.js';

const programId = '550e8400-e29b-41d4-a716-446655440000';
const sessionId = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const exerciseId = '22222222-2222-4222-8222-222222222222';
const reportId = '11111111-1111-4111-8111-111111111111';

const sampleReport = {
  schema_version: '1.0.0' as const,
  id: reportId,
  program_id: programId,
  session_id: sessionId,
  session_name: 'Day A',
  started_at: '2026-04-08T09:00:00Z',
  completed_at: '2026-04-08T10:00:00Z',
  duration_actual_minutes: 60,
  completion_rate: 1,
  pre_session: { energy_level: 7, sleep_quality: 6, soreness_level: 3, notes: '' },
  post_session: { overall_feeling: 4, difficulty_perceived: 7, notes: '' },
  exercises_log: [],
  volume_summary: {
    total_sets_planned: 4,
    total_sets_done: 4,
    total_reps_done: 20,
    total_volume_kg: 1600,
  },
};

describe('sessions route', () => {
  it('POST stores and GET returns', async () => {
    const db = openDb(':memory:');
    runMigrations(db);
    pushProgram(db, {
      schema_version: '1.0.0',
      program: {
        id: programId,
        name: 'P',
        generated_at: '2026-04-08T08:00:00Z',
        generated_by: 't',
        goal: 'strength',
        notes: '',
        duration_weeks: 4,
        sessions_per_week: 3,
      },
      sessions: [
        {
          id: sessionId,
          session_number: 1,
          name: 'A',
          estimated_duration_minutes: 60,
          tags: [],
          blocks: [
            {
              id: 'b',
              name: 'B',
              type: 'strength',
              notes: '',
              exercises: [
                {
                  id: exerciseId,
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
    });
    const app = new Hono().route('/sessions', sessionsRoute(db));
    const post = await app.request('/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sampleReport),
    });
    expect(post.status).toBe(201);
    const list = await app.request('/sessions');
    expect(((await list.json()) as unknown[]).length).toBe(1);
    const one = await app.request(`/sessions/${reportId}`);
    expect(one.status).toBe(200);
  });

  it('rejects bad query params with 400', async () => {
    const db = openDb(':memory:');
    runMigrations(db);
    const app = new Hono().route('/sessions', sessionsRoute(db));
    const res = await app.request('/sessions?limit=abc');
    expect(res.status).toBe(400);
  });

  it('DELETE removes the report', async () => {
    const db = openDb(':memory:');
    runMigrations(db);
    pushProgram(db, {
      schema_version: '1.0.0',
      program: {
        id: programId,
        name: 'P',
        generated_at: '2026-04-08T08:00:00Z',
        generated_by: 't',
        goal: 'strength',
        notes: '',
        duration_weeks: 4,
        sessions_per_week: 3,
      },
      sessions: [
        {
          id: sessionId,
          session_number: 1,
          name: 'A',
          estimated_duration_minutes: 60,
          tags: [],
          blocks: [
            {
              id: 'b',
              name: 'B',
              type: 'strength',
              notes: '',
              exercises: [
                {
                  id: exerciseId,
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
    });
    const app = new Hono().route('/sessions', sessionsRoute(db));

    const post = await app.request('/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sampleReport),
    });
    expect(post.status).toBe(201);

    const del = await app.request(`/sessions/${reportId}`, { method: 'DELETE' });
    expect(del.status).toBe(204);

    const get = await app.request(`/sessions/${reportId}`);
    expect(get.status).toBe(404);

    const delAgain = await app.request(`/sessions/${reportId}`, { method: 'DELETE' });
    expect(delAgain.status).toBe(404);
  });
});
