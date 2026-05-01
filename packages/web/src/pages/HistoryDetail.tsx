import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import type { SessionReport } from '@coach/shared';
import { Badge, Card, NavBar } from '../components/ui/index.js';
import { useHistory } from '../store/history.store.js';

export function HistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchOne = useHistory((s) => s.fetchOne);
  const cached = useHistory((s) => (id ? s.byId[id] : undefined));

  const [report, setReport] = useState<SessionReport | null | undefined>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!id) return;
    if (cached) {
      setReport(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchOne(id).then((r) => {
      if (cancelled) return;
      setReport(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, cached, fetchOne]);

  if (loading) {
    return (
      <div>
        <NavBar title="Archive" onBack={() => navigate('/history')} />
        <p className="t-body" style={{ padding: 32, color: 'var(--ink-3)' }}>
          Chargement…
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <NavBar title="Archive" onBack={() => navigate('/history')} />
        <p className="t-body" style={{ padding: 32, color: 'var(--ink-3)' }}>
          Rapport introuvable.
        </p>
      </div>
    );
  }

  const dt = new Date(report.completed_at);
  const datetime = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dt);

  const completionPct = Math.round(report.completion_rate * 100);
  const setsLine = `${report.volume_summary.total_sets_done}/${report.volume_summary.total_sets_planned}`;

  return (
    <div style={{ paddingBottom: 24 }}>
      <NavBar title={report.session_name} subtitle={datetime} onBack={() => navigate('/history')} />

      <div style={{ padding: '8px 20px', display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatTile label="Durée" value={`${report.duration_actual_minutes}min`} />
          <StatTile label="Volume" value={`${Math.round(report.volume_summary.total_volume_kg)}kg`} />
          <StatTile label="Sets" value={setsLine} />
          <StatTile label="Complétion" value={`${completionPct}%`} />
        </div>

        {report.post_session.notes ? (
          <Card variant="tinted" padding={16}>
            <div
              className="t-caption"
              style={{
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              Notes post-séance
            </div>
            <div className="t-callout" style={{ color: 'var(--ink-2)' }}>
              {report.post_session.notes}
            </div>
          </Card>
        ) : null}

        {report.pre_session.notes ? (
          <Card variant="surface" padding={16}>
            <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>
              Avant la séance
            </div>
            <div
              className="t-footnote tabular"
              style={{ color: 'var(--ink-2)', display: 'flex', gap: 12, marginBottom: 6 }}
            >
              <span>énergie · {report.pre_session.energy_level ?? '—'}</span>
              <span>sommeil · {report.pre_session.sleep_quality ?? '—'}</span>
              <span>courbatures · {report.pre_session.soreness_level ?? '—'}</span>
            </div>
            <div className="t-callout" style={{ color: 'var(--ink-2)' }}>
              {report.pre_session.notes}
            </div>
          </Card>
        ) : null}

        {report.exercises_log.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              className="t-subhead"
              style={{ color: 'var(--ink-3)', textTransform: 'lowercase', padding: '0 4px' }}
            >
              exercices
            </div>
            {report.exercises_log.map((ex) => {
              const allDone = ex.completed && !ex.skipped;
              const partial =
                !ex.skipped && ex.sets_log.filter((s) => s.completed).length < ex.sets_log.length;
              const variant = ex.skipped ? 'danger' : partial ? 'warn' : 'success';
              const label = ex.skipped ? 'Skip' : partial ? 'Partiel' : 'OK';
              const hasPR = ex.sets_log.some((s) => s.is_pr);
              return (
                <Card key={ex.exercise_id} variant="surface" padding={14}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 className="t-headline" style={{ margin: 0, color: 'var(--ink)', flex: 1 }}>
                      {ex.exercise_name}
                    </h3>
                    {hasPR ? <Trophy size={16} style={{ color: 'var(--accent)' }} /> : null}
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                  {ex.sets_log.length > 0 ? (
                    <table style={{ width: '100%', marginTop: 10, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--ink-3)' }}>
                          {['Set', 'Reps', 'Poids', 'RPE', ''].map((h, i) => (
                            <th
                              key={i}
                              className="t-caption"
                              style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets_log.map((s) => (
                          <tr key={s.set_number} style={{ borderTop: '1px solid var(--separator)' }}>
                            <td className="t-footnote tabular" style={{ padding: '8px 0' }}>
                              {s.set_number}
                            </td>
                            <td className="t-footnote tabular" style={{ padding: '8px 0' }}>
                              {s.actual_reps ?? '—'}
                              <span style={{ color: 'var(--ink-4)' }}>/{s.planned_reps ?? '—'}</span>
                            </td>
                            <td className="t-footnote tabular" style={{ padding: '8px 0' }}>
                              {s.actual_weight_kg ?? '—'}
                              <span style={{ color: 'var(--ink-4)' }}>
                                /{s.planned_weight_kg ?? '—'}
                              </span>
                            </td>
                            <td className="t-footnote tabular" style={{ padding: '8px 0' }}>
                              {s.rpe_actual ?? '—'}
                            </td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>
                              {s.is_pr ? <Trophy size={14} style={{ color: 'var(--accent)' }} /> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                  {!allDone && ex.notes ? (
                    <div className="t-footnote" style={{ color: 'var(--ink-3)', marginTop: 8 }}>
                      {ex.notes}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card variant="tinted" padding={14}>
            <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
              Détail set-par-set indisponible pour cette séance archivée.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="surface" padding={14}>
      <div className="t-footnote" style={{ color: 'var(--ink-3)' }}>
        {label}
      </div>
      <div className="tabular" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, marginTop: 6 }}>
        {value}
      </div>
    </Card>
  );
}
