import { z } from 'zod';
import { IsoDate } from './primitives.js';
import { SCHEMA_VERSION } from './version.js';

export const UserProfile = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  display_name: z.string().min(1).max(100),
  age: z.number().int().min(13).max(100),
  height_cm: z.number().positive(),
  weight_kg: z.number().positive(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string().max(200)).max(20).default([]),
  equipment: z.array(z.string().max(80)).max(50).default([]),
  injuries: z
    .array(
      z.object({
        body_part: z.string().min(1).max(100),
        severity: z.enum(['mild', 'moderate', 'severe']),
        notes: z.string().max(500).optional(),
      }),
    )
    .max(50)
    .default([]),
  one_rep_max_kg: z.record(z.string().min(1).max(50), z.number().positive()).default({}),
  weight_unit_preference: z.enum(['kg', 'lbs']).default('kg'),
  updated_at: IsoDate,
});
export type UserProfile = z.infer<typeof UserProfile>;
