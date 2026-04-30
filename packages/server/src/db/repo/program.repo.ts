import type { DB } from '../connection.js';
import type { WorkoutProgram } from '@coach/shared';

export function getActiveProgram(db: DB): WorkoutProgram | null {
  const row = db.prepare('SELECT data_json FROM programs WHERE is_active = 1').get() as
    | { data_json: string }
    | undefined;
  if (!row) return null;
  return JSON.parse(row.data_json) as WorkoutProgram;
}

export function pushProgram(
  db: DB,
  program: WorkoutProgram,
): { id: string; imported_at: string } {
  const importedAt = new Date().toISOString();
  const json = JSON.stringify(program);
  const tx = db.transaction(() => {
    db.prepare('UPDATE programs SET is_active = 0 WHERE is_active = 1').run();
    db.prepare(
      `INSERT INTO programs
         (id, schema_version, name, goal, data_json, is_active,
          generated_by, generated_at, imported_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         schema_version = excluded.schema_version,
         name = excluded.name,
         goal = excluded.goal,
         data_json = excluded.data_json,
         is_active = 1,
         generated_by = excluded.generated_by,
         generated_at = excluded.generated_at,
         imported_at = excluded.imported_at`,
    ).run(
      program.program.id,
      program.schema_version,
      program.program.name,
      program.program.goal,
      json,
      program.program.generated_by,
      program.program.generated_at,
      importedAt,
    );
  });
  tx();
  return { id: program.program.id, imported_at: importedAt };
}
