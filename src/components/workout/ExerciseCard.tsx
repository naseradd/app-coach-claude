import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import type { WorkoutExercise } from '../../schemas'
import type { SetLog } from '../../schemas'
import { SetRow } from './SetRow'

interface ExerciseCardProps {
  exercise: WorkoutExercise
  logs: Record<number, SetLog>
  isActiveExercise: boolean
  activeSetIndex: number
}

export function ExerciseCard({ exercise, logs, isActiveExercise, activeSetIndex }: ExerciseCardProps) {
  const [cuesOpen, setCuesOpen] = useState(false)

  const completedSets = exercise.sets.filter((s) => logs[s.set_number]?.completed).length
  const totalWorkingSets = exercise.sets.filter((s) => s.type !== 'warmup').length

  return (
    <div className="space-y-2">
      {/* Exercise header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{exercise.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {exercise.muscle_groups_primary.length > 0 && (
              <span className="text-xs text-zinc-500">
                {exercise.muscle_groups_primary.join(', ')}
              </span>
            )}
            {totalWorkingSets > 0 && (
              <span className="text-xs text-zinc-600">
                · {completedSets}/{totalWorkingSets} sets
              </span>
            )}
          </div>
        </div>

        {exercise.coaching_cues.length > 0 && (
          <button
            onClick={() => setCuesOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-400 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            <Lightbulb size={13} />
            Cues
            {cuesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Coaching cues */}
      {cuesOpen && exercise.coaching_cues.length > 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 space-y-1">
          {exercise.coaching_cues.map((cue, i) => (
            <div key={i} className="flex gap-2 text-sm text-zinc-300">
              <span className="text-orange-400 flex-shrink-0">·</span>
              <span>{cue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progression note */}
      {exercise.progression_note && (
        <p className="text-xs text-zinc-500 italic px-1">{exercise.progression_note}</p>
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
          />
        ))}
      </div>
    </div>
  )
}
