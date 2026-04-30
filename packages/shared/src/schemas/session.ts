import { z } from 'zod';
import { Uuid, Weekday } from './primitives.js';
import { Block } from './exercise.js';

export const SessionDef = z.object({
  id: Uuid,
  session_number: z.number().int().positive(),
  name: z.string(),
  scheduled_weekday: Weekday.nullable().optional(),
  estimated_duration_minutes: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  warmup: z
    .object({
      duration_minutes: z.number().int().nonnegative(),
      instructions: z.string(),
    })
    .nullable()
    .optional(),
  blocks: z.array(Block).min(1),
  cooldown: z
    .object({
      duration_minutes: z.number().int().nonnegative(),
      instructions: z.string(),
    })
    .nullable()
    .optional(),
});
export type SessionDef = z.infer<typeof SessionDef>;
