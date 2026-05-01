import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

export function staticRoute(rootDir: string) {
  const r = new Hono();
  r.use('/*', serveStatic({ root: rootDir, index: 'index.html' }));
  r.get('*', serveStatic({ root: rootDir, path: 'index.html' }));
  return r;
}
