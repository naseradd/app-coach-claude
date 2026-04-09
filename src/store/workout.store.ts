import { create } from 'zustand'
import type { WorkoutProgram, WorkoutSession, SetLog, SessionReport } from '../schemas'
import { clearActiveSession, saveReport } from '../db'
import { nanoid } from '../utils/nanoid'

export type WorkoutPhase =
  | 'idle'
  | 'pre_session'
  | 'active'
  | 'rest'
  | 'post_session'
  | 'completed'

export interface ActiveSet {
  blockIndex: number
  exerciseIndex: number // within block
  setIndex: number
}

interface WorkoutState {
  phase: WorkoutPhase
  program: WorkoutProgram | null
  session: WorkoutSession | null
  sessionId: string | null
  startedAt: string | null
  energyLevel: number | null

  // Tracking: exerciseId → setNumber → SetLog
  setLogs: Record<string, Record<number, SetLog>>

  // Navigation state
  currentBlockIndex: number
  currentExerciseIndex: number // within block
  currentSetIndex: number

  // Rest timer
  restSeconds: number
  restRemaining: number

  // Actions
  startSession: (program: WorkoutProgram, session: WorkoutSession, energyLevel: number | null) => void
  logSet: (exerciseId: string, setNumber: number, log: Partial<SetLog>) => void
  completeSet: (exerciseId: string, setNumber: number, log: Partial<SetLog>, restSeconds: number) => void
  skipSet: (exerciseId: string, setNumber: number) => void
  tickRest: () => void
  skipRest: () => void
  advanceToNextSet: () => void
  finishSession: (postSessionData: { overallFeeling: number | null; notes: string }) => Promise<SessionReport>
  reset: () => void
}

