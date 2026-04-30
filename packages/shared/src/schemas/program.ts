import { z } from 'zod';
import { Uuid, IsoDate } from './primitives.js';
import { SessionDef } from './session.js';
import { SCHEMA_VERSION } from '../index.js';

export const ProgramMeta = z.object({
  id: Uuid,
  name: z.string().min(1),
  generated_at: IsoDate,
  generated_by: z.string().default('claude'),
  goal: z
    .enum(['strength', 'hypertrophy', 'endurance', 'fat_loss', 'general'])
    .default('general'),
  notes: z.string().default(''),
  duration_weeks: z.number().int().positive(),
  sessions_per_week: z.number().int().positive().max(7),
});

export const WorkoutProgram = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  program: ProgramMeta,
  sessions: z.array(SessionDef).min(1),
});
export type WorkoutProgram = z.infer<typeof WorkoutProgram>;
