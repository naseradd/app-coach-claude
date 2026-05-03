import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createHash, randomBytes } from 'node:crypto';
import { oauthRoute } from '../src/routes/oauth.js';
import { discoveryRoute } from '../src/routes/discovery.js';
import { _resetForTests, _setExpiryForTests } from '../src/oauth/store.js';

const TOKEN = 'a'.repeat(48); // synthetic; satisfies env min(32) requirement
const BASE = 'https://coach-claude.fly.dev';
const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';

function buildApp() {
  const app = new Hono();
  app.route('/', discoveryRoute(BASE));
  app.route('/', oauthRoute({ bearerToken: TOKEN }));
  return app;
}

function pkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

function authorizeUrl(challenge: string, state = 'xyz') {
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: 'claude-ai',
    redirect_uri: REDIRECT,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  return `/authorize?${q}`;
}

async function postAuthorize(app: Hono, body: Record<string, string>) {
  return app.request('/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
}

async function postToken(app: Hono, body: Record<string, string>) {
  return app.request('/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
}

async function fullAuthorize(
  app: Hono,
  challenge: string,
  state = 'xyz',
): Promise<string> {
  const res = await postAuthorize(app, {
    token: TOKEN,
    response_type: 'code',
    client_id: 'claude-ai',
    redirect_uri: REDIRECT,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  expect(res.status).toBe(302);
  const loc = res.headers.get('location')!;
  const url = new URL(loc);
  return url.searchParams.get('code')!;
}

describe('discovery', () => {
  beforeEach(() => _resetForTests());

  it('exposes oauth-authorization-server metadata', async () => {
    const app = buildApp();
    const res = await app.request('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.issuer).toBe(BASE);
    expect(body.authorization_endpoint).toBe(`${BASE}/authorize`);
    expect(body.token_endpoint).toBe(`${BASE}/token`);
    expect(body.code_challenge_methods_supported).toEqual(['S256']);
    expect(body.grant_types_supported).toContain('authorization_code');
  });

  it('exposes oauth-protected-resource metadata', async () => {
    const app = buildApp();
    const res = await app.request('/.well-known/oauth-protected-resource');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resource).toBe(`${BASE}/mcp`);
    expect(body.authorization_servers).toEqual([BASE]);
  });
});

describe('GET /authorize', () => {
  beforeEach(() => _resetForTests());

  it('renders an HTML form when all params are present', async () => {
    const app = buildApp();
    const { challenge } = pkcePair();
    const res = await app.request(authorizeUrl(challenge));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('<form method="POST"');
    expect(body).toContain('name="token"');
    expect(body).toContain(challenge); // hidden input echoes challenge
  });

  it('returns 400 when code_challenge is missing', async () => {
    const app = buildApp();
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: 'claude-ai',
      redirect_uri: REDIRECT,
      code_challenge_method: 'S256',
      state: 'xyz',
    });
    const res = await app.request(`/authorize?${q}`);
    expect(res.status).toBe(400);
  });

  it('rejects non-S256 code_challenge_method', async () => {
    const app = buildApp();
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: 'claude-ai',
      redirect_uri: REDIRECT,
      code_challenge: 'abc',
      code_challenge_method: 'plain',
      state: 'xyz',
    });
    const res = await app.request(`/authorize?${q}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /authorize', () => {
  beforeEach(() => _resetForTests());

  it('rejects wrong token with 401', async () => {
    const app = buildApp();
    const { challenge } = pkcePair();
    const res = await postAuthorize(app, {
      token: 'wrong-token',
      response_type: 'code',
      client_id: 'claude-ai',
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'xyz',
    });
    expect(res.status).toBe(401);
  });

  it('redirects with code+state when token is valid', async () => {
    const app = buildApp();
    const { challenge } = pkcePair();
    const res = await postAuthorize(app, {
      token: TOKEN,
      response_type: 'code',
      client_id: 'claude-ai',
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'state-abc',
    });
    expect(res.status).toBe(302);
    const loc = res.headers.get('location')!;
    expect(loc.startsWith(REDIRECT)).toBe(true);
    const url = new URL(loc);
    expect(url.searchParams.get('code')).toBeTruthy();
    expect(url.searchParams.get('state')).toBe('state-abc');
  });
});

describe('POST /token', () => {
  beforeEach(() => _resetForTests());

  it('happy path: exchanges code+verifier for the bearer token', async () => {
    const app = buildApp();
    const { verifier, challenge } = pkcePair();
    const code = await fullAuthorize(app, challenge);

    const res = await postToken(app, {
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBe(TOKEN);
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBeGreaterThan(0);
  });

  it('rejects wrong code_verifier with invalid_grant', async () => {
    const app = buildApp();
    const { challenge } = pkcePair();
    const code = await fullAuthorize(app, challenge);

    const wrongVerifier = randomBytes(32).toString('base64url');
    const res = await postToken(app, {
      grant_type: 'authorization_code',
      code,
      code_verifier: wrongVerifier,
      redirect_uri: REDIRECT,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_grant');
  });

  it('rejects reused code on second exchange', async () => {
    const app = buildApp();
    const { verifier, challenge } = pkcePair();
    const code = await fullAuthorize(app, challenge);

    const ok = await postToken(app, {
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
    });
    expect(ok.status).toBe(200);

    const replay = await postToken(app, {
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
    });
    expect(replay.status).toBe(400);
    const body = await replay.json();
    expect(body.error).toBe('invalid_grant');
  });

  it('rejects expired code', async () => {
    const app = buildApp();
    const { verifier, challenge } = pkcePair();
    const code = await fullAuthorize(app, challenge);

    // Force expiry into the past via test-only helper.
    _setExpiryForTests(code, Date.now() - 1000);

    const res = await postToken(app, {
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_grant');
  });

  it('rejects unsupported grant_type', async () => {
    const app = buildApp();
    const res = await postToken(app, {
      grant_type: 'client_credentials',
      code: 'whatever',
      code_verifier: 'whatever',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('unsupported_grant_type');
  });

  it('rejects redirect_uri mismatch', async () => {
    const app = buildApp();
    const { verifier, challenge } = pkcePair();
    const code = await fullAuthorize(app, challenge);

    const res = await postToken(app, {
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: 'https://evil.example.com/callback',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_grant');
  });
});
