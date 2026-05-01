import { WorkoutProgram } from '@coach/shared';
import type { DB } from '../../db/connection.js';
import { pushProgram as pushProgramRepo } from '../../db/repo/program.repo.js';
import { eventBus } from '../../events/bus.js';

type ToolResult =
  | { content: { type: 'text'; text: string }[] }
  | { isError: true; content: { type: 'text'; text: string }[] };

export const pushProgram = {
  name: 'push_program',
  description:
    "Validate and store a new active workout program. The program object must include schema_version: \"1.0.0\". The previous active program is archived automatically. Pass a fully-formed program JSON — the same format the PWA imports. Returns { id, imported_at }.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      program: {
        type: 'object',
        description:
          'Complete WorkoutProgram object: { schema_version: "1.0.0", program: {...meta}, sessions: [...] }.',
      },
    },
    required: ['program'],
    additionalProperties: false,
  },
  handler:
    (db: DB) =>
    async (args: unknown): Promise<ToolResult> => {
      const a = args as { program?: unknown } | undefined;
      if (!a || typeof a.program !== 'object' || a.program === null) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'error: missing required field `program`' }],
        };
      }
      const parsed = WorkoutProgram.safeParse(a.program);
      if (!parsed.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `error: invalid program — ${JSON.stringify(parsed.error.flatten())}`,
            },
          ],
        };
      }
      const result = pushProgramRepo(db, parsed.data);
      eventBus.publish({ type: 'program_received', program: parsed.data });
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
};
