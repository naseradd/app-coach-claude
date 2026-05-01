import type { DB } from '../../db/connection.js';
import { getActiveProgram } from '../../db/repo/program.repo.js';

export const readActiveProgram = {
  name: 'read_active_program',
  description:
    'Read the currently active WorkoutProgram (schema_version, program metadata, sessions[]). Returns null if no program has been pushed yet.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    additionalProperties: false,
  },
  handler:
    (db: DB) =>
    async (_args: unknown): Promise<{ content: { type: 'text'; text: string }[] }> => {
      const program = getActiveProgram(db);
      return {
        content: [{ type: 'text', text: JSON.stringify(program ?? null) }],
      };
    },
};
