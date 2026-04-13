import { useState, useEffect } from 'react'
import { Play, Upload, Zap, CheckCircle2 } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { useWorkoutStore } from '../store/workout.store'
import { WorkoutView } from '../components/workout/WorkoutView'
import { Card } from '../components/ui/Card'
import type { WorkoutSession, SessionReport } from '../schemas'
import { useNavigate } from 'react-router-dom'
import { getAllReports } from '../db'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const WEEKDAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

export function Today() {
  const { currentProgram } = useProgramStore()
  const { phase, startSession } = useWorkoutStore()
  const [energyLevel,    setEnergyLevel]    = useState<number | null>(null)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [pickingSession, setPickingSession]  = useState(false)
  const [reports, setReports] = useState<SessionReport[]>([])
  const navigate = useNavigate()

  useEffect(() => { getAllReports().then(setReports) }, [])

  if (phase === 'active' || phase === 'rest' || phase === 'post_session' || phase === 'completed') {
    return <WorkoutView />
  }

  const now  = new Date()
  const dateLabel = `${WEEKDAY_FR[now.getDay()]} ${now.getDate()} ${MONTH_FR[now.getMonth()]}`

  if (!currentProgram) {
    return (
      <div className="flex flex-col flex-1 px-5 pt-10 bg-bg" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        <p className="text-xs font-condensed tracking-widest uppercase text-muted mb-8">{dateLabel}</p>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-surface border border-border shadow-sm flex items-center justify-center">
            <Zap size={32} className="text-faint" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-text mb-2" style={{ fontWeight: 800 }}>Aucun programme</h2>
            <p className="text-sm text-muted max-w-xs">Importe un programme JSON généré par Claude pour démarrer.</p>
          </div>
          <button
            onClick={() => navigate('/import')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent text-white font-condensed font-bold text-base tracking-wide transition-all active:scale-[0.97] hover:bg-[#2a2a2a] shadow-sm"
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
    // Sessions not yet done come first
    const doneCountBySession = reports.reduce<Record<string, number>>((acc, r) => {
      acc[r.session_id] = (acc[r.session_id] ?? 0) + 1
      return acc
    }, {})
    const sorted = [...currentProgram.sessions].sort((a, b) => {
      const da = doneCountBySession[a.id] ?? 0
      const db = doneCountBySession[b.id] ?? 0
      return da - db
    })

    return (
      <div className="flex flex-col flex-1 px-4 pt-6 bg-bg space-y-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setPickingSession(false)}
            className="text-muted hover:text-text transition-colors text-sm font-condensed"
          >
            ← Retour
          </button>
          <h2 className="text-base font-display font-bold text-text tracking-wide">Choisir une séance</h2>
        </div>
        {sorted.map((s) => {
          const doneCount = doneCountBySession[s.id] ?? 0
          const totalSets = s.blocks.flatMap((b) => b.exercises.flatMap((e) => e.sets.filter((set) => set.type !== 'warmup'))).length
          return (
            <Card
              key={s.id}
              className="p-4"
              onClick={() => { setSelectedSession(s); setPickingSession(false) }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-display font-bold text-text text-base tracking-wide">{s.name}</p>
                {doneCount > 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-condensed text-muted bg-surface-2 border border-border px-1.5 py-0.5 rounded flex-shrink-0">
                    <CheckCircle2 size={9} className="text-green" />
                    {doneCount}×
                  </span>
                ) : (
                  <span className="text-[10px] font-condensed text-green bg-green-lt border border-green/20 px-1.5 py-0.5 rounded flex-shrink-0">
                    Non faite
                  </span>
                )}
              </div>
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
    <div className="flex flex-col flex-1 px-4 pt-6 bg-bg space-y-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Date + program */}
      <div>
        <p className="text-[10px] font-condensed tracking-[0.25em] uppercase text-muted mb-1">{dateLabel}</p>
        <h1 className="font-display text-2xl text-text tracking-wide leading-tight" style={{ fontWeight: 800 }}>
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
              <h2 className="font-display font-bold text-xl text-text tracking-wide">{sessionToUse.name}</h2>
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
                    block.type === 'superset' ? 'bg-violet-100 text-violet-700' : 'bg-surface-2 text-muted'
                  }`}>
                    {block.type === 'superset' ? 'Superset' : 'Strength'}
                  </span>
                  <span className="text-sm text-text font-condensed truncate">{block.name}</span>
                  <span className="text-xs text-faint ml-auto flex-shrink-0 font-condensed">
                    {block.exercises.map((e) => e.name).join(', ').slice(0, 28)}
                    {block.exercises.map((e) => e.name).join(', ').length > 28 ? '…' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Energy selector */}
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-[10px] font-condensed tracking-widest uppercase text-muted">Énergie (optionnel)</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <button
                    key={v}
                    onClick={() => setEnergyLevel(energyLevel === v ? null : v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-condensed font-bold transition-all active:scale-95 ${
                      energyLevel === v
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 text-muted hover:text-text border border-border'
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
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent text-white font-condensed font-bold text-lg tracking-wide transition-all active:scale-[0.98] hover:bg-[#2a2a2a] shadow-sm animate-pulse-accent"
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
        className="text-sm font-condensed text-muted hover:text-text transition-colors py-1"
      >
        {sessionToUse ? '↺ Changer de séance' : '+ Choisir une séance'}
      </button>
    </div>
  )
}
