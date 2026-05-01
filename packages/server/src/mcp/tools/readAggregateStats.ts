import type { DB } from '../../db/connection.js';
import { aggregateStats } from '../../db/repo/stats.repo.js';

export const readAggregateStats = {
  name: 'read_aggregate_stats',
  description:
    'Read aggregate training stats: weeks_active, sessions_total, avg_completion, total_volume_kg, total_prs, recent_strength. Cheap pre-flight check before pulling full history.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    additionalProperties: false,
  },
  handler:
    (db: DB) =>
    async (_args: unknown): Promise<{ content: { type: 'text'; text: string }[] }> => {
      const stats = aggregateStats(db);
      return { content: [{ type: 'text', text: JSON.stringify(stats) }] };
    },
};
