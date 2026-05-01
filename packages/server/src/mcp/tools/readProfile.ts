import type { DB } from '../../db/connection.js';
import { getProfile } from '../../db/repo/profile.repo.js';

export const readProfile = {
  name: 'read_profile',
  description:
    "Read the current user's fitness profile (display_name, age, weight_kg, experience_level, goals, equipment, injuries, 1RMs, etc). Returns null if no profile exists yet.",
  inputSchema: {
    type: 'object' as const,
    properties: {},
    additionalProperties: false,
  },
  handler:
    (db: DB) =>
    async (_args: unknown): Promise<{ content: { type: 'text'; text: string }[] }> => {
      const profile = getProfile(db);
      return {
        content: [{ type: 'text', text: JSON.stringify(profile ?? null) }],
      };
    },
};
