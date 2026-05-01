/**
 * Lightweight fetch wrapper that injects the Bearer token from a module-level
 * config singleton. Intentionally not a hook: stores can call it from
 * actions without React context plumbing.
 */
export interface ApiConfig {
  baseUrl: string;
  bearer: string;
}

let config: ApiConfig = { baseUrl: '', bearer: '' };

export function setApiConfig(c: ApiConfig): void {
  // Normalize trailing slash so callers can pass `https://x/` or `https://x`.
  config = { baseUrl: c.baseUrl.replace(/\/+$/, ''), bearer: c.bearer };
}

export function getApiConfig(): ApiConfig {
  return config;
}

export function isApiConfigured(): boolean {
  return Boolean(config.baseUrl && config.bearer);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError(0, 'api_not_configured', {
      hint: 'Set serverUrl + bearer in Settings',
    });
  }
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.bearer}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, `api_${res.status}`, body);
  }
  if (res.status === 204) return undefined as T;
  // Some responses may legitimately be `null` (e.g. GET /api/profile when empty).
  return (await res.json()) as T;
}
