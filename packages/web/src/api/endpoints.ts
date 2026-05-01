import type { WorkoutProgram, SessionReport, UserProfile } from '@coach/shared';
import { api } from './client.js';

/**
 * Typed REST surface — single source of truth for routes.
 * Pages and stores never call `fetch` directly.
 */
export const apiClient = {
  health: () => api<{ ok: true; ts: string }>('/health'),
  getProfile: () => api<UserProfile | null>('/api/profile'),
  putProfile: (p: UserProfile) =>
    api<UserProfile>('/api/profile', { method: 'PUT', body: JSON.stringify(p) }),
  getActiveProgram: () => api<WorkoutProgram | null>('/api/program'),
  listSessions: (limit = 50) =>
    api<SessionReport[]>(`/api/sessions?limit=${limit}`),
  getSession: (id: string) => api<SessionReport>(`/api/sessions/${id}`),
  postSession: (r: SessionReport) =>
    api<SessionReport>('/api/sessions', { method: 'POST', body: JSON.stringify(r) }),
  setupStatus: () =>
    api<{ complete: boolean; missing: string[] }>('/api/setup-status'),
  wipe: () => api<{ ok: true }>('/api/data', { method: 'DELETE' }),
};
