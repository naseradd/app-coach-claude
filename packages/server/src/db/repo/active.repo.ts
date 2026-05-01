import type { DB } from '../connection.js';

/**
 * Active workout session state — persisted server-side as JSON so the client
 * can resume mid-set after a crash, page reload, or device switch.
 *
 * Single row (id = 1). The schema is intentionally loose (JSON blob) because
 * the active session is a transient, client-driven structure that may evolve
 * faster than canonical schemas. Validation happens at the route layer.
 */
export interface ActiveSessionState {
  programId: string;
  sessionId: string;
  startedAt: string;
  phase: 'set' | 'rest' | 'done';
  exerciseIndex: number;
  setIndex: number;
  preSession?: {
    energy_level: number | null;
    sleep_quality: number | null;
    soreness_level: number | null;
    notes: string;
  };
  setsLog: Array<{
    exercise_id: string;
    set_number: number;
    type: string;
    actual_reps: number | null;
    actual_weight_kg: number | null;
    rpe_actual: number | null;
    rest_taken_seconds: number;
    duration_seconds: number | null;
    completed: boolean;
    notes: string;
  }>;
  /** ISO timestamp of when current rest started, used to compute real elapsed seconds. */
  restStartedAt?: string;
}

export function getActiveSession(db: DB): ActiveSessionState | null {
  const row = db
    .prepare('SELECT state_json FROM active_session WHERE id = 1')
    .get() as { state_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.state_json) as ActiveSessionState;
}

export function setActiveSession(db: DB, state: ActiveSessionState): void {
  const json = JSON.stringify(state);
  db.prepare(
    `INSERT INTO active_session (id, state_json, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`,
  ).run(json, new Date().toISOString());
}

export function clearActiveSession(db: DB): void {
  db.prepare('DELETE FROM active_session WHERE id = 1').run();
}
