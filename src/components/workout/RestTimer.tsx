import { useEffect, useRef } from 'react'
import { Plus, SkipForward } from 'lucide-react'
import { useWorkoutStore } from '../../store/workout.store'

export function RestTimer() {
  const {
    restRemaining, restSeconds, tickRest, skipRest,
    session, currentBlockIndex, currentExerciseIndex, currentSetIndex,
  } = useWorkoutStore()

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef  = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    navigator.wakeLock?.request('screen').then((l) => { wakeLockRef.current = l }).catch(() => {})
    intervalRef.current = setInterval(() => { tickRest() }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (restRemaining === 10 || restRemaining === 0) {
      navigator.vibrate?.([200, 100, 200])
    }
  }, [restRemaining])

  const progress      = restSeconds > 0 ? restRemaining / restSeconds : 0
  const minutes       = Math.floor(restRemaining / 60)
  const seconds       = restRemaining % 60
  const timeStr       = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const urgent = restRemaining <= 10
  const soon   = restRemaining <= 30 && !urgent

  const ringColor = urgent ? '#DC2626' : soon ? '#D97706' : '#059669'

  const radius        = 110
  const circumference = 2 * Math.PI * radius
  const dashOffset    = circumference * (1 - progress)

  const block        = session?.blocks[currentBlockIndex]
  const nextExercise = block?.exercises[currentExerciseIndex]
  const nextSet      = nextExercise?.sets[currentSetIndex]

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-50 px-6" style={{ minHeight: '100dvh' }}>
      {/* Label */}
      <p className="font-condensed text-xs tracking-[0.25em] uppercase text-[#6B6B6B] mb-6">Repos</p>

      {/* Ring + timer */}
      <div className="relative w-72 h-72 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r={radius} fill="none" stroke="#1E1E1E" strokeWidth="6" />
          <circle
            cx="130" cy="130" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s linear, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className="font-display text-7xl tabular-nums leading-none"
            style={{ color: ringColor, transition: 'color 0.4s ease' }}
          >
            {timeStr}
          </span>
          <span className="text-xs font-condensed text-[#6B6B6B] tracking-wider uppercase">
            {restSeconds}s total
          </span>
        </div>
      </div>

      {/* Next set preview */}
      {nextExercise && (
        <div className="text-center mb-10 space-y-1">
          <p className="text-[10px] font-condensed tracking-[0.2em] uppercase text-[#444]">Suivant</p>
          <p className="text-base font-condensed font-bold text-white">{nextExercise.name}</p>
          {nextSet && (
            <p className="text-xs text-[#6B6B6B]">
              {nextSet.duration_seconds
                ? `${nextSet.duration_seconds}s`
                : nextSet.reps
                ? `${nextSet.reps} reps`
                : ''}
              {nextSet.weight_kg ? ` × ${nextSet.weight_kg} kg` : ''}
              {nextSet.rpe_target ? ` · RPE ${nextSet.rpe_target}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => useWorkoutStore.setState({ restRemaining: restRemaining + 30 })}
          className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#444] text-[#6B6B6B] hover:text-white font-condensed text-sm tracking-wide transition-all active:scale-95"
        >
          <Plus size={15} />
          +30s
        </button>
        <button
          onClick={skipRest}
          className="flex items-center gap-1.5 px-6 py-3 rounded-full bg-white text-[#0A0A0A] font-condensed font-bold text-sm tracking-wide transition-all active:scale-95"
        >
          <SkipForward size={15} />
          Passer
        </button>
      </div>
    </div>
  )
}
