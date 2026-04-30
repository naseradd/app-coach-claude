import { z } from 'zod';
import { Uuid, IsoDate } from './primitives.js';
import { SessionDef } from './session.js';
import { SCHEMA_VERSION } from './version.js';

export const ProgramMeta = z.object({
  id: Uuid,
  name: z.string().min(1).max(200),
  generated_at: IsoDate,
  generated_by: z.string().max(100).default('claude'),
  goal: z
    .enum(['strength', 'hypertrophy', 'endurance', 'fat_loss', 'general'])
    .default('general'),
  notes: z.string().max(5000).default(''),
  duration_weeks: z.number().int().positive(),
  sessions_per_week: z.number().int().positive().max(7),
});

export const WorkoutProgram = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  program: ProgramMeta,
  sessions: z.array(SessionDef).min(1),
});
export type WorkoutProgram = z.infer<typeof WorkoutProgram>;
