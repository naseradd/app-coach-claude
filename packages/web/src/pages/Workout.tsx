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
import type {
  Exercise,
  SessionDef,
  SessionReport as SessionReportType,
} from '@coach/shared';
import { SessionReport as SessionReportSchema } from '@coach/shared';
import { RestTimer } from './RestTimer.js';
import { PostSession } from './PostSession.js';
import { TimedSetRunner } from '../components/workout/TimedSetRunner.js';
import { VideoFrame } from '../components/workout/VideoFrame.js';
import { buildFlatPlan, type FlatPlanItem } from '../utils/flatPlan.js';
import { useProgram } from '../store/program.store.js';
import { useHistory } from '../store/history.store.js';
import {
  useWorkout,
  type SetLogEntry,
  type PreSessionCheckIn,
} from '../store/workout.store.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { useHaptics } from '../hooks/useHaptics.js';
import { detectPr } from '../utils/prDetect.js';
import { apiClient } from '../api/endpoints.js';

export function Workout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const program = useProgram((s) => s.program);
  const sessionIdParam = params.get('session');
  const workoutSessionId = useWorkout((s) => s.sessionId);
  const workoutProgramId = useWorkout((s) => s.programId);

  // Effective sessionId: prefer the in-flight workout (resume case) over the
  // URL param so a stale URL never overrides actual state.
  const sessionId = workoutSessionId ?? sessionIdParam;

  const session = useMemo<SessionDef | null>(() => {
    if (!program) return null;
    if (sessionId) return program.sessions.find((s) => s.id === sessionId) ?? null;
    return program.sessions[0] ?? null;
  }, [program, sessionId]);

  // Guard: if no active workout AND no URL pointer, redirect home. This keeps
  // /workout from being accessible without a check-in flow.
  useEffect(() => {
    if (program && session && !workoutProgramId && !sessionIdParam) {
      navigate('/', { replace: true });
    }
  }, [program, session, workoutProgramId, sessionIdParam, navigate]);

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
  const history = useHistory((s) => s.reports);

  // Workout store ----------------------------------------------------------
  const startWorkoutAction = useWorkout((s) => s.start);
  const endWorkoutAction = useWorkout((s) => s.end);
  const phase = useWorkout((s) => s.phase);
  const exerciseIndex = useWorkout((s) => s.exerciseIndex);
  const setIndex = useWorkout((s) => s.setIndex);
  const setsLog = useWorkout((s) => s.setsLog);
  const preSessionStored = useWorkout((s) => s.preSession);
  const programIdInStore = useWorkout((s) => s.programId);
  const startedAt = useWorkout((s) => s.startedAt);
  const logSet = useWorkout((s) => s.logSet);
  const startRest = useWorkout((s) => s.startRest);
  const endRest = useWorkout((s) => s.endRest);
  const updateLastSetRest = useWorkout((s) => s.updateLastSetRest);
  const setExerciseSetIndex = useWorkout((s) => s.setExerciseSetIndex);
  const setPhase = useWorkout((s) => s.setPhase);

  const haptics = useHaptics();

  // Wake lock active for the whole workout (not during 'done' / submitted).
  useWakeLock(programIdInStore !== null && phase !== 'done');

  // Resolve flat plan — interleaved by superset/circuit blocks ------------
  const flatPlan: FlatPlanItem[] = useMemo(() => buildFlatPlan(session), [session]);
  const exercisesFlat: Exercise[] = useMemo(() => {
    const seen = new Set<string>();
    const list: Exercise[] = [];
    for (const item of flatPlan) {
      if (!seen.has(item.exercise.id)) {
        seen.add(item.exercise.id);
        list.push(item.exercise);
      }
    }
    return list;
  }, [flatPlan]);

  const totalSets = flatPlan.length;
  const totalExercises = exercisesFlat.length;

  // If resume landed us on indices that don't fit this session (rare but
  // possible if the program changed), clamp to start.
  useEffect(() => {
    if (exerciseIndex >= totalExercises || exerciseIndex < 0) {
      setExerciseSetIndex(0, 0);
    } else {
      const ex = exercisesFlat[exerciseIndex];
      if (ex && (setIndex >= ex.sets.length || setIndex < 0)) {
        setExerciseSetIndex(exerciseIndex, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalExercises]);

  // Bootstrap: if no active workout in store yet, kick one off using the
  // URL-based session. This keeps the flow working even if a user reloads
  // mid-workout before the SSE/resume completed (rare race).
  useEffect(() => {
    if (programIdInStore !== null) return;
    void startWorkoutAction(program.program.id, session.id, {
      energy_level: null,
      sleep_quality: null,
      soreness_level: null,
      notes: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current item — driven by interleaved flatPlan cursor -------------------
  const cursor = useMemo(() => {
    const ex = exercisesFlat[exerciseIndex];
    if (!ex) return 0;
    const idx = flatPlan.findIndex(
      (p) => p.exercise.id === ex.id && p.setIndex === setIndex,
    );
    return idx >= 0 ? idx : 0;
  }, [exercisesFlat, exerciseIndex, setIndex, flatPlan]);
  const currentItem = flatPlan[cursor] ?? null;
  const currentExercise = currentItem?.exercise ?? null;
  const currentSet = currentItem?.set ?? null;
  const nextItem = cursor + 1 < flatPlan.length ? flatPlan[cursor + 1]! : null;

  // Form state for the current set ----------------------------------------
  const formKey = currentExercise && currentSet
    ? `${currentExercise.id}-${setIndex}`
    : '';
  const initialReps =
    (currentSet?.reps ?? currentSet?.reps_min ?? 8) as number;
  const initialWeight = (currentSet?.weight_kg ?? 0) as number;
  const initialRpe = (currentSet?.rpe_target ?? 7) as number;
  const [reps, setReps] = useState(initialReps);
  const [weight, setWeight] = useState(initialWeight);
  const [rpe, setRpe] = useState(initialRpe);

  useEffect(() => {
    setReps(initialReps);
    setWeight(initialWeight);
    setRpe(initialRpe);
  }, [formKey, initialReps, initialWeight, initialRpe]);

  // UI bits ---------------------------------------------------------------
  const [cuesOpen, setCuesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  // Global timer derived from startedAt for accuracy across reloads.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const globalSeconds = startedAt
    ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
    : 0;

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Live PR check while editing the current set's actuals.
  const livePr = useMemo(
    () => detectPr(history, currentExercise?.id ?? '', weight, reps),
    [history, currentExercise?.id, weight, reps],
  );

  // Advance to next item in the interleaved flatPlan, or finish the workout.
  const advanceToNext = () => {
    if (!nextItem) {
      setPhase('done');
      return;
    }
    const exIdxNext = exercisesFlat.findIndex((e) => e.id === nextItem.exercise.id);
    if (exIdxNext < 0) {
      setPhase('done');
      return;
    }
    setExerciseSetIndex(exIdxNext, nextItem.setIndex);
  };

  // Validate set ----------------------------------------------------------
  const validateSet = () => {
    if (!currentExercise || !currentSet) return;
    haptics('success');

    const prCheck = detectPr(history, currentExercise.id, weight, reps);

    const entry: SetLogEntry = {
      exercise_id: currentExercise.id,
      exercise_name: currentExercise.name,
      set_number: currentSet.set_number,
      type: currentSet.type,
      planned_reps: currentSet.reps,
      planned_weight_kg: currentSet.weight_kg,
      rpe_planned: currentSet.rpe_target,
      rest_planned_seconds: currentSet.rest_seconds,
      actual_reps: reps,
      actual_weight_kg: weight,
      rpe_actual: rpe,
      // Will be patched once rest ends. If user skips rest, this stays 0.
      rest_taken_seconds: 0,
      duration_seconds: currentSet.duration_seconds,
      completed: true,
      is_pr: prCheck.isPr,
      notes: '',
    };
    logSet(entry);

    if (!nextItem) {
      // Final set — skip rest, mark workout done.
      setPhase('done');
      return;
    }

    if (currentSet.rest_seconds > 0) {
      startRest();
    } else {
      advanceToNext();
    }
  };

  const completeRest = () => {
    if (!currentExercise) return;
    const elapsed = endRest();
    updateLastSetRest(elapsed);
    advanceToNext();
  };

  const skipSet = () => {
    if (!currentExercise) return;
    setMoreOpen(false);
    advanceToNext();
  };

  const skipExercise = () => {
    if (!currentExercise) return;
    setMoreOpen(false);
    const exId = currentExercise.id;
    const next = flatPlan.findIndex((p, i) => i > cursor && p.exercise.id !== exId);
    if (next === -1) {
      setPhase('done');
      return;
    }
    const nxt = flatPlan[next]!;
    const exIdxNext = exercisesFlat.findIndex((e) => e.id === nxt.exercise.id);
    if (exIdxNext >= 0) setExerciseSetIndex(exIdxNext, nxt.setIndex);
    else setPhase('done');
  };

  // Done phase — build a real SessionReport and POST.
  if (phase === 'done') {
    return (
      <DoneScreen
        program={program}
        session={session}
        exercisesFlat={exercisesFlat}
        setsLog={setsLog}
        preSession={preSessionStored}
        startedAtIso={startedAt}
        haptics={haptics}
        onBack={() => navigate('/')}
        onSubmit={async (overallFeeling, notes) => {
          const report = buildReport({
            program,
            session,
            startedAt: startedAt ? new Date(startedAt) : new Date(),
            exercisesFlat,
            setsLog,
            preSession: preSessionStored,
            overallFeeling,
            notes,
          });
          const parsed = SessionReportSchema.safeParse(report);
          if (!parsed.success) {
            return {
              ok: false as const,
              error: 'Rapport invalide — détails: ' + JSON.stringify(parsed.error.flatten().fieldErrors),
            };
          }
          try {
            const saved = await apiClient.postSession(parsed.data);
            upsertReport(saved);
            haptics('success');
            await endWorkoutAction();
            return { ok: true as const, id: saved.id };
          } catch (e) {
            return {
              ok: false as const,
              error: e instanceof Error ? e.message : 'submit_failed',
            };
          }
        }}
        onNavigateToReport={(id) => navigate(`/history/${id}`)}
      />
    );
  }

  if (!currentExercise || !currentSet) return null;

  const setNumberInExercise = setIndex + 1;
  const totalSetsInExercise = currentExercise.sets.length;
  const setProgressOverall = (cursor + 1) / totalSets;
  const exerciseIdx = exerciseIndex + 1;

  const lastForThisExercise = [...setsLog]
    .reverse()
    .find((s) => s.exercise_id === currentExercise.id);

  const isTimed =
    currentSet.type === 'timed' ||
    (currentSet.duration_seconds !== null && currentSet.reps === null);

  const completeTimedSet = (elapsed: number) => {
    if (!currentExercise || !currentSet) return;
    haptics('success');
    const entry: SetLogEntry = {
      exercise_id: currentExercise.id,
      exercise_name: currentExercise.name,
      set_number: currentSet.set_number,
      type: currentSet.type,
      planned_reps: currentSet.reps,
      planned_weight_kg: currentSet.weight_kg,
      rpe_planned: currentSet.rpe_target,
      rest_planned_seconds: currentSet.rest_seconds,
      actual_reps: null,
      actual_weight_kg: null,
      rpe_actual: null,
      rest_taken_seconds: 0,
      duration_seconds: elapsed,
      completed: true,
      is_pr: false,
      notes: '',
    };
    logSet(entry);
    if (!nextItem) {
      setPhase('done');
      return;
    }
    if (currentSet.rest_seconds > 0) startRest();
    else advanceToNext();
  };

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
              {currentExercise.name}
            </h2>
            {currentItem &&
            (currentItem.blockType === 'superset' || currentItem.blockType === 'circuit') ? (
              <Badge variant="accent">
                {currentItem.blockType === 'superset' ? 'Superset' : 'Circuit'} · round{' '}
                {currentItem.roundIndex + 1}
              </Badge>
            ) : null}
            {currentExercise.video_url ? (
              <IconButton ariaLabel="Vidéo de l'exercice" onClick={() => setVideoOpen(true)}>
                <Video size={18} />
              </IconButton>
            ) : null}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {currentExercise.muscle_groups_primary.map((m) => (
              <Badge key={m} variant="accent">
                {m}
              </Badge>
            ))}
          </div>

          {currentExercise.coaching_cues.length > 0 ? (
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
              <span>Cues techniques ({currentExercise.coaching_cues.length})</span>
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
                {currentExercise.coaching_cues.map((c, i) => (
                  <li key={i} className="t-callout">
                    {c}
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </Card>

        {/* Set focus */}
        {isTimed ? (
          <TimedSetRunner
            targetSeconds={currentSet.duration_seconds ?? 60}
            onComplete={completeTimedSet}
          />
        ) : (
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
                cible · {currentSet.reps ?? `${currentSet.reps_min ?? '?'}+`} reps · {currentSet.weight_kg ?? '—'}
                {currentSet.weight_unit}
                {currentSet.rpe_target ? ` · RPE ${currentSet.rpe_target}` : ''}
              </div>
            </div>
            {lastForThisExercise ? (
              <div style={{ textAlign: 'right' }}>
                <div className="t-caption" style={{ color: 'var(--ink-3)' }}>
                  set précédent
                </div>
                <div className="t-footnote tabular" style={{ color: 'var(--ink-2)', marginTop: 2 }}>
                  {lastForThisExercise.actual_reps ?? '—'} ×{' '}
                  {lastForThisExercise.actual_weight_kg ?? '—'}kg
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
              hint={currentSet.reps ? `cible · ${currentSet.reps}` : undefined}
            />
            <Stepper
              label="Poids"
              value={weight}
              step={2.5}
              min={0}
              max={500}
              unit={currentSet.weight_unit}
              onChange={setWeight}
              hint={
                currentSet.weight_kg ? `cible · ${currentSet.weight_kg}${currentSet.weight_unit}` : undefined
              }
            />
            <RPESegmented value={rpe} onChange={setRpe} />
          </div>

          {livePr.isPr ? (
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
                    PR projeté · meilleur précédent {livePr.bestPrevious?.weight_kg}kg ×{' '}
                    {livePr.bestPrevious?.reps}
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </Card>
        )}
      </div>

      {/* Sticky bottom CTA — hidden in timed mode (TimedSetRunner has its own button) */}
      {!isTimed ? (
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
      ) : null}

      {/* Rest timer */}
      <RestTimer
        open={phase === 'rest'}
        initialSeconds={currentSet.rest_seconds || 60}
        nextExercise={nextItem?.exercise}
        nextSet={nextItem?.set}
        onSkip={completeRest}
        onComplete={completeRest}
      />

      {/* More sheet */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <ListGroup header="set en cours">
          <ListRow label="Skip ce set" onClick={skipSet} />
          <ListRow
            label={<span style={{ color: 'var(--danger)' }}>Skip cet exercice</span>}
            onClick={skipExercise}
          />
        </ListGroup>
        <div style={{ height: 16 }} />
        {currentExercise.alternatives.length > 0 ? (
          <ListGroup header="alternatives">
            {currentExercise.alternatives.map((alt, i) => (
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

      {/* Video sheet */}
      <Sheet open={videoOpen} onClose={() => setVideoOpen(false)}>
        {currentExercise.video_url ? (
          <div style={{ display: 'grid', gap: 12, paddingBottom: 16 }}>
            <h3 className="t-title-2" style={{ margin: 0 }}>
              {currentExercise.name}
            </h3>
            <VideoFrame url={currentExercise.video_url} title={currentExercise.name} />
          </div>
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
              onClick={async () => {
                setCloseOpen(false);
                await endWorkoutAction();
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

// -------------------------------------------------------------------------
// Done screen — separated to keep the main render tree readable.
// -------------------------------------------------------------------------

interface DoneProps {
  program: NonNullable<ReturnType<typeof useProgram.getState>['program']>;
  session: SessionDef;
  exercisesFlat: Exercise[];
  setsLog: SetLogEntry[];
  preSession: PreSessionCheckIn;
  startedAtIso: string | null;
  haptics: ReturnType<typeof useHaptics>;
  onBack: () => void;
  onNavigateToReport: (id: string) => void;
  onSubmit: (
    overallFeeling: number,
    notes: string,
  ) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
}

function DoneScreen({
  session,
  exercisesFlat,
  setsLog,
  startedAtIso,
  onBack,
  onNavigateToReport,
  onSubmit,
}: DoneProps) {
  const startedAt = startedAtIso ? new Date(startedAtIso) : new Date();
  const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));

  const exerciseProgress = exercisesFlat.map((ex) => {
    const setsTotal = ex.sets.length;
    const setsDone = setsLog.filter((s) => s.exercise_id === ex.id && s.completed).length;
    return { exercise: ex, setsDone, setsTotal };
  });

  const totalSetsDone = setsLog.filter((s) => s.completed).length;
  const totalRepsDone = setsLog
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + (s.actual_reps ?? 0), 0);
  const totalVolumeKg = setsLog
    .filter((s) => s.completed && s.type !== 'warmup')
    .reduce((acc, s) => acc + (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0), 0);
  const prCount = setsLog.filter((s) => s.is_pr).length;

  return (
    <PostSession
      session={session}
      exerciseProgress={exerciseProgress}
      durationMinutes={durationMinutes}
      totalVolumeKg={totalVolumeKg}
      totalSetsDone={totalSetsDone}
      totalRepsDone={totalRepsDone}
      prCount={prCount}
      onSubmitReport={onSubmit}
      onBack={onBack}
      onNavigateToReport={onNavigateToReport}
    />
  );
}

// -------------------------------------------------------------------------
// Report builder
// -------------------------------------------------------------------------

interface BuildReportInput {
  program: NonNullable<ReturnType<typeof useProgram.getState>['program']>;
  session: SessionDef;
  startedAt: Date;
  exercisesFlat: Exercise[];
  setsLog: SetLogEntry[];
  preSession: PreSessionCheckIn;
  overallFeeling: number;
  notes: string;
}

function buildReport(input: BuildReportInput): SessionReportType {
  const {
    program,
    session,
    startedAt,
    exercisesFlat,
    setsLog,
    preSession,
    overallFeeling,
    notes,
  } = input;
  const completedAt = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((completedAt.getTime() - startedAt.getTime()) / 60000),
  );

  let totalSetsPlanned = 0;
  let totalSetsDone = 0;
  let totalRepsDone = 0;
  let totalVolumeKg = 0;

  const exercises_log = exercisesFlat.map((exercise) => {
    const planned = exercise.sets;
    totalSetsPlanned += planned.length;

    // Map planned sets to actual log entries by set_number when available.
    const sets_log = planned.map((plannedSet) => {
      const logged = setsLog.find(
        (l) => l.exercise_id === exercise.id && l.set_number === plannedSet.set_number,
      );
      const completed = Boolean(logged?.completed);
      if (completed && logged) {
        totalSetsDone += 1;
        totalRepsDone += logged.actual_reps ?? 0;
        if (logged.type !== 'warmup') {
          totalVolumeKg += (logged.actual_reps ?? 0) * (logged.actual_weight_kg ?? 0);
        }
      }
      return {
        set_number: plannedSet.set_number,
        type: plannedSet.type,
        planned_reps: plannedSet.reps,
        actual_reps: logged?.actual_reps ?? null,
        planned_weight_kg: plannedSet.weight_kg,
        actual_weight_kg: logged?.actual_weight_kg ?? null,
        rpe_planned: plannedSet.rpe_target,
        rpe_actual: logged?.rpe_actual ?? null,
        rest_planned_seconds: plannedSet.rest_seconds,
        rest_taken_seconds: logged?.rest_taken_seconds ?? 0,
        duration_seconds: plannedSet.duration_seconds,
        completed,
        is_pr: logged?.is_pr ?? false,
        notes: logged?.notes ?? '',
      };
    });

    const allDone = sets_log.length > 0 && sets_log.every((s) => s.completed);
    const noneDone = sets_log.every((s) => !s.completed);

    return {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      completed: allDone,
      skipped: noneDone,
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
    completed_at: completedAt.toISOString(),
    duration_actual_minutes: durationMinutes,
    completion_rate,
    pre_session: {
      energy_level: preSession.energy_level,
      sleep_quality: preSession.sleep_quality,
      soreness_level: preSession.soreness_level,
      notes: preSession.notes,
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

function cryptoRandomUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
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
