import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DB } from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(__dirname, 'sql');

interface MigrationFile {
  version: number;
  name: string;
  sql: string;
}

function loadMigrations(): MigrationFile[] {
  const files = readdirSync(SQL_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();
  return files.map((f) => {
    const version = parseInt(f.slice(0, 3), 10);
    return {
      version,
      name: f,
      sql: readFileSync(join(SQL_DIR, f), 'utf8'),
    };
  });
}

export function runMigrations(db: DB): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const applied = new Set(
    db.prepare('SELECT version FROM _migrations').all().map((r: any) => r.version),
  );
  const migs = loadMigrations();
  const insertMig = db.prepare('INSERT INTO _migrations (version, applied_at) VALUES (?, ?)');
  for (const m of migs) {
    if (applied.has(m.version)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      insertMig.run(m.version, new Date().toISOString());
    })();
    console.log(`migration applied: ${m.name}`);
  }
}
