import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Send, Check } from 'lucide-react';
import { Button, Card, ListGroup, ListRow, ProgressBar } from '../components/ui/index.js';
import type { Exercise, SessionDef } from '@coach/shared';

interface ExerciseProgress {
  exercise: Exercise;
  setsDone: number;
  setsTotal: number;
}

interface Props {
  session: SessionDef;
  exerciseProgress: ExerciseProgress[];
  durationMinutes: number;
  totalVolumeKg: number;
  totalSetsDone: number;
  totalRepsDone: number;
  prCount: number;
  onSubmit?: () => void;
  onBack?: () => void;
}

const FEELINGS = ['😩', '😕', '😐', '🙂', '🤩'] as const;

export function PostSession({
  session,
  exerciseProgress,
  durationMinutes,
  totalVolumeKg,
  totalSetsDone,
  totalRepsDone,
  prCount,
  onSubmit,
  onBack,
}: Props) {
  const navigate = useNavigate();
  const [feeling, setFeeling] = useState<number | null>(3);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalSetsPlanned = exerciseProgress.reduce((acc, e) => acc + e.setsTotal, 0);
  const completionRate = totalSetsPlanned > 0 ? totalSetsDone / totalSetsPlanned : 0;

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.();
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          maxWidth: 430,
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24, delay: 0.05 }}
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--bg-elev)',
          }}
        >
          <Check size={48} strokeWidth={2.4} />
        </motion.div>
        <h1 className="t-large" style={{ marginTop: 32, color: 'var(--ink)' }}>
          Bravo<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <p className="t-callout" style={{ color: 'var(--ink-2)', marginTop: 8, maxWidth: 320 }}>
          Le rapport a été envoyé. Claude pourra le lire à ton prochain prompt.
        </p>
        <div style={{ marginTop: 32, width: '100%', maxWidth: 320 }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => (onBack ? onBack() : navigate('/'))}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <header style={{ padding: '32px 20px 16px' }}>
        <h1 className="t-large" style={{ margin: 0, color: 'var(--ink)' }}>
          Bravo<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <div className="t-callout" style={{ color: 'var(--ink-3)', marginTop: 6 }}>
          {session.name}
        </div>
      </header>

      <div style={{ padding: '0 20px', display: 'grid', gap: 16 }}>
        {/* Stats grid 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatTile label="Durée" value={`${durationMinutes}min`} />
          <StatTile label="Volume" value={`${Math.round(totalVolumeKg)}kg`} />
          <StatTile label="Sets" value={`${totalSetsDone}`} />
          <StatTile label="Reps" value={`${totalRepsDone}`} />
        </div>

        {/* Completion */}
        <Card variant="surface" padding={16}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="t-headline" style={{ color: 'var(--ink)' }}>
              Complétion
            </span>
            <span className="tabular" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
              {Math.round(completionRate * 100)}%
            </span>
          </div>
          <ProgressBar value={completionRate} />
        </Card>

        {/* PR card */}
        {prCount > 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.1 }}
          >
            <Card variant="tinted" padding={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: 'var(--bg-elev)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={22} />
                </div>
                <div>
                  <div className="t-headline" style={{ color: 'var(--ink)' }}>
                    {prCount} record{prCount > 1 ? 's' : ''} battu{prCount > 1 ? 's' : ''}
                  </div>
                  <div className="t-footnote" style={{ color: 'var(--ink-3)', marginTop: 2 }}>
                    Solide. Claude saura.
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {/* Feeling */}
        <Card variant="surface" padding={16}>
          <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 10 }}>
            Comment tu te sens ?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {FEELINGS.map((emoji, i) => {
              const v = i + 1;
              const active = feeling === v;
              return (
                <motion.button
                  key={v}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                  onClick={() => setFeeling(v)}
                  style={{
                    aspectRatio: '1 / 1',
                    border: active ? '2px solid var(--accent)' : '2px solid transparent',
                    background: active ? 'var(--accent-soft)' : 'var(--bg-tinted)',
                    borderRadius: 14,
                    fontSize: 28,
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  aria-label={`Ressenti ${v}`}
                >
                  {emoji}
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        <Card variant="surface" padding={16}>
          <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>
            Notes
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comment ça s'est passé ?"
            rows={3}
            style={{
              width: '100%',
              border: 0,
              outline: 0,
              background: 'var(--bg-tinted)',
              borderRadius: 18,
              padding: 14,
              fontFamily: 'inherit',
              fontSize: 15,
              color: 'var(--ink)',
              resize: 'vertical',
            }}
          />
        </Card>

        {/* Exercises completion list */}
        <ListGroup header="exercices">
          {exerciseProgress.map((ep) => {
            const pct = ep.setsTotal > 0 ? ep.setsDone / ep.setsTotal : 0;
            return (
              <ListRow
                key={ep.exercise.id}
                label={ep.exercise.name}
                subtitle={
                  <span className="tabular">
                    {ep.setsDone}/{ep.setsTotal} sets
                  </span>
                }
                trailing={
                  <span
                    className="tabular"
                    style={{
                      color: pct === 1 ? 'var(--success)' : 'var(--ink-3)',
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(pct * 100)}%
                  </span>
                }
              />
            );
          })}
        </ListGroup>
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
          leadingIcon={<Send size={18} />}
          onClick={handleSubmit}
        >
          Envoyer le rapport
        </Button>
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
