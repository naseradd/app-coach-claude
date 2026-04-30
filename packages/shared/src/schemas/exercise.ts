import { z } from 'zod';
import { Uuid } from './primitives.js';
import { WorkSet } from './set.js';

export const ExerciseCategory = z.enum(['compound', 'isolation', 'cardio', 'mobility']);

export const Exercise = z.object({
  id: Uuid,
  order: z.number().int().positive(),
  name: z.string().min(1),
  category: ExerciseCategory,
  muscle_groups_primary: z.array(z.string()),
  muscle_groups_secondary: z.array(z.string()),
  equipment: z.array(z.string()),
  sets: z.array(WorkSet).min(1),
  coaching_cues: z.array(z.string()),
  progression_note: z.string().nullable(),
  video_url: z.string().url().nullable().optional(),
  alternatives: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string().optional(),
      }),
    )
    .default([]),
});
export type Exercise = z.infer<typeof Exercise>;

export const BlockType = z.enum(['strength', 'superset', 'circuit', 'emom', 'amrap', 'cardio']);

export const Block = z.object({
  id: z.string(),
  name: z.string(),
  type: BlockType,
  notes: z.string().default(''),
  exercises: z.array(Exercise).min(1),
});
export type Block = z.infer<typeof Block>;
