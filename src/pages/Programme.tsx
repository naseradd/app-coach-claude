import { Dumbbell, Clock, ChevronRight } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { WorkoutSession } from '../schemas'

const WEEKDAY_FR: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

const GOAL_FR: Record<string, string> = {
  strength: 'Force',
  hypertrophy: 'Hypertrophie',
  endurance: 'Endurance',
  mobility: 'Mobilité',
  general: 'Général',
}

export function Programme() {
  const { currentProgram } = useProgramStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<WorkoutSession | null>(null)

  if (!currentProgram) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center space-y-4">
        <Dumbbell size={48} className="text-zinc-700" />
        <p className="text-zinc-500 text-sm">Aucun programme chargé</p>
        <Button variant="secondary" onClick={() => navigate('/import')}>
          Importer un programme
        </Button>
      </div>
    )
  }

  if (selected) {
    return <SessionDetail session={selected} onBack={() => setSelected(null)} />
  }

  const { program, sessions } = currentProgram

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-24 space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{program.name}</h1>
          <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded-full">
            {GOAL_FR[program.goal] ?? program.goal}
          </span>
        </div>
        {program.notes && (
          <p className="text-sm text-zinc-500 mt-2">{program.notes}</p>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session, i) => {
          const totalSets = session.blocks.flatMap((b) =>
            b.exercises.flatMap((e) => e.sets.filter((s) => s.type !== 'warmup'))
          ).length
          const exercises = session.blocks.flatMap((b) => b.exercises)

          return (
            <Card key={session.id} className="p-4" onClick={() => setSelected(session)}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 flex-shrink-0">J{i + 1}</span>
                    <p className="font-medium text-white text-sm truncate">{session.name}</p>
                  </div>
                  {session.scheduled_weekday && (
                    <p className="text-xs text-zinc-500 mt-0.5">{WEEKDAY_FR[session.scheduled_weekday]}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-zinc-600 flex-shrink-0 mt-1" />
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {session.estimated_duration_minutes} min
                </span>
                <span>·</span>
                <span>{exercises.length} exercices</span>
                <span>·</span>
                <span>{totalSets} sets</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {session.blocks.map((b) => (
                  <span
                    key={b.id}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      b.type === 'superset'
                        ? 'bg-purple-900/40 text-purple-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <Button variant="secondary" size="sm" onClick={() => navigate('/import')}>
        Remplacer le programme
      </Button>
    </div>
  )
}

function SessionDetail({ session, onBack }: { session: WorkoutSession; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center gap-3">
        <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">←</button>
        <div>
          <h2 className="text-base font-semibold text-white">{session.name}</h2>
          <p className="text-xs text-zinc-500">~{session.estimated_duration_minutes} min</p>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4 space-y-4">
        {session.warmup && (
          <Card className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Échauffement · {session.warmup.duration_minutes} min</p>
            <p className="text-sm text-zinc-300">{session.warmup.instructions}</p>
          </Card>
        )}

        {session.blocks.map((block) => (
          <div key={block.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                block.type === 'superset' ? 'bg-purple-900/50 text-purple-300' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {block.type === 'superset' ? 'Superset' : 'Strength'}
              </span>
              <span className="text-sm font-medium text-zinc-200">{block.name}</span>
            </div>
            {block.notes && <p className="text-xs text-zinc-500">{block.notes}</p>}

            {block.exercises.map((ex) => (
              <Card key={ex.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white text-sm">{ex.name}</p>
                    {ex.muscle_groups_primary.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">{ex.muscle_groups_primary.join(', ')}</p>
                    )}
                  </div>
                  {ex.equipment.length > 0 && (
                    <p className="text-xs text-zinc-600">{ex.equipment.join(', ')}</p>
                  )}
                </div>

                <div className="space-y-1">
                  {ex.sets.map((s) => (
                    <div key={s.set_number} className="flex items-center gap-2 text-xs">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        s.type === 'warmup' ? 'bg-blue-900/50 text-blue-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>{s.set_number}</span>
                      <span className="text-zinc-400 w-14 flex-shrink-0 capitalize">{s.type}</span>
                      <span className="text-zinc-300">
                        {s.type === 'timed'
                          ? `${s.duration_seconds}s`
                          : s.type === 'amrap'
                          ? `Max × ${s.weight_kg ?? '—'} kg`
                          : s.reps_min && s.reps_max
                          ? `${s.reps_min}–${s.reps_max} × ${s.weight_kg ?? '—'} kg`
                          : `${s.reps ?? '—'} × ${s.weight_kg ?? '—'} kg`}
                      </span>
                      {s.rpe_target && (
                        <span className="text-zinc-600 ml-auto">RPE {s.rpe_target}</span>
                      )}
                      <span className="text-zinc-700 ml-auto">{s.rest_seconds}s</span>
                    </div>
                  ))}
                </div>

                {ex.coaching_cues.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800 space-y-1">
                    {ex.coaching_cues.map((cue, i) => (
                      <p key={i} className="text-xs text-zinc-500">· {cue}</p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}

        {session.cooldown && (
          <Card className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cooldown · {session.cooldown.duration_minutes} min</p>
            <p className="text-sm text-zinc-300">{session.cooldown.instructions}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
