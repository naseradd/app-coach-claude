import { z } from 'zod';
import { Uuid } from './primitives.js';
import { WorkSet } from './set.js';

export const ExerciseCategory = z.enum(['compound', 'isolation', 'cardio', 'mobility']);

export const Exercise = z.object({
  id: Uuid,
  order: z.number().int().positive(),
  name: z.string().min(1).max(200),
  category: ExerciseCategory,
  muscle_groups_primary: z.array(z.string().max(80)).max(20),
  muscle_groups_secondary: z.array(z.string().max(80)).max(20),
  equipment: z.array(z.string().max(80)).max(30),
  sets: z.array(WorkSet).min(1),
  coaching_cues: z.array(z.string().max(500)).max(20).default([]),
  progression_note: z.string().max(500).nullable(),
  video_url: z.string().url().nullable().optional(),
  alternatives: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        reason: z.string().max(500).optional(),
      }),
    )
    .max(10)
    .default([]),
});
export type Exercise = z.infer<typeof Exercise>;

export const BlockType = z.enum(['strength', 'superset', 'circuit', 'emom', 'amrap', 'cardio']);

export const Block = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  type: BlockType,
  notes: z.string().max(1000).default(''),
  exercises: z.array(Exercise).min(1),
});
export type Block = z.infer<typeof Block>;
