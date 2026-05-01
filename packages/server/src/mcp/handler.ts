import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { DB } from '../db/connection.js';
import { readProfile } from './tools/readProfile.js';
import { updateProfile } from './tools/updateProfile.js';
import { readActiveProgram } from './tools/readActiveProgram.js';
import { pushProgram } from './tools/pushProgram.js';
import { readHistory } from './tools/readHistory.js';
import { readAggregateStats } from './tools/readAggregateStats.js';

type McpToolResult =
  | { content: { type: 'text'; text: string }[] }
  | { isError: true; content: { type: 'text'; text: string }[] };

type McpTool = {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; [k: string]: unknown };
  handler: (db: DB) => (args: unknown) => Promise<McpToolResult>;
};

export const TOOLS: readonly McpTool[] = [
  readProfile,
  updateProfile,
  readActiveProgram,
  pushProgram,
  readHistory,
  readAggregateStats,
] as const;

const SERVER_INFO = { name: 'coach-claude-mcp', version: '1.0.0' } as const;

/**
 * Build a configured MCP Server instance bound to the given DB.
 * One server per request (stateless mode) — keeps things simple and avoids
 * cross-request state corruption.
 */
export function buildMcpServer(db: DB): Server {
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: {} },
  });

  const byName = new Map(TOOLS.map((t) => [t.name, t.handler(db)]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const fn = byName.get(name);
    if (!fn) {
      return {
        isError: true,
        content: [{ type: 'text', text: `error: unknown tool "${name}"` }],
      };
    }
    try {
      return await fn(args ?? {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: `error: tool "${name}" failed — ${msg}` }],
      };
    }
  });

  return server;
}

/**
 * Mount handler for the /mcp endpoint. Stateless: a fresh transport + server
 * is created per request. Returns the standard Web Response, which Hono can
 * pass straight through.
 */
export async function mountMcp(req: Request, db: DB): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    // Stateless mode: no session id generator, sessionIdGenerator is undefined.
    // Claude.ai's HTTP MCP integration treats each request independently.
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = buildMcpServer(db);
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // Best-effort cleanup; in stateless mode there's no long-lived state to leak.
    void server.close().catch(() => {});
  }
}
