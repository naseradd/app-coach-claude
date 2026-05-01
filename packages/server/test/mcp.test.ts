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

  it('exports the 6 expected tools with consistent shape', () => {
    expect(TOOLS).toHaveLength(6);
    const names = TOOLS.map((t) => t.name).sort();
    expect(names).toEqual(
      [
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
});
