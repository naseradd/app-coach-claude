import { useState } from 'react'
import { Play, Calendar, Dumbbell } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { useWorkoutStore } from '../store/workout.store'
import { WorkoutView } from '../components/workout/WorkoutView'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import type { WorkoutSession } from '../schemas'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function Today() {
  const { currentProgram } = useProgramStore()
  const { phase, startSession } = useWorkoutStore()
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [pickingSession, setPickingSession] = useState(false)

  if (phase === 'active' || phase === 'rest' || phase === 'post_session' || phase === 'completed') {
    return <WorkoutView />
  }

  if (!currentProgram) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center space-y-4">
        <Dumbbell size={48} className="text-zinc-700" />
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Aucun programme</h2>
          <p className="text-sm text-zinc-500">Importe un programme généré par Claude pour commencer.</p>
        </div>
        <Button variant="secondary" onClick={() => window.location.href = '#/import'}>
          Importer un programme
        </Button>
      </div>
    )
  }

  const today = WEEKDAYS[new Date().getDay()]
  const todaySession = currentProgram.sessions.find(
    (s) => s.scheduled_weekday === today
  )
  const sessionToUse = selectedSession ?? todaySession

  function handleStart() {
    if (!sessionToUse || !currentProgram) return
    startSession(currentProgram, sessionToUse, energyLevel)
  }

  if (pickingSession) {
    return (
      <div className="flex flex-col flex-1 px-4 py-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Choisir une séance</h2>
        {currentProgram.sessions.map((s) => (
          <Card
            key={s.id}
            className="p-4"
            onClick={() => {
              setSelectedSession(s)
              setPickingSession(false)
            }}
          >
            <p className="font-medium text-white">{s.name}</p>
            {s.scheduled_weekday && (
              <p className="text-xs text-zinc-500 capitalize mt-0.5">{s.scheduled_weekday}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              {s.blocks.length} blocs · ~{s.estimated_duration_minutes} min
            </p>
          </Card>
        ))}
        <Button variant="ghost" onClick={() => setPickingSession(false)}>Annuler</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-8 space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Programme</p>
        <h1 className="text-xl font-bold text-white">{currentProgram.program.name}</h1>
      </div>

      {/* Today's session */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
          {selectedSession ? 'Séance sélectionnée' : "Aujourd'hui"}
        </p>

        {sessionToUse ? (
          <Card className="p-4 space-y-3">
            <div>
              <h2 className="text-base font-semibold text-white">{sessionToUse.name}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {sessionToUse.blocks.length} blocs ·{' '}
                {sessionToUse.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} exercices · ~{sessionToUse.estimated_duration_minutes} min
              </p>
            </div>

            {/* Block preview */}
            <div className="space-y-2">
              {sessionToUse.blocks.map((block) => (
                <div key={block.id} className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                    block.type === 'superset' ? 'bg-purple-900/50 text-purple-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {block.type === 'superset' ? 'Superset' : 'Strength'}
                  </span>
                  <span className="text-sm text-zinc-400 truncate">{block.name}</span>
                  <span className="text-xs text-zinc-600 ml-auto flex-shrink-0">
                    {block.exercises.map((e) => e.name).join(', ').slice(0, 30)}
                    {block.exercises.map((e) => e.name).join(', ').length > 30 ? '…' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Energy level */}
            <div className="border-t border-zinc-800 pt-3">
              <p className="text-xs text-zinc-500 mb-2">Niveau d'énergie (optionnel)</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <button
                    key={v}
                    onClick={() => setEnergyLevel(energyLevel === v ? null : v)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      energyLevel === v
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handleStart}>
              <Play size={18} />
              Démarrer la séance
            </Button>
          </Card>
        ) : (
          <Card className="p-4 text-center">
            <Calendar size={32} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Aucune séance prévue aujourd'hui</p>
          </Card>
        )}
      </div>

      <Button variant="secondary" size="sm" onClick={() => setPickingSession(true)}>
        {sessionToUse ? 'Changer de séance' : 'Choisir une séance'}
      </Button>
    </div>
  )
}
