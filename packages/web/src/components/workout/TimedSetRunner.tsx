import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button, Card } from '../ui/index.js';

interface Props {
  targetSeconds: number;
  onComplete: (elapsedSeconds: number) => void;
}

/**
 * Countdown runner for timed sets (cardio / iso). Starts paused.
 * Reports actual elapsed seconds on completion (could be < or > target).
 */
export function TimedSetRunner({ targetSeconds, onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(targetSeconds);
  const startRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const elapsed =
        accumulatedRef.current + (Date.now() - (startRef.current ?? Date.now())) / 1000;
      setRemaining(Math.max(0, targetSeconds - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [running, targetSeconds]);

  const toggle = () => {
    if (running) {
      accumulatedRef.current += (Date.now() - (startRef.current ?? Date.now())) / 1000;
      setRunning(false);
    } else {
      setRunning(true);
    }
  };

  const reset = () => {
    accumulatedRef.current = 0;
    startRef.current = null;
    setRemaining(targetSeconds);
    setRunning(false);
  };

  const finish = () => {
    const elapsedNow =
      accumulatedRef.current +
      (running ? (Date.now() - (startRef.current ?? Date.now())) / 1000 : 0);
    onComplete(Math.round(elapsedNow));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };
  const pct = targetSeconds > 0 ? Math.min(1, (targetSeconds - remaining) / targetSeconds) : 0;

  return (
    <Card variant="surface" padding={20}>
      <div className="t-caption" style={{ color: 'var(--ink-3)', textTransform: 'lowercase' }}>
        cible · {fmt(targetSeconds)}
      </div>
      <motion.div
        className="tabular"
        style={{
          fontSize: 64,
          fontWeight: 600,
          lineHeight: 1,
          color: remaining === 0 ? 'var(--success)' : 'var(--ink)',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {fmt(remaining)}
      </motion.div>
      <div
        aria-label="progression du set"
        style={{
          height: 6,
          background: 'var(--bg-tinted)',
          borderRadius: 999,
          overflow: 'hidden',
          marginTop: 12,
        }}
      >
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.25 }}
          style={{ height: '100%', background: 'var(--accent)' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
        <Button variant="bordered" size="lg" fullWidth onClick={reset} leadingIcon={<RotateCcw size={16} />}>
          Reset
        </Button>
        <Button
          variant={running ? 'bordered' : 'primary'}
          size="lg"
          fullWidth
          onClick={toggle}
          leadingIcon={running ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
        >
          {running ? 'Pause' : 'Démarrer'}
        </Button>
      </div>
      <div style={{ marginTop: 10 }}>
        <Button variant="primary" size="xl" fullWidth onClick={finish} leadingIcon={<CheckCircle2 size={18} />}>
          Marquer terminé
        </Button>
      </div>
    </Card>
  );
}
