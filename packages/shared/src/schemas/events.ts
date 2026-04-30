import { z } from 'zod';
import { WorkoutProgram } from './program.js';
import { UserProfile } from './profile.js';

export const SseEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hello'), ts: z.string() }),
  z.object({ type: z.literal('heartbeat'), ts: z.string() }),
  z.object({ type: z.literal('program_received'), program: WorkoutProgram }),
  z.object({ type: z.literal('profile_updated'), profile: UserProfile }),
  z.object({ type: z.literal('history_changed'), report_id: z.string() }),
]);
export type SseEvent = z.infer<typeof SseEvent>;
