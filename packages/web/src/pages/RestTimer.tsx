import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Video, Plus } from 'lucide-react';
import { Button, Card, IconButton } from '../components/ui/index.js';
import type { Exercise, WorkSet } from '@coach/shared';

interface Props {
  open: boolean;
  /** seconds remaining for this rest */
  initialSeconds: number;
  nextExercise?: Exercise;
  nextSet?: WorkSet;
  onSkip: () => void;
  onComplete: () => void;
  onAdd30: () => void;
  onShowVideo?: () => void;
}

/**
 * Full-screen sheet sliding up from bottom.
 * Phase 8 will wire vibrate / wake lock; here only timer logic.
 */
export function RestTimer({
  open,
  initialSeconds,
  nextExercise,
  nextSet,
  onSkip,
  onComplete,
  onAdd30,
  onShowVideo,
}: Props) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const target = initialSeconds;

  useEffect(() => {
    if (open) setRemaining(initialSeconds);
  }, [open, initialSeconds]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  const overdue = remaining < 0;
  const absRemaining = Math.abs(remaining);
  const mm = String(Math.floor(absRemaining / 60)).padStart(2, '0');
  const ss = String(absRemaining % 60).padStart(2, '0');
  const targetMm = String(Math.floor(target / 60)).padStart(2, '0');
  const targetSs = String(target % 60).padStart(2, '0');

  const ringSize = 290;
  const stroke = 3;
  const strokeProgress = 3.4;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / target));
  const dashOffset = circumference * (1 - progress);
  const warn = !overdue && remaining <= 10;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-canvas)',
            zIndex: 80,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 430,
            margin: '0 auto',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 40,
              height: 5,
              background: 'var(--ink-4)',
              opacity: 0.3,
              borderRadius: 999,
              margin: '12px auto 0',
              flexShrink: 0,
            }}
          />

          <div
            className="t-caption"
            style={{
              textAlign: 'center',
              color: warn ? 'var(--warn)' : 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginTop: 18,
            }}
          >
            Repos
          </div>

          {/* Ring */}
          <div style={{ display: 'grid', placeItems: 'center', flex: 1, padding: '12px 20px' }}>
            <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="var(--bg-tinted)"
                  strokeWidth={stroke}
                  fill="none"
                />
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={warn ? 'var(--warn)' : overdue ? 'var(--danger)' : 'var(--accent)'}
                  strokeWidth={strokeProgress}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
                {/* 60 ticks */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i / 60) * 2 * Math.PI;
                  const isMajor = i % 5 === 0;
                  const r1 = radius - (isMajor ? 10 : 6);
                  const r2 = radius - (isMajor ? 16 : 10);
                  const x1 = ringSize / 2 + r1 * Math.cos(angle);
                  const y1 = ringSize / 2 + r1 * Math.sin(angle);
                  const x2 = ringSize / 2 + r2 * Math.cos(angle);
                  const y2 = ringSize / 2 + r2 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--separator)"
                      strokeWidth={isMajor ? 1.4 : 0.8}
                      opacity={isMajor ? 0.6 : 0.25}
                    />
                  );
                })}
              </svg>

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div className="t-caption" style={{ color: 'var(--ink-3)', textTransform: 'lowercase' }}>
                    {overdue ? 'sur-temps' : 'restant'}
                  </div>
                  <div
                    className="t-display tabular"
                    style={{
                      fontSize: 92,
                      lineHeight: 1,
                      color: warn ? 'var(--warn)' : overdue ? 'var(--danger)' : 'var(--ink)',
                      marginTop: 4,
                    }}
                  >
                    {overdue ? '+' : ''}
                    {mm}:{ss}
                  </div>
                  <div className="t-footnote tabular" style={{ color: 'var(--ink-3)', marginTop: 6 }}>
                    objectif · {targetMm}:{targetSs}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next-up card */}
          {nextExercise && nextSet ? (
            <div style={{ padding: '0 20px 12px' }}>
              <Card variant="surface" padding={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-caption" style={{ color: 'var(--ink-3)' }}>
                      à suivre
                    </div>
                    <div className="t-headline" style={{ color: 'var(--ink)', marginTop: 2 }}>
                      {nextExercise.name}
                    </div>
                    <div className="t-footnote tabular" style={{ color: 'var(--ink-3)', marginTop: 2 }}>
                      Set {nextSet.set_number} · {nextSet.reps ?? '—'} reps · {nextSet.weight_kg ?? 0}
                      {nextSet.weight_unit}
                    </div>
                  </div>
                  {nextExercise.video_url && onShowVideo ? (
                    <IconButton ariaLabel="Voir vidéo" onClick={onShowVideo}>
                      <Video size={18} />
                    </IconButton>
                  ) : null}
                </div>
              </Card>
            </div>
          ) : null}

          {/* Actions */}
          <div style={{ padding: '0 20px 16px', display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button variant="tinted" size="lg" leadingIcon={<Plus size={16} />} onClick={onAdd30}>
                +30s
              </Button>
              <Button variant="tinted" size="lg" onClick={onSkip}>
                Skip repos
              </Button>
            </div>
            <Button
              variant="primary"
              size="xl"
              fullWidth
              trailingIcon={<ArrowRight size={18} />}
              onClick={onComplete}
            >
              Prêt — set suivant
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
