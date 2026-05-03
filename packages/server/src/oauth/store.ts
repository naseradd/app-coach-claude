import { randomBytes } from 'node:crypto';

/**
 * In-memory store for OAuth 2.0 authorization codes.
 *
 * Why in-memory: this server is single-instance (Fly.io machine with persistent
 * volume for SQLite, but the OAuth code is short-lived and pre-token-issuance,
 * so persisting it across restarts is unnecessary). Codes have a 5-minute TTL
 * and are single-use, per RFC 6749 §4.1.2.
 */

export interface AuthCode {
  challenge: string;
  challenge_method: 'S256';
  redirect_uri: string;
  expires_at: number;
  used: boolean;
}

const codes = new Map<string, AuthCode>();
const TTL_MS = 5 * 60 * 1000;

export function generateAuthCode(): string {
  // 32 random bytes → base64url (~43 chars). Plenty of entropy, RFC 6749 §10.10.
  return randomBytes(32).toString('base64url');
}

export function storeAuthCode(
  code: string,
  data: Omit<AuthCode, 'expires_at' | 'used'>,
): void {
  codes.set(code, { ...data, expires_at: Date.now() + TTL_MS, used: false });
  pruneExpired();
}

export function consumeAuthCode(code: string): AuthCode | null {
  const entry = codes.get(code);
  if (!entry) return null;
  if (entry.used) return null;
  if (Date.now() > entry.expires_at) {
    codes.delete(code);
    return null;
  }
  entry.used = true;
  // Keep the entry briefly so a replay attempt sees `used=true` and is rejected.
  // pruneExpired() on the next store() call cleans it up.
  return entry;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [k, v] of codes.entries()) {
    if (now > v.expires_at || v.used) codes.delete(k);
  }
}

/** Test-only helpers. */
export function _resetForTests(): void {
  codes.clear();
}

export function _getRawForTests(code: string): AuthCode | undefined {
  return codes.get(code);
}

export function _setExpiryForTests(code: string, expiresAt: number): void {
  const entry = codes.get(code);
  if (entry) entry.expires_at = expiresAt;
}
