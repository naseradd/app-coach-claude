import { Hono } from 'hono';
import { html } from 'hono/html';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  generateAuthCode,
  storeAuthCode,
  consumeAuthCode,
} from '../oauth/store.js';

interface OauthDeps {
  bearerToken: string;
}

/**
 * OAuth 2.0 Authorization Code + PKCE flow for Claude.ai's MCP connector.
 *
 * The MCP spec 2025-03-26 §authorization requires OAuth, but this server is
 * single-user. The auth flow proves ownership: the user pastes the bearer token
 * (the same value Claude will use against /mcp) into a form. PKCE is mandatory
 * per the spec — we enforce S256 only.
 *
 * The issued access_token is the env BEARER_TOKEN itself. YAGNI: minting per-
 * grant tokens would require a token store + mapping, but Claude.ai uses it
 * exactly the same way (Authorization: Bearer <token>) against /mcp.
 */
export function oauthRoute(deps: OauthDeps) {
  const r = new Hono();
  const expectedToken = Buffer.from(deps.bearerToken);

  // GET /authorize → render HTML form for the user to paste their bearer token.
  r.get('/authorize', (c) => {
    const params = c.req.query();
    const required = [
      'response_type',
      'client_id',
      'redirect_uri',
      'code_challenge',
      'code_challenge_method',
      'state',
    ];
    for (const p of required) {
      if (!params[p]) return c.text(`missing query param: ${p}`, 400);
    }
    if (params.response_type !== 'code') {
      return c.text('only response_type=code supported', 400);
    }
    if (params.code_challenge_method !== 'S256') {
      return c.text('only PKCE S256 supported', 400);
    }

    const redirectUri = params.redirect_uri!;

    return c.html(html`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Coach Claude — Autoriser</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
         background: #F4F1EC; color: #1C1B1F; margin: 0; padding: 0;
         min-height: 100vh; display: grid; place-items: center; }
  .card { background: #FAF7F2; border-radius: 18px; padding: 28px; max-width: 400px; width: 100%;
          box-shadow: 0 4px 14px rgba(28,27,31,0.06); }
  h1 { font-size: 22px; margin: 0 0 8px; font-weight: 600; }
  p { color: #6F6B62; font-size: 14px; line-height: 1.4; margin: 0 0 16px; }
  input[type=password] { width: 100%; padding: 12px 14px; font-size: 16px; border: 1px solid rgba(60,60,67,0.14);
                          border-radius: 14px; background: #fff; box-sizing: border-box; font-family: monospace; }
  input[type=password]:focus { outline: 2px solid #C8553D; outline-offset: 1px; border-color: transparent; }
  button { width: 100%; margin-top: 12px; padding: 14px; font-size: 17px; font-weight: 600;
           background: #C8553D; color: #FAF7F2; border: 0; border-radius: 14px; cursor: pointer; }
  button:active { opacity: 0.85; }
  .err { color: #C73E1D; font-size: 13px; margin: 8px 0 0; }
  .meta { font-size: 11px; color: #A39E92; margin-top: 16px; word-break: break-all; }
</style></head>
<body>
<div class="card">
  <h1>Autoriser Claude.ai</h1>
  <p>Claude.ai veut se connecter à ton serveur Coach. Colle ton bearer token pour autoriser.</p>
  <form method="POST" action="/authorize">
    <input type="password" name="token" autocomplete="off" placeholder="Bearer token" required />
    <input type="hidden" name="response_type" value="${params.response_type}" />
    <input type="hidden" name="client_id" value="${params.client_id}" />
    <input type="hidden" name="redirect_uri" value="${params.redirect_uri}" />
    <input type="hidden" name="code_challenge" value="${params.code_challenge}" />
    <input type="hidden" name="code_challenge_method" value="${params.code_challenge_method}" />
    <input type="hidden" name="state" value="${params.state}" />
    <button type="submit">Autoriser</button>
  </form>
  <p class="meta">Redirection: ${redirectUri}</p>
</div>
</body></html>`);
  });

  // POST /authorize → validate token, mint single-use auth code, 302 redirect.
  r.post('/authorize', async (c) => {
    const form = await c.req.parseBody();
    const token = String(form.token ?? '');
    const got = Buffer.from(token);
    const valid =
      got.length === expectedToken.length && timingSafeEqual(got, expectedToken);
    if (!valid) {
      return c.text('Token invalide.', 401);
    }

    const code = generateAuthCode();
    storeAuthCode(code, {
      challenge: String(form.code_challenge ?? ''),
      challenge_method: 'S256',
      redirect_uri: String(form.redirect_uri ?? ''),
    });

    const url = new URL(String(form.redirect_uri));
    url.searchParams.set('code', code);
    url.searchParams.set('state', String(form.state ?? ''));
    return c.redirect(url.toString(), 302);
  });

  // POST /token → exchange code + PKCE verifier for access_token.
  // Accepts both application/x-www-form-urlencoded (RFC 6749 default) and JSON.
  r.post('/token', async (c) => {
    let body: Record<string, string> = {};
    const ct = c.req.header('content-type') ?? '';
    if (
      ct.includes('application/x-www-form-urlencoded') ||
      ct.includes('multipart/form-data')
    ) {
      const form = await c.req.parseBody();
      for (const [k, v] of Object.entries(form)) body[k] = String(v);
    } else if (ct.includes('application/json')) {
      body = (await c.req.json()) as Record<string, string>;
    } else {
      return c.json(
        { error: 'invalid_request', error_description: 'unsupported content-type' },
        400,
      );
    }

    if (body.grant_type !== 'authorization_code') {
      return c.json({ error: 'unsupported_grant_type' }, 400);
    }
    if (!body.code || !body.code_verifier) {
      return c.json(
        { error: 'invalid_request', error_description: 'missing code or code_verifier' },
        400,
      );
    }

    const stored = consumeAuthCode(body.code);
    if (!stored) {
      return c.json(
        { error: 'invalid_grant', error_description: 'code unknown, expired, or used' },
        400,
      );
    }
    if (body.redirect_uri && body.redirect_uri !== stored.redirect_uri) {
      return c.json(
        { error: 'invalid_grant', error_description: 'redirect_uri mismatch' },
        400,
      );
    }

    // PKCE: base64url(sha256(code_verifier)) must equal stored.challenge.
    const computed = createHash('sha256').update(body.code_verifier).digest('base64url');
    if (computed !== stored.challenge) {
      return c.json(
        { error: 'invalid_grant', error_description: 'PKCE verification failed' },
        400,
      );
    }

    return c.json({
      access_token: deps.bearerToken,
      token_type: 'Bearer',
      expires_in: 31536000, // 1 year
    });
  });

  return r;
}
