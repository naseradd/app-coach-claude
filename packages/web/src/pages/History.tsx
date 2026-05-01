import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, ChevronRight, Inbox } from 'lucide-react';
import { Badge, Card, ListGroup } from '../components/ui/index.js';
import { formatDayMonthFR, formatMonthYearFR, relativeDays } from '../utils/format.js';
import { useHistory } from '../store/history.store.js';
import { useSettings } from '../store/settings.store.js';
import type { SessionReport } from '@coach/shared';

function groupByMonth(reports: SessionReport[]): Map<string, SessionReport[]> {
  const sorted = [...reports].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  );
  const out = new Map<string, SessionReport[]>();
  for (const r of sorted) {
    const key = formatMonthYearFR(r.completed_at);
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(r);
  }
  return out;
}

export function History() {
  const navigate = useNavigate();
  const reports = useHistory((s) => s.reports);
  const loading = useHistory((s) => s.loading);
  const error = useHistory((s) => s.error);
  const serverUrl = useSettings((s) => s.serverUrl);
  const bearer = useSettings((s) => s.bearer);
  const isConfigured = Boolean(serverUrl && bearer);

  const today = useMemo(() => new Date(), []);
  const grouped = useMemo(() => groupByMonth(reports), [reports]);

  const totalVolume = reports.reduce((acc, r) => acc + r.volume_summary.total_volume_kg, 0);
  const totalReps = reports.reduce((acc, r) => acc + r.volume_summary.total_reps_done, 0);
  const totalPRs = reports.reduce(
    (acc, r) =>
      acc + r.exercises_log.reduce((a, e) => a + e.sets_log.filter((s) => s.is_pr).length, 0),
    0,
  );

  if (!isConfigured) {
    return (
      <Empty
        title="Connecte ton serveur"
        body="Les archives proviennent de ton serveur MCP. Configure-le pour les voir."
      />
    );
  }

  if (loading && reports.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="t-callout" style={{ color: 'var(--ink-3)' }}>
          Chargement…
        </div>
      </div>
    );
  }

  if (error && reports.length === 0) {
    return <Empty title="Connexion impossible" body={error} />;
  }

  if (reports.length === 0) {
    return (
      <Empty
        title="Pas encore d'archives"
        body="Tes séances apparaîtront ici dès la première terminée."
      />
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <header style={{ padding: '24px 20px 16px' }}>
        <h1 className="t-large" style={{ margin: 0, color: 'var(--ink)' }}>
          Archives
        </h1>
        <div className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
          {reports.length} séances · accessibles à Claude via MCP
        </div>
      </header>

      <div style={{ padding: '0 20px', display: 'grid', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <Card variant="surface" padding={14}>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              vol. total
            </div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>
              {Math.round(totalVolume / 1000)}t
            </div>
          </Card>
          <Card variant="surface" padding={14}>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              reps
            </div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>
              {totalReps}
            </div>
          </Card>
          <Card variant="surface" padding={14}>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              PRs
            </div>
            <div className="tabular" style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>
              {totalPRs}
            </div>
          </Card>
        </div>

        {Array.from(grouped.entries()).map(([monthLabel, items]) => (
          <div key={monthLabel}>
            <div
              className="t-subhead"
              style={{
                color: 'var(--ink-3)',
                textTransform: 'lowercase',
                padding: '0 4px 8px',
              }}
            >
              {monthLabel}
            </div>
            <ListGroup>
              {items.map((r, i) => {
                const cap = formatDayMonthFR(r.completed_at);
                const setsPlanned = r.volume_summary.total_sets_planned;
                const setsDone = r.volume_summary.total_sets_done;
                const pct = setsPlanned > 0 ? setsDone / setsPlanned : 0;
                const prCount = r.exercises_log.reduce(
                  (a, e) => a + e.sets_log.filter((s) => s.is_pr).length,
                  0,
                );
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.03 * i }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/history/${r.id}`)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 0,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--ink)',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'var(--bg-tinted)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          className="tabular"
                          style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}
                        >
                          {cap.day}
                        </div>
                        <div
                          className="t-caption"
                          style={{ color: 'var(--ink-3)', textTransform: 'lowercase', marginTop: 2 }}
                        >
                          {cap.month}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="t-headline" style={{ color: 'var(--ink)' }}>
                          {r.session_name}
                        </div>
                        <div
                          className="t-footnote tabular"
                          style={{ color: 'var(--ink-3)', marginTop: 2 }}
                        >
                          {relativeDays(r.completed_at, today)} · {r.duration_actual_minutes}min ·{' '}
                          {Math.round(r.volume_summary.total_volume_kg)}kg
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        {prCount > 0 ? (
                          <Badge variant="pr">
                            <Trophy size={12} />
                            {prCount}
                          </Badge>
                        ) : null}
                        <span
                          className="tabular"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: pct === 1 ? 'var(--success)' : 'var(--ink-3)',
                          }}
                        >
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                    </button>
                  </motion.div>
                );
              })}
            </ListGroup>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--accent)',
          marginBottom: 20,
        }}
      >
        <Inbox size={42} />
      </div>
      <h2 className="t-title-2" style={{ margin: 0, color: 'var(--ink)' }}>
        {title}
      </h2>
      <p className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 8, maxWidth: 280 }}>
        {body}
      </p>
    </div>
  );
}
