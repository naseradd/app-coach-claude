import { useState } from 'react'
import { Play, Upload, Zap } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { useWorkoutStore } from '../store/workout.store'
import { WorkoutView } from '../components/workout/WorkoutView'
import { Card } from '../components/ui/Card'
import type { WorkoutSession } from '../schemas'
import { useNavigate } from 'react-router-dom'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const WEEKDAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

export function Today() {
  const { currentProgram } = useProgramStore()
  const { phase, startSession } = useWorkoutStore()
  const [energyLevel,    setEnergyLevel]    = useState<number | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [pickingSession, setPickingSession]  = useState(false)
  const navigate = useNavigate()

  if (phase === 'active' || phase === 'rest' || phase === 'post_session' || phase === 'completed') {
    return <WorkoutView />
  }

  const now  = new Date()
  const dateLabel = `${WEEKDAY_FR[now.getDay()]} ${now.getDate()} ${MONTH_FR[now.getMonth()]}`

  if (!currentProgram) {
    return (
      <div className="flex flex-col flex-1 px-5 pt-10 pb-32">
        {/* Date */}
        <p className="text-xs font-condensed tracking-widest uppercase text-muted mb-8">{dateLabel}</p>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-edge flex items-center justify-center">
            <Zap size={32} className="text-faint" />
          </div>
          <div>
            <h2 className="font-condensed text-2xl font-bold text-white mb-2 tracking-wide">Aucun programme</h2>
            <p className="text-sm text-muted max-w-xs">Importe un programme JSON généré par Claude pour démarrer.</p>
          </div>
          <button
            onClick={() => navigate('/import')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-lime text-[#08080F] font-condensed font-bold text-base tracking-wide transition-all active:scale-[0.97] hover:bg-lime-bright"
          >
            <Upload size={18} />
            Importer un programme
          </button>
        </div>
      </div>
    )
  }

  const today = WEEKDAYS[now.getDay()]
  const todaySession = currentProgram.sessions.find((s) => s.scheduled_weekday === today)
  const sessionToUse = selectedSession ?? todaySession

  if (pickingSession) {
    return (
      <div className="flex flex-col flex-1 px-4 pt-6 pb-28 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setPickingSession(false)}
            className="text-muted hover:text-white transition-colors text-sm font-condensed"
          >
            ← Retour
          </button>
          <h2 className="text-base font-condensed font-bold text-white tracking-wide">Choisir une séance</h2>
        </div>
        {currentProgram.sessions.map((s) => {
          const totalSets = s.blocks.flatMap((b) => b.exercises.flatMap((e) => e.sets.filter((set) => set.type !== 'warmup'))).length
          return (
            <Card
              key={s.id}
              className="p-4"
              onClick={() => { setSelectedSession(s); setPickingSession(false) }}
            >
              <p className="font-condensed font-bold text-white text-base tracking-wide">{s.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {s.scheduled_weekday && (
                  <span className="text-xs text-muted capitalize font-condensed">{s.scheduled_weekday}</span>
                )}
                <span className="text-xs text-faint">·</span>
                <span className="text-xs text-muted font-condensed">
                  {s.blocks.length} blocs · {totalSets} sets · ~{s.estimated_duration_minutes} min
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-28 space-y-6">
      {/* Date + program */}
      <div>
        <p className="text-[10px] font-condensed tracking-[0.25em] uppercase text-muted mb-1">{dateLabel}</p>
        <h1 className="font-condensed font-bold text-2xl text-white tracking-wide leading-tight">
          {currentProgram.program.name}
        </h1>
      </div>

      {/* Session card */}
      <div>
        <p className="text-[10px] font-condensed tracking-widest uppercase text-muted mb-3">
          {selectedSession ? 'Séance sélectionnée' : "Aujourd'hui"}
        </p>

        {sessionToUse ? (
          <Card className="p-4 space-y-4" highlight>
            <div>
              <h2 className="font-condensed font-bold text-xl text-white tracking-wide">{sessionToUse.name}</h2>
              <p className="text-sm text-muted mt-1 font-condensed">
                {sessionToUse.blocks.reduce((a, b) => a + b.exercises.length, 0)} exercices
                {' · '}{sessionToUse.blocks.length} blocs
                {' · '}~{sessionToUse.estimated_duration_minutes} min
              </p>
            </div>

            {/* Blocks preview */}
            <div className="space-y-1.5">
              {sessionToUse.blocks.map((block) => (
                <div key={block.id} className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-condensed font-semibold tracking-wide flex-shrink-0 ${
                    block.type === 'superset' ? 'bg-purple-900/30 text-purple-400' : 'bg-surface-2 text-faint'
                  }`}>
                    {block.type === 'superset' ? 'Superset' : 'Strength'}
                  </span>
                  <span className="text-sm text-[#EEEEFF] font-condensed truncate">{block.name}</span>
                  <span className="text-xs text-faint ml-auto flex-shrink-0 font-condensed">
                    {block.exercises.map((e) => e.name).join(', ').slice(0, 28)}
                    {block.exercises.map((e) => e.name).join(', ').length > 28 ? '…' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Energy selector */}
            <div className="border-t border-edge pt-3 space-y-2">
              <p className="text-[10px] font-condensed tracking-widest uppercase text-muted">Énergie (optionnel)</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <button
                    key={v}
                    onClick={() => setEnergyLevel(energyLevel === v ? null : v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-condensed font-bold transition-all active:scale-95 ${
                      energyLevel === v
                        ? 'bg-lime text-[#08080F]'
                        : 'bg-surface-2 text-faint hover:text-muted border border-edge'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={() => startSession(currentProgram, sessionToUse, energyLevel)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-lime text-[#08080F] font-condensed font-bold text-lg tracking-wide transition-all active:scale-[0.98] hover:bg-lime-bright animate-pulse-lime"
            >
              <Play size={20} fill="currentColor" />
              Démarrer la séance
            </button>
          </Card>
        ) : (
          <Card className="p-8 text-center space-y-3">
            <div className="text-3xl">😴</div>
            <p className="text-sm text-muted font-condensed">Aucune séance prévue aujourd'hui</p>
          </Card>
        )}
      </div>

      <button
        onClick={() => setPickingSession(true)}
        className="text-sm font-condensed text-muted hover:text-white transition-colors py-1"
      >
        {sessionToUse ? '↺ Changer de séance' : '+ Choisir une séance'}
      </button>
    </div>
  )
}
