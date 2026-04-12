import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, Zap } from 'lucide-react'
import type { WorkoutExercise, SetLog } from '../../schemas'
import { SetRow } from './SetRow'

interface ExerciseCardProps {
  exercise: WorkoutExercise
  logs: Record<number, SetLog>
  isActiveExercise: boolean
  activeSetIndex: number
}

const CATEGORY_BADGE: Record<string, { label: string; className: string }> = {
  compound:  { label: 'Compound',  className: 'bg-warn/10 text-warn' },
  isolation: { label: 'Isolation', className: 'bg-purple-900/30 text-purple-400' },
  cardio:    { label: 'Cardio',    className: 'bg-lime/10 text-lime' },
  mobility:  { label: 'Mobilité',  className: 'bg-sky-900/30 text-sky-400' },
}

export function ExerciseCard({ exercise, logs, isActiveExercise, activeSetIndex }: ExerciseCardProps) {
  const [cuesOpen, setCuesOpen] = useState(false)

  const completedSets    = exercise.sets.filter((s) => logs[s.set_number]?.completed).length
  const totalWorkingSets = exercise.sets.filter((s) => s.type !== 'warmup').length
  const badge = CATEGORY_BADGE[exercise.category]

  return (
    <div className="space-y-3">
      {/* Exercise header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-condensed font-semibold tracking-wide ${badge.className}`}>
                {badge.label}
              </span>
            )}
            {totalWorkingSets > 0 && (
              <span className="text-[10px] font-condensed text-muted">
                {completedSets}/{totalWorkingSets} sets
              </span>
            )}
          </div>
          <h3 className="text-base font-condensed font-bold text-white tracking-wide leading-tight">
            {exercise.name}
          </h3>
          {exercise.muscle_groups_primary.length > 0 && (
            <p className="text-xs text-muted mt-0.5">{exercise.muscle_groups_primary.join(' · ')}</p>
          )}
        </div>

        {exercise.coaching_cues.length > 0 && (
          <button
            onClick={() => setCuesOpen((v) => !v)}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors flex-shrink-0 font-condensed ${
              cuesOpen
                ? 'bg-lime/10 text-lime'
                : 'text-faint hover:text-muted hover:bg-surface-2'
            }`}
          >
            <Lightbulb size={12} />
            Cues
            {cuesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Coaching cues */}
      {cuesOpen && exercise.coaching_cues.length > 0 && (
        <div className="bg-surface-2 border border-lime/20 rounded-xl p-3 space-y-1.5 animate-slide-up">
          {exercise.coaching_cues.map((cue, i) => (
            <div key={i} className="flex gap-2 text-sm text-[#EEEEFF]">
              <span className="text-lime flex-shrink-0 mt-0.5">·</span>
              <span>{cue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progression note */}
      {exercise.progression_note && (
        <div className="flex items-start gap-1.5 px-1">
          <Zap size={12} className="text-lime flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted italic">{exercise.progression_note}</p>
        </div>
      )}

      {/* Sets */}
      <div className="space-y-2">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.set_number}
            exerciseId={exercise.id}
            set={set}
            log={logs[set.set_number]}
            isActive={isActiveExercise}
            isCurrent={isActiveExercise && activeSetIndex === set.set_number - 1}
            category={exercise.category}
          />
        ))}
      </div>
    </div>
  )
}
