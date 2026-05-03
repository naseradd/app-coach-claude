import { describe, it, expect, beforeEach } from 'vitest';
import { openDb } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrations.js';
import { buildMcpServer, TOOLS } from '../src/mcp/handler.js';
import { readProfile } from '../src/mcp/tools/readProfile.js';
import { updateProfile } from '../src/mcp/tools/updateProfile.js';
import { readActiveProgram } from '../src/mcp/tools/readActiveProgram.js';
import { pushProgram } from '../src/mcp/tools/pushProgram.js';
import { readHistory } from '../src/mcp/tools/readHistory.js';
import { readAggregateStats } from '../src/mcp/tools/readAggregateStats.js';
import { getSchemaTool } from '../src/mcp/tools/getSchema.js';
import { eventBus } from '../src/events/bus.js';

const sampleProfile = {
  schema_version: '1.0.0',
  display_name: 'Dany',
  age: 30,
  height_cm: 180,
  weight_kg: 78,
  experience_level: 'intermediate',
  goals: ['strength'],
  equipment: ['barbell'],
  injuries: [],
  one_rep_max_kg: { bench: 100 },
  weight_unit_preference: 'kg',
};

describe('mcp', () => {
  let db: ReturnType<typeof openDb>;
  beforeEach(() => {
    db = openDb(':memory:');
    runMigrations(db);
  });

  it('exports the 7 expected tools with consistent shape', () => {
    expect(TOOLS).toHaveLength(7);
    const names = TOOLS.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        'get_schema',
        'read_active_program',
        'read_aggregate_stats',
        'read_history',
        'read_profile',
        'push_program',
        'update_profile',
      ].sort(),
    );
    for (const t of TOOLS) {
      expect(typeof t.name).toBe('string');
      expect(typeof t.description).toBe('string');
      expect(t.inputSchema.type).toBe('object');
      expect(typeof t.handler).toBe('function');
    }
  });

  it('buildMcpServer constructs without throwing', () => {
    const server = buildMcpServer(db);
    expect(server).toBeDefined();
  });

  it('read_profile returns null when empty', async () => {
    const res = await readProfile.handler(db)({});
    expect(res.content[0].text).toBe('null');
  });

  it('update_profile rejects invalid payload', async () => {
    const res = await updateProfile.handler(db)({ profile: { display_name: 'x' } });
    expect('isError' in res && res.isError).toBe(true);
  });

  it('update_profile -> read_profile round-trip', async () => {
    const upd = await updateProfile.handler(db)({ profile: sampleProfile });
    expect(upd.content[0].text).toBe('ok');
    const read = await readProfile.handler(db)({});
    const parsed = JSON.parse(read.content[0].text);
    expect(parsed.display_name).toBe('Dany');
  });

  it('push_program rejects invalid payload', async () => {
    const res = await pushProgram.handler(db)({ program: { foo: 'bar' } });
    expect('isError' in res && res.isError).toBe(true);
  });

  it('read_active_program returns null initially', async () => {
    const res = await readActiveProgram.handler(db)({});
    expect(res.content[0].text).toBe('null');
  });

  it('read_history rejects out-of-range limit', async () => {
    const res = await readHistory.handler(db)({ limit: 9999 });
    expect('isError' in res && res.isError).toBe(true);
  });

  it('read_history returns empty array initially', async () => {
    const res = await readHistory.handler(db)({});
    expect(res.content[0].text).toBe('[]');
  });

  it('read_aggregate_stats returns zeros initially', async () => {
    const res = await readAggregateStats.handler(db)({});
    const stats = JSON.parse(res.content[0].text);
    expect(stats.sessions_total).toBe(0);
  });

  it('get_schema returns parseable JSON with schemas + examples + notes', async () => {
    const res = await getSchemaTool.handler(db)();
    const payload = JSON.parse(res.content[0].text);
    expect(payload.schemas.WorkoutProgram).toBeDefined();
    expect(payload.schemas.UserProfile).toBeDefined();
    expect(payload.schemas.SessionReport).toBeDefined();
    expect(payload.examples.WorkoutProgram).toBeDefined();
    expect(Array.isArray(payload.notes)).toBe(true);
    expect(payload.notes.length).toBeGreaterThan(0);
    expect(payload.schema_version).toBe('1.0.0');
  });
});

describe('mcp event publication', () => {
  it('update_profile publishes profile_updated', async () => {
    const db = openDb(':memory:');
    runMigrations(db);
    const events: any[] = [];
    const unsub = eventBus.subscribe((ev) => events.push(ev));
    try {
      const handler = updateProfile.handler(db);
      const profile = {
        schema_version: '1.0.0',
        display_name: 'Dany',
        age: 30,
        height_cm: 180,
        weight_kg: 78,
        experience_level: 'intermediate',
        goals: ['strength'],
        equipment: ['barbell'],
        injuries: [],
        one_rep_max_kg: { bench: 100 },
        weight_unit_preference: 'kg',
      };
      const res = await handler({ profile });
      expect('isError' in res && res.isError).not.toBe(true);
      expect(events.some((e) => e.type === 'profile_updated')).toBe(true);
    } finally {
      unsub();
    }
  });

  it('push_program publishes program_received', async () => {
    const db = openDb(':memory:');
    runMigrations(db);
    const events: any[] = [];
    const unsub = eventBus.subscribe((ev) => events.push(ev));
    try {
      const handler = pushProgram.handler(db);
      const program = {
        schema_version: '1.0.0',
        program: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test',
          generated_at: '2026-04-08T10:00:00Z',
          generated_by: 'test',
          goal: 'strength',
          notes: '',
          duration_weeks: 4,
          sessions_per_week: 3,
        },
        sessions: [
          {
            id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            session_number: 1,
            name: 'A',
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
                    id: '22222222-2222-4222-8222-222222222222',
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
      const res = await handler({ program });
      expect('isError' in res && res.isError).not.toBe(true);
      expect(events.some((e) => e.type === 'program_received')).toBe(true);
    } finally {
      unsub();
    }
  });
});
