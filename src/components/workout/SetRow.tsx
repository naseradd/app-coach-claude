import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, SkipForward } from 'lucide-react'
import type { WorkoutSet } from '../../schemas'
import type { SetLog } from '../../schemas'
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
}

export function SetRow({ exerciseId, set, log, isActive, isCurrent }: SetRowProps) {
  const [expanded, setExpanded] = useState(isCurrent && isActive)
  const [reps, setReps] = useState<number | null>(set.reps ?? null)
  const [weight, setWeight] = useState<number | null>(set.weight_kg ?? null)
  const [rpe, setRpe] = useState<number | null>(null)
  const { completeSet, skipSet } = useWorkoutStore()

  const completed = log?.completed ?? false
  const skipped = log?.notes === 'skipped'

  const setTypeLabel: Record<string, string> = {
    warmup: 'Échauffement',
    working: 'Working',
    amrap: 'AMRAP',
    timed: 'Timed',
    dropset: 'Dropset',
    backoff: 'Back-off',
  }

  const targetLabel = () => {
    if (set.type === 'timed' && set.duration_seconds) {
      return `${set.duration_seconds}s`
    }
    if (set.type === 'amrap') {
      return `Max reps × ${set.weight_kg ?? '—'} kg`
    }
    const r = set.reps_min && set.reps_max
      ? `${set.reps_min}–${set.reps_max}`
      : set.reps?.toString() ?? '—'
    const w = set.weight_kg ? `${set.weight_kg} kg` : '—'
    return `${r} reps × ${w}`
  }

  function handleComplete() {
    completeSet(exerciseId, set.set_number, {
      actual_reps: reps,
      actual_weight_kg: weight,
      rpe_actual: rpe,
      type: set.type,
      planned_reps: set.reps,
      planned_weight_kg: set.weight_kg,
    }, set.rest_seconds)
  }

  return (
    <div
      className={`border rounded-xl transition-colors ${
        completed && !skipped
          ? 'border-green-800 bg-green-950/30'
          : skipped
          ? 'border-zinc-800 bg-zinc-900/50 opacity-50'
          : isCurrent && isActive
          ? 'border-orange-500/50 bg-orange-950/20'
          : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => !completed && !skipped && setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Set number indicator */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
            completed && !skipped
              ? 'bg-green-500 text-white'
              : skipped
              ? 'bg-zinc-700 text-zinc-400'
              : isCurrent && isActive
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {completed && !skipped ? <Check size={12} /> : set.set_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              set.type === 'warmup' ? 'bg-blue-900/50 text-blue-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {setTypeLabel[set.type] ?? set.type}
            </span>
            <span className="text-sm text-zinc-300 truncate">{targetLabel()}</span>
          </div>
          {set.rpe_target && (
            <span className="text-xs text-zinc-500">RPE cible {set.rpe_target}</span>
          )}
        </div>

        {/* Actual logged */}
        {completed && !skipped && log && (
          <div className="text-right text-xs text-green-400 flex-shrink-0">
            <div>{log.actual_reps ?? '—'} reps</div>
            <div>{log.actual_weight_kg ?? '—'} kg</div>
          </div>
        )}

        {!completed && !skipped && (
          <span className="text-zinc-600 flex-shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </button>

      {/* Expanded input */}
      {expanded && !completed && !skipped && (
        <div className="px-3 pb-3 space-y-4 border-t border-zinc-800 pt-3">
          <div className="flex justify-center gap-6">
            {set.type !== 'timed' && (
              <NumberStepper
                label="Reps"
                value={reps}
                onChange={setReps}
                step={1}
                min={0}
              />
            )}
            {set.weight_kg !== null && (
              <NumberStepper
                label="Poids"
                value={weight}
                onChange={setWeight}
                step={2.5}
                min={0}
                unit="kg"
              />
            )}
            {set.type === 'timed' && set.duration_seconds && (
              <NumberStepper
                label="Durée (s)"
                value={set.duration_seconds}
                onChange={() => {}}
                step={5}
                min={0}
              />
            )}
          </div>

          <RpeInput value={rpe} onChange={setRpe} />

          {set.notes && (
            <p className="text-xs text-zinc-500 italic">{set.notes}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipSet(exerciseId, set.set_number)}
            >
              <SkipForward size={14} />
              Passer
            </Button>
            <Button
              fullWidth
              onClick={handleComplete}
            >
              <Check size={16} />
              Valider le set
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
