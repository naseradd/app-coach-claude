import { Hono } from 'hono';
import { cors } from 'hono/cors';

/**
 * OAuth 2.0 + MCP discovery endpoints (RFC 8414 + MCP spec 2025-03-26).
 *
 * Claude.ai's MCP connector hits these to learn the auth flow. The protected-
 * resource endpoint signals that /mcp is the OAuth resource and points back to
 * this server as the authorization server.
 */
export function discoveryRoute(baseUrl: string) {
  const r = new Hono();

  // CORS: discovery is browser-readable from Claude.ai's connector wizard.
  r.use(
    '*',
    cors({
      origin: (origin) => origin || '*',
      allowMethods: ['GET', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),
  );

  r.get('/.well-known/oauth-authorization-server', (c) =>
    c.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      // Public client: PKCE replaces client secret. RFC 7636 §4.4.
      token_endpoint_auth_methods_supported: ['none'],
    }),
  );

  r.get('/.well-known/oauth-protected-resource', (c) =>
    c.json({
      resource: `${baseUrl}/mcp`,
      authorization_servers: [baseUrl],
      bearer_methods_supported: ['header'],
    }),
  );

  // MCP-spec alternative path some connectors probe.
  r.get('/.well-known/oauth-protected-resource/mcp', (c) =>
    c.json({
      resource: `${baseUrl}/mcp`,
      authorization_servers: [baseUrl],
      bearer_methods_supported: ['header'],
    }),
  );

  return r;
}
