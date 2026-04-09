import { z } from 'zod'

// ─── Set ─────────────────────────────────────────────────────────────────────

export const SetSchema = z.object({
  set_number: z.number().int().positive(),
  type: z.enum(['warmup', 'working', 'amrap', 'timed', 'dropset', 'backoff']),
  reps: z.number().int().positive().nullable().default(null),
  reps_min: z.number().int().positive().nullable().default(null),
  reps_max: z.number().int().positive().nullable().default(null),
  weight_kg: z.number().nonnegative().nullable().default(null),
  rest_seconds: z.number().nonnegative().default(90),
  rpe_target: z.number().min(1).max(10).nullable().default(null),
  duration_seconds: z.number().positive().nullable().default(null),
  notes: z.string().default(''),
})
export type WorkoutSet = z.infer<typeof SetSchema>

// ─── Exercise ─────────────────────────────────────────────────────────────────

export const ExerciseSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  name: z.string().min(1),
  category: z.enum(['compound', 'isolation', 'cardio', 'mobility']),
  muscle_groups_primary: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  sets: z.array(SetSchema).min(1),
  coaching_cues: z.array(z.string()).default([]),
  progression_note: z.string().nullable().default(null),
})
export type WorkoutExercise = z.infer<typeof ExerciseSchema>

// ─── Block ────────────────────────────────────────────────────────────────────

export const BlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['strength', 'superset']),
  notes: z.string().default(''),
  exercises: z.array(ExerciseSchema).min(1),
})
export type WorkoutBlock = z.infer<typeof BlockSchema>

// ─── Session ──────────────────────────────────────────────────────────────────

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  scheduled_weekday: z
    .enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .nullable()
    .default(null),
  estimated_duration_minutes: z.number().positive().default(60),
  warmup: z
    .object({
      duration_minutes: z.number().positive(),
      instructions: z.string(),
    })
    .nullable()
    .default(null),
  blocks: z.array(BlockSchema).min(1),
  cooldown: z
    .object({
      duration_minutes: z.number().positive(),
      instructions: z.string(),
    })
    .nullable()
    .default(null),
})
export type WorkoutSession = z.infer<typeof SessionSchema>

// ─── Program ──────────────────────────────────────────────────────────────────

export const WorkoutProgramSchema = z.object({
  program: z.object({
    id: z.string(),
    name: z.string().min(1),
    goal: z.enum(['strength', 'hypertrophy', 'endurance', 'mobility', 'general']),
    notes: z.string().default(''),
  }),
  sessions: z.array(SessionSchema).min(1),
})
export type WorkoutProgram = z.infer<typeof WorkoutProgramSchema>

// ─── Set Log (during session) ─────────────────────────────────────────────────

export const SetLogSchema = z.object({
  set_number: z.number(),
  type: z.string(),
  planned_reps: z.number().nullable(),
  actual_reps: z.number().nullable(),
  planned_weight_kg: z.number().nullable(),
  actual_weight_kg: z.number().nullable(),
  rpe_actual: z.number().min(1).max(10).nullable(),
  rest_taken_seconds: z.number().nullable(),
  completed: z.boolean(),
  notes: z.string().default(''),
})
export type SetLog = z.infer<typeof SetLogSchema>

// ─── Session Report ───────────────────────────────────────────────────────────

export const SessionReportSchema = z.object({
  id: z.string(),
  program_id: z.string(),
  session_id: z.string(),
  session_name: z.string(),
  started_at: z.string(),
  completed_at: z.string(),
  duration_actual_minutes: z.number(),
  completion_rate: z.number().min(0).max(1),
  pre_session: z.object({
    energy_level: z.number().min(1).max(10).nullable(),
    notes: z.string().default(''),
  }),
  post_session: z.object({
    overall_feeling: z.number().min(1).max(10).nullable(),
    notes: z.string().default(''),
  }),
  exercises_log: z.array(
    z.object({
      exercise_id: z.string(),
      exercise_name: z.string(),
      completed: z.boolean(),
      sets_log: z.array(SetLogSchema),
      notes: z.string().default(''),
    })
  ),
  volume_summary: z.object({
    total_sets_done: z.number(),
    total_reps_done: z.number(),
    total_volume_kg: z.number(),
  }),
})
export type SessionReport = z.infer<typeof SessionReportSchema>
