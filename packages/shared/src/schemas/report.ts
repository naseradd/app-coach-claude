import { z } from 'zod';
import { Uuid, IsoDate, Rpe } from './primitives.js';

export const SetLog = z.object({
  set_number: z.number().int().positive(),
  type: z.enum(['warmup', 'working', 'amrap', 'dropset', 'backoff', 'timed']),
  planned_reps: z.number().int().nullable(),
  actual_reps: z.number().int().nullable(),
  planned_weight_kg: z.number().nullable(),
  actual_weight_kg: z.number().nullable(),
  rpe_planned: Rpe.nullable(),
  rpe_actual: Rpe.nullable(),
  rest_planned_seconds: z.number().nonnegative(),
  rest_taken_seconds: z.number().nonnegative(),
  duration_seconds: z.number().nonnegative().nullable(),
  completed: z.boolean(),
  is_pr: z.boolean().default(false),
  notes: z.string().default(''),
});

export const ExerciseLog = z.object({
  exercise_id: Uuid,
  exercise_name: z.string(),
  completed: z.boolean(),
  skipped: z.boolean(),
  sets_log: z.array(SetLog),
  notes: z.string().default(''),
});

export const SessionReport = z.object({
  schema_version: z.literal('1.0.0'),
  id: Uuid,
  program_id: Uuid,
  session_id: Uuid,
  session_name: z.string(),
  started_at: IsoDate,
  completed_at: IsoDate,
  duration_actual_minutes: z.number().int().positive(),
  completion_rate: z.number().min(0).max(1),
  pre_session: z.object({
    energy_level: z.number().min(1).max(10).nullable(),
    sleep_quality: z.number().min(1).max(10).nullable(),
    soreness_level: z.number().min(1).max(10).nullable(),
    notes: z.string().default(''),
  }),
  post_session: z.object({
    overall_feeling: z.number().min(1).max(5),
    difficulty_perceived: z.number().min(1).max(10).nullable(),
    notes: z.string().default(''),
  }),
  exercises_log: z.array(ExerciseLog),
  volume_summary: z.object({
    total_sets_planned: z.number().int().nonnegative(),
    total_sets_done: z.number().int().nonnegative(),
    total_reps_done: z.number().int().nonnegative(),
    total_volume_kg: z.number().nonnegative(),
  }),
});
export type SessionReport = z.infer<typeof SessionReport>;
