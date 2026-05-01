import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MoreHorizontal,
  Video,
  CheckCircle2,
  ChevronDown,
  Trophy,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  IconButton,
  ListGroup,
  ListRow,
  ProgressBar,
  RPESegmented,
  Sheet,
  Stepper,
} from '../components/ui/index.js';
import type { Exercise, SessionDef, WorkSet, SessionReport } from '@coach/shared';
import { RestTimer } from './RestTimer.js';
import { PostSession } from './PostSession.js';
import { useProgram } from '../store/program.store.js';
import { useHistory } from '../store/history.store.js';
import { useWorkout } from '../store/workout.store.js';
import { apiClient } from '../api/endpoints.js';

type Phase = 'set' | 'rest' | 'done';

interface SetActuals {
  reps: number;
  weight: number;
  rpe: number;
}

export function Workout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const program = useProgram((s) => s.program);
  const sessionId = params.get('session');

  const session = useMemo<SessionDef | null>(() => {
    if (!program) return null;
    if (sessionId) {
      return program.sessions.find((s) => s.id === sessionId) ?? null;
    }
    return program.sessions[0] ?? null;
  }, [program, sessionId]);

  if (!program || !session) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div>
          <p className="t-body" style={{ color: 'var(--ink-3)' }}>
            {program === null ? 'Aucun programme actif' : 'Séance introuvable'}
          </p>
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" size="md" onClick={() => navigate('/')}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <WorkoutInner program={program} session={session} />;
}

interface InnerProps {
  program: NonNullable<ReturnType<typeof useProgram.getState>['program']>;
  session: SessionDef;
}

