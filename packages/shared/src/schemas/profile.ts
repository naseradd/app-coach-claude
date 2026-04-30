import { z } from 'zod';
import { IsoDate } from './primitives.js';

export const UserProfile = z.object({
  schema_version: z.literal('1.0.0'),
  display_name: z.string().min(1),
  age: z.number().int().min(13).max(100),
  height_cm: z.number().positive(),
  weight_kg: z.number().positive(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  injuries: z
    .array(
      z.object({
        body_part: z.string(),
        severity: z.enum(['mild', 'moderate', 'severe']),
        notes: z.string().optional(),
      }),
    )
    .default([]),
  one_rep_max_kg: z.record(z.string(), z.number().positive()).default({}),
  weight_unit_preference: z.enum(['kg', 'lbs']).default('kg'),
  updated_at: IsoDate,
});
export type UserProfile = z.infer<typeof UserProfile>;
