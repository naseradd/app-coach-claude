import { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { useWorkoutStore } from '../../store/workout.store'
import { ExerciseCard } from './ExerciseCard'
import { RestTimer } from './RestTimer'
import { PostSessionView } from '../report/PostSessionView'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function WorkoutView() {
  const {
    phase,
    session,
    currentBlockIndex,
    currentExerciseIndex,
    currentSetIndex,
    setLogs,
    reset,
  } = useWorkoutStore()

  const [showAbandon, setShowAbandon] = useState(false)

  if (!session) return null
  if (phase === 'rest') return <RestTimer />
  if (phase === 'post_session' || phase === 'completed') return <PostSessionView />

  const block = session.blocks[currentBlockIndex]

  // Progress
  const totalSets = session.blocks.flatMap((b) =>
    b.exercises.flatMap((e) => e.sets.filter((s) => s.type !== 'warmup'))
  ).length
  const doneSets = Object.values(setLogs).flatMap((ex) =>
    Object.values(ex).filter((s) => s.completed && s.type !== 'warmup')
  ).length
  const progress = totalSets > 0 ? doneSets / totalSets : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold text-white">{session.name}</h1>
            <p className="text-xs text-zinc-500">
              Bloc {currentBlockIndex + 1}/{session.blocks.length} · {doneSets}/{totalSets} sets
            </p>
          </div>
          <button
            onClick={() => setShowAbandon(true)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Block title */}
      <div className="px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            block?.type === 'superset'
              ? 'bg-purple-900/50 text-purple-300'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {block?.type === 'superset' ? 'Superset' : 'Strength'}
          </span>
          <span className="text-sm font-medium text-zinc-300">{block?.name}</span>
        </div>
        {block?.notes && (
          <p className="text-xs text-zinc-500 mt-1">{block.notes}</p>
        )}
      </div>

      {/* Exercises */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-24">
        {block?.exercises.map((exercise, exerciseIndex) => (
          <div key={exercise.id}>
            {block.type === 'superset' && exerciseIndex > 0 && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-purple-800/30" />
                <span className="text-xs text-purple-400 font-medium">↕ Superset</span>
                <div className="flex-1 h-px bg-purple-800/30" />
              </div>
            )}
            <ExerciseCard
              exercise={exercise}
              logs={setLogs[exercise.id] ?? {}}
              isActiveExercise={currentExerciseIndex === exerciseIndex}
              activeSetIndex={currentSetIndex}
            />
          </div>
        ))}

        {/* Warmup / cooldown notes */}
        {currentBlockIndex === 0 && session.warmup && (
          <Card className="p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Échauffement</p>
            <p className="text-sm text-zinc-300">{session.warmup.instructions}</p>
          </Card>
        )}
      </div>

      {/* Next block button */}
      {block && block.exercises.every((e) =>
        e.sets.every((s) => setLogs[e.id]?.[s.set_number]?.completed || setLogs[e.id]?.[s.set_number]?.notes === 'skipped')
      ) && currentBlockIndex < session.blocks.length - 1 && (
        <div className="fixed bottom-20 left-0 right-0 px-4">
          <Button
            fullWidth
            size="lg"
            onClick={() => useWorkoutStore.setState({
              currentBlockIndex: currentBlockIndex + 1,
              currentExerciseIndex: 0,
              currentSetIndex: 0,
            })}
          >
            Bloc suivant
            <ChevronRight size={18} />
          </Button>
        </div>
      )}

      {/* Abandon confirm */}
      {showAbandon && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
          <Card className="w-full p-5 space-y-4">
            <h3 className="text-base font-semibold">Abandonner la séance ?</h3>
            <p className="text-sm text-zinc-400">La progression sera perdue.</p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowAbandon(false)}>
                Continuer
              </Button>
              <Button variant="danger" fullWidth onClick={() => { reset(); }}>
                Abandonner
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