const defaultState = {
  phase: 'idle' as WorkoutPhase,
  program: null,
  session: null,
  sessionId: null,
  startedAt: null,
  energyLevel: null,
  setLogs: {} as Record<string, Record<number, SetLog>>,
  currentBlockIndex: 0,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  restSeconds: 0,
  restRemaining: 0,
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...defaultState,

  startSession: (program, session, energyLevel) => {
    const sessionId = nanoid()
    const startedAt = new Date().toISOString()
    set({
      phase: 'active',
      program,
      session,
      sessionId,
      startedAt,
      energyLevel,
      setLogs: {},
      currentBlockIndex: 0,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    })
  },

  logSet: (exerciseId, setNumber, log) => {
    const { setLogs } = get()
    const existing = setLogs[exerciseId]?.[setNumber] ?? {}
    set({
      setLogs: {
        ...setLogs,
        [exerciseId]: {
          ...setLogs[exerciseId],
          [setNumber]: { ...existing, ...log } as SetLog,
        },
      },
    })
  },

  completeSet: (exerciseId, setNumber, log, restSeconds) => {
    const { setLogs } = get()
    const existing = setLogs[exerciseId]?.[setNumber] ?? {}
    const completedLog: SetLog = {
      set_number: setNumber,
      type: existing.type ?? 'working',
      planned_reps: existing.planned_reps ?? null,
      actual_reps: log.actual_reps ?? existing.actual_reps ?? null,
      planned_weight_kg: existing.planned_weight_kg ?? null,
      actual_weight_kg: log.actual_weight_kg ?? existing.actual_weight_kg ?? null,
      rpe_actual: log.rpe_actual ?? null,
      rest_taken_seconds: null,
      completed: true,
      notes: log.notes ?? '',
    }

    set({
      phase: 'rest',
      restSeconds,
      restRemaining: restSeconds,
      setLogs: {
        ...setLogs,
        [exerciseId]: {
          ...setLogs[exerciseId],
          [setNumber]: completedLog,
        },
      },
    })
  },

  skipSet: (exerciseId, setNumber) => {
    const { setLogs } = get()
    const existing = setLogs[exerciseId]?.[setNumber] ?? {}
    set({
      setLogs: {
        ...setLogs,
        [exerciseId]: {
          ...setLogs[exerciseId],
          [setNumber]: {
            ...existing,
            set_number: setNumber,
            type: existing.type ?? 'working',
            planned_reps: existing.planned_reps ?? null,
            actual_reps: null,
            planned_weight_kg: existing.planned_weight_kg ?? null,
            actual_weight_kg: null,
            rpe_actual: null,
            rest_taken_seconds: null,
            completed: false,
            notes: 'skipped',
          } as SetLog,
        },
      },
    })
    get().advanceToNextSet()
  },

  tickRest: () => {
    const { restRemaining, setLogs, currentBlockIndex, currentExerciseIndex, currentSetIndex, session } = get()
    if (restRemaining <= 0) {
      // Record actual rest time
      const block = session?.blocks[currentBlockIndex]
      const exercise = block?.exercises[currentExerciseIndex]
      if (exercise) {
        const actualRest = get().restSeconds
        const exLogs = setLogs[exercise.id] ?? {}
        const setNum = currentSetIndex + 1
        const log = exLogs[setNum]
        if (log) {
          set({
            setLogs: {
              ...setLogs,
              [exercise.id]: {
                ...exLogs,
                [setNum]: { ...log, rest_taken_seconds: actualRest },
              },
            },
          })
        }
      }
      get().advanceToNextSet()
      return
    }
    set({ restRemaining: restRemaining - 1 })
  },

  skipRest: () => {
    get().advanceToNextSet()
  },

  advanceToNextSet: () => {
    const { session, currentBlockIndex, currentExerciseIndex, currentSetIndex } = get()
    if (!session) return

    const block = session.blocks[currentBlockIndex]
    if (!block) {
      set({ phase: 'post_session' })
      return
    }

    const exercise = block.exercises[currentExerciseIndex]

    // Superset: alternate exercises before incrementing set
    if (block.type === 'superset') {
      const nextExerciseIndex = currentExerciseIndex + 1
      if (nextExerciseIndex < block.exercises.length) {
        // Move to next exercise in superset (same set round)
        set({ phase: 'active', currentExerciseIndex: nextExerciseIndex })
        return
      } else {
        // All exercises in superset done for this round → increment set
        const nextSetIndex = currentSetIndex + 1
        const maxSets = Math.max(...block.exercises.map((e) => e.sets.length))
        if (nextSetIndex < maxSets) {
          set({ phase: 'active', currentExerciseIndex: 0, currentSetIndex: nextSetIndex })
          return
        }
      }
    } else {
      // Strength: all sets of current exercise before moving on
      const nextSetIndex = currentSetIndex + 1
      if (exercise && nextSetIndex < exercise.sets.length) {
        set({ phase: 'active', currentSetIndex: nextSetIndex })
        return
      }

      // Move to next exercise in block
      const nextExerciseIndex = currentExerciseIndex + 1
      if (nextExerciseIndex < block.exercises.length) {
        set({ phase: 'active', currentExerciseIndex: nextExerciseIndex, currentSetIndex: 0 })
        return
      }
    }

    // Move to next block
    const nextBlockIndex = currentBlockIndex + 1
    if (nextBlockIndex < session.blocks.length) {
      set({ phase: 'active', currentBlockIndex: nextBlockIndex, currentExerciseIndex: 0, currentSetIndex: 0 })
      return
    }

    // Session done
    set({ phase: 'post_session' })
  },

  finishSession: async (postSessionData) => {
    const { program, session, sessionId, startedAt, energyLevel, setLogs } = get()
    if (!program || !session || !sessionId || !startedAt) throw new Error('No active session')

    const completedAt = new Date().toISOString()
    const startMs = new Date(startedAt).getTime()
    const endMs = new Date(completedAt).getTime()
    const durationMinutes = Math.round((endMs - startMs) / 60000)

    let totalSets = 0
    let doneSets = 0
    let totalReps = 0
    let totalVolume = 0

    const exercisesLog = session.blocks.flatMap((block) =>
      block.exercises.map((exercise) => {
        const setsLog = exercise.sets.map((s) => {
          const log = setLogs[exercise.id]?.[s.set_number]
          const completed = log?.completed ?? false
          if (s.type !== 'warmup') totalSets++
          if (completed && s.type !== 'warmup') doneSets++
          const reps = log?.actual_reps ?? 0
          const weight = log?.actual_weight_kg ?? 0
          if (completed) {
            totalReps += reps
            totalVolume += reps * weight
          }
          return {
            set_number: s.set_number,
            type: s.type,
            planned_reps: s.reps,
            actual_reps: log?.actual_reps ?? null,
            planned_weight_kg: s.weight_kg,
            actual_weight_kg: log?.actual_weight_kg ?? null,
            rpe_actual: log?.rpe_actual ?? null,
            rest_taken_seconds: log?.rest_taken_seconds ?? null,
            completed: log?.completed ?? false,
            notes: log?.notes ?? '',
          }
        })
        const exerciseDone = setsLog.some((s) => s.completed)
        return {
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          completed: exerciseDone,
          sets_log: setsLog,
          notes: '',
        }
      })
    )

    const report: SessionReport = {
      id: nanoid(),
      program_id: program.program.id,
      session_id: session.id,
      session_name: session.name,
      started_at: startedAt,
      completed_at: completedAt,
      duration_actual_minutes: durationMinutes,
      completion_rate: totalSets > 0 ? doneSets / totalSets : 0,
      pre_session: { energy_level: energyLevel, notes: '' },
      post_session: {
        overall_feeling: postSessionData.overallFeeling,
        notes: postSessionData.notes,
      },
      exercises_log: exercisesLog,
      volume_summary: {
        total_sets_done: doneSets,
        total_reps_done: totalReps,
        total_volume_kg: Math.round(totalVolume),
      },
    }

    await saveReport(report)
    await clearActiveSession()
    set({ phase: 'completed' })
    return report
  },

  reset: () => {
    set(defaultState)
  },
}))
