import { describe, it, expect } from 'vitest';
import { openDb } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrations.js';

describe('db migrations', () => {
  it('applies all migrations on a fresh in-memory db', () => {
    const db = openDb(':memory:');
    runMigrations(db);
    const tables = (
      db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
        .all() as { name: string }[]
    ).map((r) => r.name);
    expect(tables).toContain('profile');
    expect(tables).toContain('programs');
    expect(tables).toContain('session_reports');
    expect(tables).toContain('active_session');
    expect(tables).toContain('_migrations');
    const versions = db.prepare('SELECT version FROM _migrations').all();
    expect(versions.length).toBeGreaterThanOrEqual(1);
  });

  it('is idempotent', () => {
    const db = openDb(':memory:');
    runMigrations(db);
    runMigrations(db);
    const versions = db.prepare('SELECT COUNT(*) as c FROM _migrations').get() as { c: number };
    expect(versions.c).toBe(1);
  });
});
