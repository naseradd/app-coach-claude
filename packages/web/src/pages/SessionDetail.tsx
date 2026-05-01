import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Quote, Video, Play, ChevronRight } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  IconButton,
  ListGroup,
  ListRow,
  NavBar,
  Sheet,
} from '../components/ui/index.js';
import { mockProgram } from '../mocks/index.js';
import type { Exercise } from '@coach/shared';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useMemo(() => mockProgram.sessions.find((s) => s.id === id), [id]);
  const [openExercise, setOpenExercise] = useState<Exercise | null>(null);

  if (!session) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <NavBar title="" onBack={() => navigate('/')} />
        <p className="t-body" style={{ color: 'var(--ink-3)' }}>
          Séance introuvable
        </p>
      </div>
    );
  }

  const exercises = session.blocks.flatMap((b) => b.exercises);
  const totalSets = exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const coachNote = session.blocks.find((b) => b.notes)?.notes ?? '';

  return (
    <div style={{ paddingBottom: 120 }}>
      <NavBar title={session.name} onBack={() => navigate('/')} />

      {/* Hero mesh */}
      <div
        style={{
          margin: '0 20px',
          padding: 24,
          borderRadius: 22,
          background:
            'radial-gradient(120% 90% at 0% 0%, var(--accent-soft), transparent 60%), var(--bg-surface)',
        }}
      >
        <Badge variant="accent">{mockProgram.program.name}</Badge>
        <h1 className="t-title-1" style={{ margin: '12px 0 8px', color: 'var(--ink)' }}>
          {session.name}
        </h1>
        <div className="t-callout tabular" style={{ color: 'var(--ink-2)' }}>
          {session.estimated_duration_minutes}min · {exercises.length} exos · {totalSets} sets
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {session.tags.map((t) => (
            <Badge key={t} variant="neutral">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px', display: 'grid', gap: 20 }}>
        {/* Coach note */}
        {coachNote ? (
          <Card variant="tinted" padding={16}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Quote size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
              <p className="t-callout" style={{ margin: 0, color: 'var(--ink-2)' }}>
                {coachNote}
              </p>
            </div>
          </Card>
        ) : null}

        {/* Exercises list */}
        <div>
          <div
            className="t-subhead"
            style={{
              color: 'var(--ink-3)',
              textTransform: 'lowercase',
              padding: '0 4px 8px',
            }}
          >
            exercices
          </div>
          <ListGroup>
            {exercises.map((ex, i) => {
              const heaviest = Math.max(...ex.sets.map((s) => s.weight_kg ?? 0));
              const muscles = ex.muscle_groups_primary.slice(0, 3).join(', ');
              return (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.03 * i, ease: 'easeOut' }}
                >
                  <ListRow
                    label={ex.name}
                    subtitle={
                      <span className="tabular">
                        {ex.sets.length} sets · {muscles}
                        {heaviest > 0 ? ` · top ${heaviest}kg` : ''}
                      </span>
                    }
                    trailing={
                      ex.video_url ? (
                        <IconButton
                          ariaLabel={`Vidéo de ${ex.name}`}
                          onClick={(e?: any) => {
                            e?.stopPropagation?.();
                            setOpenExercise(ex);
                          }}
                        >
                          <Video size={16} />
                        </IconButton>
                      ) : null
                    }
                    showChevron
                    onClick={() => setOpenExercise(ex)}
                  />
                </motion.div>
              );
            })}
          </ListGroup>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 430,
          margin: '0 auto',
          padding: '12px 20px calc(env(safe-area-inset-bottom) + 16px)',
          background: 'var(--material-thick)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid var(--separator)',
          zIndex: 50,
        }}
      >
        <Button
          variant="primary"
          size="xl"
          fullWidth
          leadingIcon={<Play size={18} fill="currentColor" />}
          onClick={() => navigate(`/workout?session=${session.id}`)}
        >
          Démarrer la séance
        </Button>
      </div>

      {/* Exercise detail sheet */}
      <Sheet open={!!openExercise} onClose={() => setOpenExercise(null)} detent="large">
        {openExercise ? <ExerciseSheetBody exercise={openExercise} /> : null}
      </Sheet>
    </div>
  );
}

function ExerciseSheetBody({ exercise }: { exercise: Exercise }) {
  return (
    <div style={{ display: 'grid', gap: 16, paddingBottom: 24 }}>
      {exercise.video_url ? (
        <div
          style={{
            aspectRatio: '16 / 9',
            background: 'var(--bg-tinted)',
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--ink-3)',
          }}
        >
          <Play size={42} fill="currentColor" />
        </div>
      ) : null}

      <div>
        <h2 className="t-title-2" style={{ margin: 0, color: 'var(--ink)' }}>
          {exercise.name}
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {exercise.muscle_groups_primary.map((m) => (
            <Badge key={m} variant="accent">
              {m}
            </Badge>
          ))}
          {exercise.muscle_groups_secondary.map((m) => (
            <Badge key={m} variant="neutral">
              {m}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>
          Plan de sets
        </div>
        <Card variant="tinted" padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--ink-3)' }}>
                {['Set', 'Reps', 'Poids', 'RPE', 'Repos'].map((h) => (
                  <th
                    key={h}
                    className="t-caption"
                    style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map((s, i) => (
                <motion.tr
                  key={s.set_number}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: 0.04 * i }}
                  style={{ borderTop: '1px solid var(--separator)' }}
                >
                  <td className="t-footnote tabular" style={{ padding: '10px 12px' }}>
                    {s.set_number}
                    {s.type === 'warmup' ? <span style={{ color: 'var(--ink-4)' }}> w</span> : null}
                  </td>
                  <td className="t-footnote tabular" style={{ padding: '10px 12px' }}>
                    {s.reps ?? (s.reps_min ? `${s.reps_min}+` : '—')}
                  </td>
                  <td className="t-footnote tabular" style={{ padding: '10px 12px' }}>
                    {s.weight_kg ? `${s.weight_kg}${s.weight_unit}` : '—'}
                  </td>
                  <td className="t-footnote tabular" style={{ padding: '10px 12px' }}>
                    {s.rpe_target ?? '—'}
                  </td>
                  <td className="t-footnote tabular" style={{ padding: '10px 12px' }}>
                    {s.rest_seconds}s
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {exercise.coaching_cues.length > 0 ? (
        <Card variant="tinted" padding={16}>
          <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>
            Cues techniques
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {exercise.coaching_cues.map((c, i) => (
              <li key={i} className="t-callout" style={{ color: 'var(--ink-2)' }}>
                {c}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {exercise.alternatives.length > 0 ? (
        <div>
          <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>
            Alternatives
          </div>
          <ListGroup>
            {exercise.alternatives.map((alt, i) => (
              <ListRow
                key={`${alt.name}-${i}`}
                label={alt.name}
                subtitle={alt.reason}
                trailing={<ChevronRight size={18} style={{ color: 'var(--ink-4)' }} />}
              />
            ))}
          </ListGroup>
        </div>
      ) : null}

      {exercise.progression_note ? (
        <Card variant="tinted" padding={14}>
          <div
            className="t-caption"
            style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}
          >
            Progression
          </div>
          <div className="t-callout" style={{ color: 'var(--ink-2)' }}>
            {exercise.progression_note}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
