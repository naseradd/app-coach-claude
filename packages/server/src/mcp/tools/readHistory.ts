import type { DB } from '../../db/connection.js';
import { listReports } from '../../db/repo/session.repo.js';

type ToolResult =
  | { content: { type: 'text'; text: string }[] }
  | { isError: true; content: { type: 'text'; text: string }[] };

const MAX_LIMIT = 200;

export const readHistory = {
  name: 'read_history',
  description:
    'List session reports (newest first). Returns full SessionReport objects so you can analyse perceived difficulty, completion rates, RPE deltas, etc. Use limit/offset for pagination.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: MAX_LIMIT,
        default: 30,
        description: `Max number of reports to return (1-${MAX_LIMIT}, default 30).`,
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Number of reports to skip (default 0).',
      },
    },
    additionalProperties: false,
  },
  handler:
    (db: DB) =>
    async (args: unknown): Promise<ToolResult> => {
      const a = (args ?? {}) as { limit?: unknown; offset?: unknown };
      const limit = a.limit === undefined ? 30 : Number(a.limit);
      const offset = a.offset === undefined ? 0 : Number(a.offset);
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `error: limit must be an integer in [1, ${MAX_LIMIT}]`,
            },
          ],
        };
      }
      if (!Number.isInteger(offset) || offset < 0) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'error: offset must be a non-negative integer' }],
        };
      }
      const reports = listReports(db, limit, offset);
      return { content: [{ type: 'text', text: JSON.stringify(reports) }] };
    },
};