function WorkoutInner({ program, session }: InnerProps) {
  const navigate = useNavigate();
  const upsertReport = useHistory((s) => s.upsert);
  const startWorkout = useWorkout((s) => s.start);
  const setWorkoutPhase = useWorkout((s) => s.setPhase);
  const endWorkout = useWorkout((s) => s.end);

  // Flat list of (exercise, set)
  const flatPlan = useMemo(() => {
    const out: { exercise: Exercise; setIndex: number; set: WorkSet }[] = [];
    for (const block of session.blocks) {
      for (const exercise of block.exercises) {
        exercise.sets.forEach((set, i) => {
          out.push({ exercise, setIndex: i, set });
        });
      }
    }
    return out;
  }, [session]);

  const totalSets = flatPlan.length;
  const exercisesFlat = useMemo(
    () => Array.from(new Set(flatPlan.map((p) => p.exercise))),
    [flatPlan],
  );
  const totalExercises = exercisesFlat.length;

  const [phase, setPhase] = useState<Phase>('set');
  const [cursor, setCursor] = useState(0);
  const [actuals, setActuals] = useState<Record<string, SetActuals>>({});
  const [cuesOpen, setCuesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [globalSeconds, setGlobalSeconds] = useState(0);
  const [startedAt] = useState(() => new Date());

  // Mark workout active in the store the moment this view mounts.
  // Phase 8 will use this for crash recovery.
  useEffect(() => {
    startWorkout(session.id);
    return () => {
      // Only end if we left without completion. PostSession's submit handler
      // also clears it after a successful POST.
      const active = useWorkout.getState().active;
      if (active && active.sessionId === session.id) endWorkout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  useEffect(() => {
    setWorkoutPhase(phase);
  }, [phase, setWorkoutPhase]);

  // Global timer
  useEffect(() => {
    const id = window.setInterval(() => setGlobalSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const currentItem = flatPlan[cursor];
  const previousItem = cursor > 0 ? flatPlan[cursor - 1] : null;
  const nextItem = cursor + 1 < flatPlan.length ? flatPlan[cursor + 1] : null;

  const exerciseIdx = currentItem
    ? exercisesFlat.findIndex((e) => e.id === currentItem.exercise.id) + 1
    : 0;

  const formKey = currentItem ? `${currentItem.exercise.id}-${currentItem.setIndex}` : '';
  const stored = actuals[formKey];
  const initialReps = stored?.reps ?? currentItem?.set.reps ?? currentItem?.set.reps_min ?? 8;
  const initialWeight = stored?.weight ?? currentItem?.set.weight_kg ?? 0;
  const initialRpe = stored?.rpe ?? currentItem?.set.rpe_target ?? 7;
  const [reps, setReps] = useState(initialReps);
  const [weight, setWeight] = useState(initialWeight);
  const [rpe, setRpe] = useState(initialRpe);

  useEffect(() => {
    setReps(initialReps);
    setWeight(initialWeight);
    setRpe(initialRpe);
  }, [formKey, initialReps, initialWeight, initialRpe]);

  const validateSet = () => {
    if (!currentItem) return;
    setActuals((prev) => ({ ...prev, [formKey]: { reps, weight, rpe } }));
    if (cursor + 1 >= flatPlan.length) {
      setPhase('done');
      return;
    }
    if (currentItem.set.rest_seconds > 0) {
      setPhase('rest');
    } else {
      setCursor(cursor + 1);
    }
  };

  const completeRest = () => {
    setCursor(cursor + 1);
    setPhase('set');
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Done phase — build a real SessionReport and POST.
  if (phase === 'done') {
    const exerciseProgress = exercisesFlat.map((ex) => {
      const setsTotal = ex.sets.length;
      const setsDone = ex.sets.filter((_s, i) => actuals[`${ex.id}-${i}`]).length;
      return { exercise: ex, setsDone, setsTotal };
    });
    const totalVolumeKg = Object.values(actuals).reduce((acc, a) => acc + a.reps * a.weight, 0);
    const totalSetsDone = Object.keys(actuals).length;
    const totalRepsDone = Object.values(actuals).reduce((acc, a) => acc + a.reps, 0);
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));

    const handleSubmit = async (overallFeeling: number, notes: string) => {
      const report = buildReport({
        program,
        session,
        startedAt,
        durationMinutes,
        actuals,
        flatPlan,
        overallFeeling,
        notes,
      });
      try {
        const saved = await apiClient.postSession(report);
        upsertReport(saved);
        endWorkout();
        return { ok: true as const, id: saved.id };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : 'submit_failed',
        };
      }
    };

    return (
      <PostSession
        session={session}
        exerciseProgress={exerciseProgress}
        durationMinutes={durationMinutes}
        totalVolumeKg={totalVolumeKg}
        totalSetsDone={totalSetsDone}
        totalRepsDone={totalRepsDone}
        prCount={0}
        onSubmitReport={handleSubmit}
        onBack={() => navigate('/')}
        onNavigateToReport={(id) => navigate(`/history/${id}`)}
      />
    );
  }

  if (!currentItem) return null;

  const exercise = currentItem.exercise;
  const set = currentItem.set;
  const setNumberInExercise = currentItem.setIndex + 1;
  const totalSetsInExercise = exercise.sets.length;
  const setProgressOverall = (cursor + 1) / totalSets;

  const pr =
    weight > (set.weight_kg ?? 0) || (reps > (set.reps ?? 0) && weight >= (set.weight_kg ?? 0));

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-canvas)' }}>
      {/* Sticky top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--material-thick)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid var(--separator)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            gap: 8,
          }}
        >
          <IconButton ariaLabel="Fermer" onClick={() => setCloseOpen(true)}>
            <X size={18} />
          </IconButton>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div className="t-caption" style={{ color: 'var(--ink-3)' }}>
              {session.name}
            </div>
            <div className="t-footnote tabular" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {fmtTime(globalSeconds)}
            </div>
          </div>
          <IconButton ariaLabel="Plus" onClick={() => setMoreOpen(true)}>
            <MoreHorizontal size={18} />
          </IconButton>
        </div>
        <div style={{ padding: '0 16px 8px' }}>
          <ProgressBar value={setProgressOverall} ariaLabel="progression sets" />
          <div
            className="t-caption tabular"
            style={{ color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}
          >
            <span>
              Exo {exerciseIdx}/{totalExercises}
            </span>
            <span>
              {cursor + 1}/{totalSets} sets
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: 20, display: 'grid', gap: 14, paddingBottom: 120 }}>
        {/* Exercise card */}
        <Card variant="surface" padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="t-title-2" style={{ margin: 0, color: 'var(--ink)', flex: 1 }}>
              {exercise.name}
            </h2>
            {exercise.video_url ? (
              <IconButton ariaLabel="Vidéo">
                <Video size={18} />
              </IconButton>
            ) : null}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {exercise.muscle_groups_primary.map((m) => (
              <Badge key={m} variant="accent">
                {m}
              </Badge>
            ))}
          </div>

          {exercise.coaching_cues.length > 0 ? (
            <button
              type="button"
              onClick={() => setCuesOpen((v) => !v)}
              style={{
                marginTop: 12,
                width: '100%',
                background: 'var(--bg-tinted)',
                border: 0,
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                cursor: 'pointer',
                color: 'var(--ink)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <span>Cues techniques ({exercise.coaching_cues.length})</span>
              <motion.span animate={{ rotate: cuesOpen ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.span>
            </button>
          ) : null}
          <AnimatePresence>
            {cuesOpen ? (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  margin: 0,
                  padding: '12px 0 0 18px',
                  listStyle: 'disc',
                  color: 'var(--ink-2)',
                  display: 'grid',
                  gap: 6,
                  overflow: 'hidden',
                }}
              >
                {exercise.coaching_cues.map((c, i) => (
                  <li key={i} className="t-callout">
                    {c}
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </Card>

        {/* Set focus */}
        <Card variant="surface" padding={16}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="t-caption" style={{ color: 'var(--ink-3)', textTransform: 'lowercase' }}>
                set en cours
              </div>
              <div
                className="tabular"
                style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, color: 'var(--ink)', marginTop: 2 }}
              >
                {setNumberInExercise}/{totalSetsInExercise}
              </div>
              <div className="t-footnote tabular" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
                cible · {set.reps ?? `${set.reps_min ?? '?'}+`} reps · {set.weight_kg ?? '—'}
                {set.weight_unit}
                {set.rpe_target ? ` · RPE ${set.rpe_target}` : ''}
              </div>
            </div>
            {previousItem && previousItem.exercise.id === exercise.id ? (
              <div style={{ textAlign: 'right' }}>
                <div className="t-caption" style={{ color: 'var(--ink-3)' }}>
                  dernière fois
                </div>
                <div className="t-footnote tabular" style={{ color: 'var(--ink-2)', marginTop: 2 }}>
                  {actuals[`${previousItem.exercise.id}-${previousItem.setIndex}`]?.reps ?? '—'} ×{' '}
                  {actuals[`${previousItem.exercise.id}-${previousItem.setIndex}`]?.weight ?? '—'}kg
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            <Stepper
              label="Reps réalisées"
              value={reps}
              min={0}
              max={50}
              onChange={setReps}
              hint={set.reps ? `cible · ${set.reps}` : undefined}
            />
            <Stepper
              label="Poids"
              value={weight}
              step={2.5}
              min={0}
              max={500}
              unit={set.weight_unit}
              onChange={setWeight}
              hint={set.weight_kg ? `cible · ${set.weight_kg}${set.weight_unit}` : undefined}
            />
            <RPESegmented value={rpe} onChange={setRpe} />
          </div>

          {pr ? (
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              style={{ marginTop: 14 }}
            >
              <Card variant="tinted" padding={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Trophy size={18} style={{ color: 'var(--accent)' }} />
                  <div className="t-footnote" style={{ color: 'var(--ink-2)' }}>
                    PR projeté · valide pour confirmer
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </Card>
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
          leadingIcon={<CheckCircle2 size={18} />}
          onClick={validateSet}
        >
          Valider · {reps} reps
        </Button>
      </div>

      {/* Rest timer */}
      <RestTimer
        open={phase === 'rest'}
        initialSeconds={set.rest_seconds || 60}
        nextExercise={nextItem?.exercise}
        nextSet={nextItem?.set}
        onSkip={completeRest}
        onComplete={completeRest}
        onAdd30={() => {
          /* Phase 8 wires this */
        }}
      />

      {/* More sheet */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <ListGroup header="set en cours">
          <ListRow
            label="Skip ce set"
            onClick={() => {
              setMoreOpen(false);
              if (cursor + 1 < flatPlan.length) setCursor(cursor + 1);
              else setPhase('done');
            }}
          />
          <ListRow
            label={<span style={{ color: 'var(--danger)' }}>Skip cet exercice</span>}
            onClick={() => {
              setMoreOpen(false);
              const nextIdx = flatPlan.findIndex(
                (p, i) => i > cursor && p.exercise.id !== exercise.id,
              );
              if (nextIdx === -1) setPhase('done');
              else setCursor(nextIdx);
            }}
          />
        </ListGroup>
        <div style={{ height: 16 }} />
        {exercise.alternatives.length > 0 ? (
          <ListGroup header="alternatives">
            {exercise.alternatives.map((alt, i) => (
              <ListRow
                key={`${alt.name}-${i}`}
                label={alt.name}
                subtitle={alt.reason}
                onClick={() => setMoreOpen(false)}
              />
            ))}
          </ListGroup>
        ) : null}
      </Sheet>

      {/* Close confirm */}
      <Sheet open={closeOpen} onClose={() => setCloseOpen(false)}>
        <div style={{ display: 'grid', gap: 12, padding: '4px 0 8px' }}>
          <h3 className="t-title-2" style={{ margin: 0 }}>
            Abandonner la séance ?
          </h3>
          <p className="t-callout" style={{ color: 'var(--ink-3)', margin: 0 }}>
            Tes données ne seront pas envoyées. Tu peux toujours continuer.
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
            <Button
              variant="bordered"
              size="lg"
              fullWidth
              onClick={() => {
                setCloseOpen(false);
                endWorkout();
                navigate('/');
              }}
            >
              Abandonner
            </Button>
            <Button variant="primary" size="lg" fullWidth onClick={() => setCloseOpen(false)}>
              Continuer la séance
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

interface BuildReportInput {
  program: NonNullable<ReturnType<typeof useProgram.getState>['program']>;
  session: SessionDef;
  startedAt: Date;
  durationMinutes: number;
  actuals: Record<string, SetActuals>;
  flatPlan: { exercise: Exercise; setIndex: number; set: WorkSet }[];
  overallFeeling: number;
  notes: string;
}

/**
 * Convert in-memory `actuals` map into the canonical SessionReport shape
 * accepted by POST /api/sessions. Phase 8 will replace the random UUID
 * with a stable id and add real PR detection from history.
 */
function buildReport(input: BuildReportInput): SessionReport {
  const { program, session, startedAt, durationMinutes, actuals, flatPlan, overallFeeling, notes } =
    input;
  const completedAt = new Date().toISOString();

  // Group flatPlan by exercise to build exercises_log.
  const byExercise = new Map<string, { exercise: Exercise; entries: typeof flatPlan }>();
  for (const item of flatPlan) {
    const key = item.exercise.id;
    if (!byExercise.has(key)) byExercise.set(key, { exercise: item.exercise, entries: [] });
    byExercise.get(key)!.entries.push(item);
  }

  let totalSetsPlanned = 0;
  let totalSetsDone = 0;
  let totalRepsDone = 0;
  let totalVolumeKg = 0;

  const exercises_log = Array.from(byExercise.values()).map(({ exercise, entries }) => {
    const sets_log = entries.map(({ set, setIndex }) => {
      const a = actuals[`${exercise.id}-${setIndex}`];
      totalSetsPlanned += 1;
      const completed = Boolean(a);
      if (completed) {
        totalSetsDone += 1;
        totalRepsDone += a!.reps;
        totalVolumeKg += a!.reps * a!.weight;
      }
      return {
        set_number: set.set_number,
        type: set.type,
        planned_reps: set.reps,
        actual_reps: a?.reps ?? null,
        planned_weight_kg: set.weight_kg,
        actual_weight_kg: a?.weight ?? null,
        rpe_planned: set.rpe_target,
        rpe_actual: (a?.rpe ?? null) as number | null,
        rest_planned_seconds: set.rest_seconds,
        rest_taken_seconds: set.rest_seconds, // Phase 8: capture real rest taken
        duration_seconds: set.duration_seconds,
        completed,
        is_pr: false,
        notes: '',
      };
    });
    const allDone = sets_log.every((s) => s.completed);
    return {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      completed: allDone,
      skipped: sets_log.every((s) => !s.completed),
      sets_log,
      notes: '',
    };
  });

  const completion_rate = totalSetsPlanned > 0 ? totalSetsDone / totalSetsPlanned : 0;

  return {
    schema_version: '1.0.0',
    id: cryptoRandomUuidV4(),
    program_id: program.program.id,
    session_id: session.id,
    session_name: session.name,
    started_at: startedAt.toISOString(),
    completed_at: completedAt,
    duration_actual_minutes: durationMinutes,
    completion_rate,
    pre_session: {
      energy_level: null,
      sleep_quality: null,
      soreness_level: null,
      notes: '',
    },
    post_session: {
      overall_feeling: Math.max(1, Math.min(5, overallFeeling)),
      difficulty_perceived: null,
      notes,
    },
    exercises_log,
    volume_summary: {
      total_sets_planned: totalSetsPlanned,
      total_sets_done: totalSetsDone,
      total_reps_done: totalRepsDone,
      total_volume_kg: Math.round(totalVolumeKg * 10) / 10,
    },
  };
}

/**
 * `crypto.randomUUID` is widely available; this small helper keeps the
 * call-site readable and isolates the typing for older type lib targets.
 */
function cryptoRandomUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback (very unlikely path on modern browsers).
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else if (i === 19) s += hex[8 + Math.floor(Math.random() * 4)];
    else s += hex[Math.floor(Math.random() * 16)];
  }
  return s;
}
