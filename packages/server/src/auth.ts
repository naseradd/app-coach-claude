import type { MiddlewareHandler } from 'hono';
import { timingSafeEqual } from 'node:crypto';

/**
 * Bearer auth middleware. Accepts the token via:
 *   1. `Authorization: Bearer <token>` header (preferred)
 *   2. `?token=<token>` query parameter (fallback for browser EventSource,
 *      which can't send custom headers).
 *
 * Both paths use timing-safe comparison.
 */
export function bearerAuth(expectedToken: string): MiddlewareHandler {
  const expected = Buffer.from(expectedToken);
  const reject = (c: Parameters<MiddlewareHandler>[0]) =>
    c.json({ error: 'unauthorized' }, 401);

  const safeEqual = (raw: string): boolean => {
    const got = Buffer.from(raw);
    return got.length === expected.length && timingSafeEqual(got, expected);
  };

  return async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    if (header.startsWith('Bearer ') && safeEqual(header.slice(7))) {
      await next();
      return;
    }
    const queryToken = c.req.query('token');
    if (queryToken && safeEqual(queryToken)) {
      await next();
      return;
    }
    return reject(c);
  };
}
