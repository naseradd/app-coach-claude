import type { DB } from '../connection.js';

export interface AggregateStats {
  weeks_active: number;
  sessions_total: number;
  avg_completion: number;
  total_volume_kg: number;
  total_prs: number;
  recent_strength: { date: string; exercise: string; weight_kg: number }[];
}

interface TotalsRow {
  sessions_total: number;
  avg_completion: number;
  total_volume_kg: number;
  total_prs: number;
  first_at: string | null;
  last_at: string | null;
}

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export function aggregateStats(db: DB): AggregateStats {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS sessions_total,
              COALESCE(AVG(completion_rate), 0) AS avg_completion,
              COALESCE(SUM(total_volume_kg), 0) AS total_volume_kg,
              COALESCE(SUM(pr_count), 0) AS total_prs,
              MIN(started_at) AS first_at,
              MAX(started_at) AS last_at
         FROM session_reports`,
    )
    .get() as TotalsRow;

  const weeksActive =
    totals.first_at && totals.last_at
      ? Math.max(
          1,
          Math.ceil(
            (new Date(totals.last_at).getTime() - new Date(totals.first_at).getTime()) / WEEK_MS,
          ),
        )
      : 0;

  return {
    weeks_active: weeksActive,
    sessions_total: totals.sessions_total,
    avg_completion: totals.avg_completion,
    total_volume_kg: totals.total_volume_kg,
    total_prs: totals.total_prs,
    recent_strength: [],
  };
}
