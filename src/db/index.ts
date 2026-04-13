import Dexie, { type Table } from 'dexie'
import type { WorkoutProgram, SessionReport } from '../schemas'

interface StoredProgram {
  id: string
  program: WorkoutProgram
  imported_at: string
}

interface StoredReport {
  id: string
  report: SessionReport
  started_at: string // indexed for sorting
}

interface StoredSetting {
  key: string
  value: string
}

interface StoredActiveSession {
  id: 'current'
  data: ActiveSessionData
}

export interface ActiveSessionData {
  programId: string
  sessionId: string
  sessionName: string
  startedAt: string
  energyLevel: number | null
  completedSets: Record<string, Record<number, SetCompletion>> // exerciseId → setNumber → data
  currentBlockIndex: number
  currentExerciseIndex: number
  currentSetIndex: number
}

export interface SetCompletion {
  actualReps: number | null
  actualWeightKg: number | null
  rpeActual: number | null
  restTakenSeconds: number | null
  completedAt: string
  notes: string
}

class FitnessDB extends Dexie {
  programs!: Table<StoredProgram>
  reports!: Table<StoredReport>
  settings!: Table<StoredSetting>
  active_session!: Table<StoredActiveSession>

  constructor() {
    super('FitnessCoachDB')
    this.version(1).stores({
      programs: 'id, imported_at',
      reports: 'id, started_at',
      settings: 'key',
      active_session: 'id',
    })
  }
}

export const db = new FitnessDB()

// ─── Program helpers ──────────────────────────────────────────────────────────

export async function saveProgram(program: WorkoutProgram): Promise<void> {
  await db.programs.put({
    id: program.program.id,
    program,
    imported_at: new Date().toISOString(),
  })
}

export async function getProgram(id: string): Promise<WorkoutProgram | undefined> {
  const stored = await db.programs.get(id)
  return stored?.program
}

export async function getLatestProgram(): Promise<WorkoutProgram | undefined> {
  const stored = await db.programs.orderBy('imported_at').last()
  return stored?.program
}

export async function getAllPrograms(): Promise<StoredProgram[]> {
  return db.programs.orderBy('imported_at').reverse().toArray()
}

export async function deleteProgram(id: string): Promise<void> {
  await db.programs.delete(id)
}

// ─── Report helpers ───────────────────────────────────────────────────────────

export async function saveReport(report: SessionReport): Promise<void> {
  await db.reports.put({
    id: report.id,
    report,
    started_at: report.started_at,
  })
}

export async function getAllReports(): Promise<SessionReport[]> {
  const stored = await db.reports.orderBy('started_at').reverse().toArray()
  return stored.map((s) => s.report)
}

export async function getReportsByProgram(programId: string): Promise<SessionReport[]> {
  const all = await getAllReports()
  return all.filter((r) => r.program_id === programId)
}

export async function deleteReport(id: string): Promise<void> {
  await db.reports.delete(id)
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | undefined> {
  const s = await db.settings.get(key)
  return s?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.settings.delete(key)
}

// ─── Active session helpers ───────────────────────────────────────────────────

export async function saveActiveSession(data: ActiveSessionData): Promise<void> {
  await db.active_session.put({ id: 'current', data })
}

export async function getActiveSession(): Promise<ActiveSessionData | undefined> {
  const s = await db.active_session.get('current')
  return s?.data
}

export async function clearActiveSession(): Promise<void> {
  await db.active_session.delete('current')
}
