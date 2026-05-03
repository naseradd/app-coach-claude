import { create } from 'zustand';
import type { SessionReport } from '@coach/shared';
import { apiClient } from '../api/endpoints.js';
import { isApiConfigured } from '../api/client.js';

interface HistoryState {
  reports: SessionReport[];
  byId: Record<string, SessionReport>;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  fetchOne: (id: string) => Promise<SessionReport | null>;
  upsert: (r: SessionReport) => void;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useHistory = create<HistoryState>((set, get) => ({
  reports: [],
  byId: {},
  loading: false,
  error: null,
  fetch: async () => {
    if (!isApiConfigured()) {
      set({ reports: [], byId: {}, error: null, loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const reports = await apiClient.listSessions(100);
      const byId: Record<string, SessionReport> = {};
      for (const r of reports) byId[r.id] = r;
      set({ reports, byId, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'fetch_failed',
        loading: false,
      });
    }
  },
  fetchOne: async (id) => {
    const cached = get().byId[id];
    if (cached) return cached;
    if (!isApiConfigured()) return null;
    try {
      const r = await apiClient.getSession(id);
      set((s) => ({ byId: { ...s.byId, [r.id]: r } }));
      return r;
    } catch {
      return null;
    }
  },
  upsert: (r) =>
    set((s) => ({
      reports: [r, ...s.reports.filter((x) => x.id !== r.id)],
      byId: { ...s.byId, [r.id]: r },
    })),
  remove: async (id) => {
    if (!isApiConfigured()) return;
    await apiClient.deleteSession(id);
    set((s) => {
      const { [id]: _removed, ...byId } = s.byId;
      return {
        reports: s.reports.filter((r) => r.id !== id),
        byId,
      };
    });
  },
  reset: () => set({ reports: [], byId: {}, loading: false, error: null }),
}));
