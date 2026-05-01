import { UserProfile } from '@coach/shared';
import type { DB } from '../../db/connection.js';
import { upsertProfile } from '../../db/repo/profile.repo.js';
import { eventBus } from '../../events/bus.js';

type ToolResult =
  | { content: { type: 'text'; text: string }[] }
  | { isError: true; content: { type: 'text'; text: string }[] };

export const updateProfile = {
  name: 'update_profile',
  description:
    "Replace the user's fitness profile with a new UserProfile object. Server stamps `updated_at` automatically. Use after onboarding or when the user reports a bodyweight/1RM/goal/equipment change. Validation is strict — pass a complete UserProfile.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      profile: {
        type: 'object',
        description:
          'Complete UserProfile object (schema_version, display_name, age, height_cm, weight_kg, experience_level, goals, equipment, injuries, one_rep_max_kg, weight_unit_preference). updated_at is set by the server.',
      },
    },
    required: ['profile'],
    additionalProperties: false,
  },
  handler:
    (db: DB) =>
    async (args: unknown): Promise<ToolResult> => {
      const a = args as { profile?: unknown } | undefined;
      if (!a || typeof a.profile !== 'object' || a.profile === null) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'error: missing required field `profile`' }],
        };
      }
      const parsed = UserProfile.safeParse({
        ...(a.profile as Record<string, unknown>),
        updated_at: new Date().toISOString(),
      });
      if (!parsed.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `error: invalid profile — ${JSON.stringify(parsed.error.flatten())}`,
            },
          ],
        };
      }
      const saved = upsertProfile(db, parsed.data);
      eventBus.publish({ type: 'profile_updated', profile: saved });
      return { content: [{ type: 'text', text: 'ok' }] };
    },
};
