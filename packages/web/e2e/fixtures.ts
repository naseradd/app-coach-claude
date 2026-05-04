import { test as base, type Page } from '@playwright/test';
import type { WorkoutProgram } from '@coach/shared';

/**
 * Two-program harness for the workout runner. We don't hit the real backend
 * — every `/api/*`, `/health`, and `/api/events` call is fulfilled by
 * `setupRoutes()` from in-memory state.
 *
 * The bearer token is dummy: the client only checks that one is configured.
 */

const BEARER = 'e2e-dummy-bearer-token-thirty-two-chars-min';
const BASE = 'http://127.0.0.1:4173';

/** Strength block, 1 exercise, 3 working sets, 60s rest. */
export function makeStrengthProgram(): WorkoutProgram {
  return {
    schema_version: '1.0.0',
    program: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'E2E Strength',
      generated_at: '2026-05-03T10:00:00.000Z',
      generated_by: 'e2e',
      goal: 'strength',
      notes: 'E2E test program.',
      duration_weeks: 1,
      sessions_per_week: 1,
    },
    sessions: [
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        session_number: 1,
        name: 'E2E Push',
        scheduled_weekday: 'monday',
        estimated_duration_minutes: 30,
        tags: ['push'],
        warmup: { duration_minutes: 5, instructions: 'mobility' },
        blocks: [
          {
            id: 'block-1',
            name: 'Force',
            type: 'strength',
            notes: '',
            exercises: [
              {
                id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
                order: 1,
                name: 'Bench Press',
                category: 'compound',
                muscle_groups_primary: ['pectoraux'],
                muscle_groups_secondary: ['triceps'],
                equipment: ['barbell', 'bench'],
                video_url: null,
                alternatives: [],
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
                    rest_seconds: 60,
                    notes: '',
                  },
                  {
                    set_number: 2,
                    type: 'working',
                    reps: 5,
                    reps_min: null,
                    reps_max: null,
                    weight_kg: 80,
                    weight_unit: 'kg',
                    rpe_target: 8,
                    duration_seconds: null,
                    rest_seconds: 60,
                    notes: '',
                  },
                  {
                    set_number: 3,
                    type: 'working',
                    reps: 5,
                    reps_min: null,
                    reps_max: null,
                    weight_kg: 80,
                    weight_unit: 'kg',
                    rpe_target: 8,
                    duration_seconds: null,
                    rest_seconds: 60,
                    notes: '',
                  },
                ],
                coaching_cues: ['Rétracte les omoplates'],
                progression_note: '+2.5kg si tous sets RIR 1+',
              },
            ],
          },
        ],
        cooldown: null,
      },
    ],
  };
}

/** Single-set program for testing the final-set → done transition. */
export function makeSingleSetProgram(): WorkoutProgram {
  const p = makeStrengthProgram();
  p.sessions[0]!.blocks[0]!.exercises[0]!.sets = [
    p.sessions[0]!.blocks[0]!.exercises[0]!.sets[0]!,
  ];
  return p;
}

/** Superset block: A 2 sets, B 2 sets, interleaved A1→B1→A2→B2. */
export function makeSupersetProgram(): WorkoutProgram {
  const p = makeStrengthProgram();
  const ex1 = p.sessions[0]!.blocks[0]!.exercises[0]!;
  // Trim to 2 sets each.
  ex1.sets = ex1.sets.slice(0, 2).map((s) => ({ ...s, rest_seconds: 30 }));
  const ex2 = {
    ...ex1,
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    name: 'Bent-Over Row',
    muscle_groups_primary: ['dos'],
    sets: ex1.sets.map((s) => ({ ...s, rest_seconds: 60 })),
  };
  p.sessions[0]!.blocks[0]!.type = 'superset';
  p.sessions[0]!.blocks[0]!.exercises = [ex1, ex2];
  return p;
}

interface ServerState {
  program: WorkoutProgram | null;
  activeSession: unknown | null;
  putCalls: number;
  postedSessions: unknown[];
}

/**
 * Mounts route handlers for every backend call the SPA makes during a
 * workout. Returns mutable state so a test can assert on side effects
 * (e.g. number of active-session syncs).
 */
export async function setupRoutes(
  page: Page,
  program: WorkoutProgram,
): Promise<ServerState> {
  const state: ServerState = {
    program,
    activeSession: null,
    putCalls: 0,
    postedSessions: [],
  };

  // Bypass onboarding by seeding settings BEFORE any page navigation.
  // Done in addInitScript so the value is present on every reload.
  await page.addInitScript(
    ({ baseUrl, bearer }) => {
      const settings = {
        state: {
          theme: 'warm-cream',
          serverUrl: baseUrl,
          bearer,
          weightUnit: 'kg',
          haptics: false,
        },
        version: 1,
      };
      window.localStorage.setItem('coach.settings', JSON.stringify(settings));
    },
    { baseUrl: BASE, bearer: BEARER },
  );

  // Health probe.
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ts: new Date().toISOString() }) }),
  );

  // Events SSE — we hold the connection open with an empty stream so the
  // client's onerror reconnect storm doesn't fire. Browser will treat this as
  // an active stream that just never sends events.
  await page.route('**/api/events**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
      body: ': keepalive\n\n',
    }),
  );

  await page.route('**/api/profile', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) }),
  );

  await page.route('**/api/setup-status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ complete: true, missing: [] }),
    }),
  );

  await page.route('**/api/program', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.program),
    }),
  );

  await page.route('**/api/sessions**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      // listSessions
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() ?? '{}');
      state.postedSessions.push(body);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    }
    return route.fulfill({ status: 204 });
  });

  await page.route('**/api/active-session', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.activeSession),
      });
    }
    if (req.method() === 'PUT') {
      state.putCalls += 1;
      try {
        state.activeSession = JSON.parse(req.postData() ?? 'null');
      } catch {
        state.activeSession = null;
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    }
    if (req.method() === 'DELETE') {
      state.activeSession = null;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    }
    return route.fulfill({ status: 204 });
  });

  return state;
}

export const test = base.extend<{}>({});
export { expect } from '@playwright/test';
