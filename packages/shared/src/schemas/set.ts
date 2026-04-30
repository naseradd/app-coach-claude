import { z } from 'zod';
import { Rpe, WeightUnit } from './primitives.js';

export const SetType = z.enum(['warmup', 'working', 'amrap', 'dropset', 'backoff', 'timed']);

export const WorkSet = z.object({
  set_number: z.number().int().positive(),
  type: SetType,
  reps: z.number().int().positive().nullable(),
  reps_min: z.number().int().positive().nullable(),
  reps_max: z.number().int().positive().nullable(),
  weight_kg: z.number().nonnegative().nullable(),
  weight_unit: WeightUnit.default('kg'),
  rpe_target: Rpe.nullable(),
  duration_seconds: z.number().positive().nullable(),
  rest_seconds: z.number().nonnegative(),
  notes: z.string().default(''),
});
export type WorkSet = z.infer<typeof WorkSet>;
