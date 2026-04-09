import { useEffect, useRef } from 'react'
import { Plus, SkipForward } from 'lucide-react'
import { useWorkoutStore } from '../../store/workout.store'
import { Button } from '../ui/Button'

export function RestTimer() {
  const { restRemaining, restSeconds, tickRest, skipRest, session, currentBlockIndex, currentExerciseIndex, currentSetIndex } =
    useWorkoutStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    // Request wake lock
    navigator.wakeLock?.request('screen').then((lock) => {
      wakeLockRef.current = lock
    }).catch(() => {})

    intervalRef.current = setInterval(() => {
      tickRest()
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  // Vibrate at 10s and 0s
  useEffect(() => {
    if (restRemaining === 10 || restRemaining === 0) {
      navigator.vibrate?.([200, 100, 200])
    }
  }, [restRemaining])

  const progress = restSeconds > 0 ? restRemaining / restSeconds : 0
  const minutes = Math.floor(restRemaining / 60)
  const seconds = restRemaining % 60
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Get next exercise info
  const block = session?.blocks[currentBlockIndex]
  const nextExercise = block?.exercises[currentExerciseIndex]
  const nextSet = nextExercise?.sets[currentSetIndex + 1] ?? nextExercise?.sets[currentSetIndex]

  // Circumference for SVG circle
  const radius = 100
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const urgentColor = restRemaining <= 10 ? '#ef4444' : restRemaining <= 30 ? '#f97316' : '#22c55e'

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 px-6">
      <p className="text-zinc-400 text-sm uppercase tracking-widest mb-8">Repos</p>

      {/* Circular timer */}
      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={urgentColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-6xl font-bold tabular-nums"
            style={{ color: urgentColor, transition: 'color 0.3s ease' }}
          >
            {timeStr}
          </span>
        </div>
      </div>

      {/* Next set preview */}
      {nextExercise && (
        <div className="text-center mb-8">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Prochain</p>
          <p className="text-zinc-200 text-sm font-medium">{nextExercise.name}</p>
          {nextSet && (
            <p className="text-zinc-400 text-xs mt-0.5">
              {nextSet.reps ? `${nextSet.reps} reps` : ''}
              {nextSet.weight_kg ? ` × ${nextSet.weight_kg} kg` : ''}
              {nextSet.rpe_target ? ` · RPE ${nextSet.rpe_target}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => useWorkoutStore.setState({ restRemaining: restRemaining + 30 })}
        >
          <Plus size={16} />
          30s
        </Button>
        <Button onClick={skipRest}>
          <SkipForward size={16} />
          Passer
        </Button>
      </div>
    </div>
  )
}
