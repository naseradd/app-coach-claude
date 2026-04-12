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
    phase, session,
    currentBlockIndex, currentExerciseIndex, currentSetIndex,
    setLogs, reset,
  } = useWorkoutStore()

  const [showAbandon, setShowAbandon] = useState(false)

  if (!session) return null
  if (phase === 'rest') return <RestTimer />
  if (phase === 'post_session' || phase === 'completed') return <PostSessionView />

  const block = session.blocks[currentBlockIndex]

  const totalSets = session.blocks.flatMap((b) =>
    b.exercises.flatMap((e) => e.sets.filter((s) => s.type !== 'warmup'))
  ).length
  const doneSets = Object.values(setLogs).flatMap((ex) =>
    Object.values(ex).filter((s) => s.completed && s.type !== 'warmup')
  ).length
  const progress = totalSets > 0 ? doneSets / totalSets : 0

  const allDoneInBlock = block?.exercises.every((e) =>
    e.sets.every((s) => setLogs[e.id]?.[s.set_number]?.completed || setLogs[e.id]?.[s.set_number]?.notes === 'skipped')
  )
  const hasNextBlock = currentBlockIndex < session.blocks.length - 1

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* ─── Header ─── */}
      <div className="px-4 pt-4 pb-3 border-b border-border bg-surface">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-display font-bold text-text tracking-wide">{session.name}</h1>
            <p className="text-xs text-muted font-condensed">
              Bloc {currentBlockIndex + 1}/{session.blocks.length} · {doneSets}/{totalSets} sets
            </p>
          </div>
          <button
            onClick={() => setShowAbandon(true)}
            className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* ─── Block badge ─── */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2 bg-surface">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-condensed font-semibold tracking-wide flex-shrink-0 ${
          block?.type === 'superset' ? 'bg-violet-100 text-violet-700' : 'bg-surface-2 text-muted'
        }`}>
          {block?.type === 'superset' ? 'Superset' : 'Strength'}
        </span>
        <span className="text-sm font-condensed font-semibold text-text">{block?.name}</span>
        {block?.notes && (
          <span className="text-xs text-muted truncate flex-1 text-right">{block.notes}</span>
        )}
      </div>

      {/* ─── Exercise list ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
        {block?.exercises.map((exercise, exerciseIndex) => (
          <div key={exercise.id}>
            {block.type === 'superset' && exerciseIndex > 0 && (
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-violet-100" />
                <span className="text-[10px] font-condensed tracking-wider text-violet-500 uppercase">Superset</span>
                <div className="flex-1 h-px bg-violet-100" />
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

        {currentBlockIndex === 0 && session.warmup && (
          <Card className="p-3">
            <p className="text-[10px] font-condensed tracking-widest uppercase text-green mb-1">Échauffement</p>
            <p className="text-sm text-text">{session.warmup.instructions}</p>
          </Card>
        )}
      </div>

      {/* ─── Next block button ─── */}
      {allDoneInBlock && hasNextBlock && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[390px] mx-auto px-4">
          <button
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-condensed font-bold text-base tracking-wide transition-all active:scale-[0.98] shadow-lg"
            onClick={() => useWorkoutStore.setState({
              currentBlockIndex: currentBlockIndex + 1,
              currentExerciseIndex: 0,
              currentSetIndex: 0,
            })}
          >
            Bloc suivant
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ─── Abandon confirm ─── */}
      {showAbandon && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <Card className="w-full p-5 space-y-4 max-w-lg animate-slide-up">
            <h3 className="text-base font-display font-bold text-text tracking-wide">Abandonner la séance ?</h3>
            <p className="text-sm text-muted">La progression sera perdue.</p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowAbandon(false)}>
                Continuer
              </Button>
              <Button variant="danger" fullWidth onClick={() => { reset() }}>
                Abandonner
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
