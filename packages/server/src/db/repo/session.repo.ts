import type { DB } from '../connection.js';
import type { SessionReport } from '@coach/shared';

export function insertReport(db: DB, report: SessionReport): SessionReport {
  const createdAt = new Date().toISOString();
  const prCount = report.exercises_log
    .flatMap((e) => e.sets_log)
    .filter((s) => s.is_pr).length;
  db.prepare(
    `INSERT INTO session_reports
       (id, program_id, session_id, session_name, started_at, completed_at,
        duration_minutes, completion_rate, total_volume_kg, pr_count, data_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    report.id,
    report.program_id,
    report.session_id,
    report.session_name,
    report.started_at,
    report.completed_at,
    report.duration_actual_minutes,
    report.completion_rate,
    report.volume_summary.total_volume_kg,
    prCount,
    JSON.stringify(report),
    createdAt,
  );
  return report;
}

export function listReports(db: DB, limit = 50, offset = 0): SessionReport[] {
  const rows = db
    .prepare(
      `SELECT data_json FROM session_reports
       ORDER BY started_at DESC LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as { data_json: string }[];
  return rows.map((r) => JSON.parse(r.data_json) as SessionReport);
}

export function getReport(db: DB, id: string): SessionReport | null {
  const row = db
    .prepare('SELECT data_json FROM session_reports WHERE id = ?')
    .get(id) as { data_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.data_json) as SessionReport;
}
