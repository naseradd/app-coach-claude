import { useState, useRef, useEffect } from 'react'
import { Check, Play, Pause, SkipForward, Timer } from 'lucide-react'
import type { WorkoutSet, SetLog } from '../../schemas'
import { useWorkoutStore } from '../../store/workout.store'
import { NumberStepper } from '../ui/NumberStepper'
import { RpeInput } from '../ui/RpeInput'
import { Button } from '../ui/Button'

interface SetRowProps {
  exerciseId: string
  set: WorkoutSet
  log: SetLog | undefined
  isActive: boolean
  isCurrent: boolean
  category: string
}

type InputMode = 'strength' | 'timed' | 'cardio'

function getInputMode(category: string, set: WorkoutSet): InputMode {
  if (category === 'cardio') return 'cardio'
  if (set.type === 'timed' || (category === 'mobility' && set.duration_seconds !== null)) return 'timed'
  return 'strength'
}

function formatSecs(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

const SET_TYPE_LABEL: Record<string, string> = {
  warmup:  'Échauffement',
  working: 'Working',
  amrap:   'AMRAP',
  timed:   'Timed',
  dropset: 'Dropset',
  backoff: 'Back-off',
}

export function SetRow({ exerciseId, set, log, isActive, isCurrent, category }: SetRowProps) {
  const mode = getInputMode(category, set)
  const [expanded, setExpanded] = useState(isCurrent && isActive)

  // Strength inputs
  const [reps,   setReps]   = useState<number | null>(set.reps ?? null)
  const [weight, setWeight] = useState<number | null>(set.weight_kg ?? null)
  const [rpe,    setRpe]    = useState<number | null>(null)

  // Timed input
  const [duration, setDuration] = useState<number | null>(set.duration_seconds ?? null)

  // Cardio: stopwatch
  const [running,     setRunning]     = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const [distanceKm,  setDistanceKm]  = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { completeSet, skipSet } = useWorkoutStore()

  const completed = log?.completed ?? false
  const skipped   = log?.notes === 'skipped'

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function toggleCardioTimer() {
    if (running) {
      clearInterval(timerRef.current!)
      setRunning(false)
    } else {
      setRunning(true)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    }
  }

  function targetLabel(): string {
    if (mode === 'cardio') {
      if (set.duration_seconds) return formatSecs(set.duration_seconds)
      return 'Durée libre'
    }
    if (mode === 'timed') return set.duration_seconds ? formatSecs(set.duration_seconds) : '—'
    if (set.type === 'amrap') return `Max reps${set.weight_kg ? ` × ${set.weight_kg} kg` : ''}`
    const r = set.reps_min && set.reps_max
      ? `${set.reps_min}–${set.reps_max}`
      : (set.reps?.toString() ?? '—')
    const w = set.weight_kg ? ` × ${set.weight_kg} kg` : ''
    return `${r} reps${w}`
  }

  function completedLabel(): string {
    if (!log) return ''
    if (mode === 'cardio') {
      const t = log.actual_reps ? formatSecs(log.actual_reps) : '—'
      const d = log.actual_weight_kg ? ` · ${log.actual_weight_kg} km` : ''
      return `${t}${d}`
    }
    if (mode === 'timed') return log.actual_reps ? formatSecs(log.actual_reps) : '—'
    const rStr = log.actual_reps    !== null ? `${log.actual_reps} reps` : '—'
    const wStr = log.actual_weight_kg !== null ? ` · ${log.actual_weight_kg} kg` : ''
    return `${rStr}${wStr}`
  }

  function handleComplete() {
    if (mode === 'cardio') {
      const finalDuration = running ? elapsed : elapsed || null
      if (running) { clearInterval(timerRef.current!); setRunning(false) }
      completeSet(exerciseId, set.set_number, {
        actual_reps:      finalDuration,
        actual_weight_kg: distanceKm,
        rpe_actual:       null,
        type:             set.type,
        planned_reps:     set.reps,
        planned_weight_kg: set.weight_kg,
      }, set.rest_seconds)
      return
    }
    if (mode === 'timed') {
      completeSet(exerciseId, set.set_number, {
        actual_reps:      duration,
        actual_weight_kg: weight,
        rpe_actual:       rpe,
        type:             set.type,
        planned_reps:     set.reps,
        planned_weight_kg: set.weight_kg,
      }, set.rest_seconds)
      return
    }
    completeSet(exerciseId, set.set_number, {
      actual_reps:      reps,
      actual_weight_kg: weight,
      rpe_actual:       rpe,
      type:             set.type,
      planned_reps:     set.reps,
      planned_weight_kg: set.weight_kg,
    }, set.rest_seconds)
  }

  const borderClass = completed && !skipped
    ? 'border-win/40 bg-win/5'
    : skipped
    ? 'border-edge opacity-40'
    : isCurrent && isActive
    ? 'border-lime/50 bg-lime/5'
    : 'border-edge bg-surface'

  return (
    <div className={`border rounded-2xl transition-all ${borderClass}`}>
      {/* Header row */}
      <button
        onClick={() => !completed && !skipped && setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Set number bubble */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-condensed font-bold ${
          completed && !skipped
            ? 'bg-win text-[#08080F]'
            : skipped
            ? 'bg-edge text-faint'
            : isCurrent && isActive
            ? 'bg-lime text-[#08080F]'
            : 'bg-surface-2 text-muted border border-edge'
        }`}>
          {completed && !skipped ? <Check size={13} /> : set.set_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-condensed font-semibold tracking-wide ${
              set.type === 'warmup'
                ? 'bg-sky-900/40 text-sky-400'
                : mode === 'cardio'
                ? 'bg-lime/10 text-lime'
                : mode === 'timed'
                ? 'bg-purple-900/30 text-purple-400'
                : 'bg-surface-2 text-muted'
            }`}>
              {mode === 'cardio' ? 'Cardio' : SET_TYPE_LABEL[set.type] ?? set.type}
            </span>
            <span className="text-sm text-[#EEEEFF] font-condensed truncate">{targetLabel()}</span>
          </div>
          {set.rpe_target && !completed && (
            <span className="text-[11px] text-muted">RPE cible {set.rpe_target}</span>
          )}
        </div>

        {/* Completed summary */}
        {completed && !skipped && (
          <span className="text-xs text-win font-condensed flex-shrink-0">{completedLabel()}</span>
        )}

        {!completed && !skipped && (
          <span className={`text-sm transition-transform duration-200 text-faint flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        )}
      </button>

      {/* Expanded form */}
      {expanded && !completed && !skipped && (
        <div className="px-3 pb-4 pt-1 border-t border-edge space-y-4 animate-slide-up">

          {/* ─── CARDIO mode ─── */}
          {mode === 'cardio' && (
            <div className="space-y-4">
              {/* Stopwatch */}
              <div className="flex flex-col items-center gap-3 py-2">
                <span
                  className={`text-6xl font-display tracking-wider tabular-nums ${
                    running ? 'text-lime' : elapsed > 0 ? 'text-white' : 'text-faint'
                  }`}
                >
                  {formatSecs(elapsed)}
                </span>
                {set.duration_seconds && (
                  <span className="text-xs text-muted font-condensed">
                    Cible : {formatSecs(set.duration_seconds)}
                  </span>
                )}
                <button
                  onClick={toggleCardioTimer}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-condensed font-bold text-sm tracking-wide transition-all active:scale-95 ${
                    running
                      ? 'bg-warn/15 border border-warn/40 text-warn'
                      : 'bg-lime text-[#08080F]'
                  }`}
                >
                  {running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {elapsed > 0 ? 'Reprendre' : 'Démarrer'}</>}
                </button>
              </div>

              {/* Distance input */}
              <NumberStepper
                label="Distance (km)"
                value={distanceKm}
                onChange={setDistanceKm}
                step={0.1}
                min={0}
              />
            </div>
          )}

          {/* ─── TIMED mode ─── */}
          {mode === 'timed' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-6">
                <NumberStepper
                  label="Durée réelle (s)"
                  value={duration}
                  onChange={setDuration}
                  step={5}
                  min={0}
                  large
                />
                {set.weight_kg !== null && (
                  <NumberStepper
                    label="Poids (kg)"
                    value={weight}
                    onChange={setWeight}
                    step={2.5}
                    min={0}
                  />
                )}
              </div>
              {set.duration_seconds && (
                <p className="text-center text-xs text-muted font-condensed flex items-center justify-center gap-1.5">
                  <Timer size={12} />
                  Cible : {formatSecs(set.duration_seconds)}
                </p>
              )}
              <RpeInput value={rpe} onChange={setRpe} />
            </div>
          )}

          {/* ─── STRENGTH mode ─── */}
          {mode === 'strength' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-6">
                {set.type !== 'timed' && (
                  <NumberStepper
                    label={set.type === 'amrap' ? 'Reps faites' : 'Reps'}
                    value={reps}
                    onChange={setReps}
                    step={1}
                    min={0}
                    large
                  />
                )}
                {set.weight_kg !== null && (
                  <NumberStepper
                    label="Poids (kg)"
                    value={weight}
                    onChange={setWeight}
                    step={2.5}
                    min={0}
                    large={set.type === 'timed'}
                  />
                )}
              </div>
              <RpeInput value={rpe} onChange={setRpe} />
            </div>
          )}

          {set.notes && (
            <p className="text-xs text-muted italic px-1 border-l-2 border-edge pl-3">{set.notes}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => skipSet(exerciseId, set.set_number)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-condensed text-faint hover:text-muted transition-colors"
            >
              <SkipForward size={13} />
              Passer
            </button>
            <Button fullWidth size="lg" onClick={handleComplete}>
              <Check size={16} />
              {mode === 'cardio' && running ? 'Stop & Valider' : 'Valider'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
