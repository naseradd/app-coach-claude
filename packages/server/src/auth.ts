import type { MiddlewareHandler } from 'hono';
import { timingSafeEqual } from 'node:crypto';

export function bearerAuth(expectedToken: string): MiddlewareHandler {
  const expected = Buffer.from(expectedToken);
  return async (c, next) => {
    const header = c.req.header('Authorization') ?? '';
    if (!header.startsWith('Bearer ')) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    const got = Buffer.from(header.slice(7));
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    await next();
  };
}
