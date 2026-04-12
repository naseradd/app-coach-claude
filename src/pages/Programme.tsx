import { Clock, ChevronRight, ArrowLeft, Upload, Zap } from 'lucide-react'
import { useProgramStore } from '../store/program.store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { WorkoutSession } from '../schemas'

const WEEKDAY_FR: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
  friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
}

const GOAL_FR: Record<string, string> = {
  strength: 'Force', hypertrophy: 'Hypertrophie', endurance: 'Endurance',
  mobility: 'Mobilité', general: 'Général',
}

export function Programme() {
  const { currentProgram } = useProgramStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<WorkoutSession | null>(null)

  if (!currentProgram) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center space-y-5 bg-bg">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center">
          <Zap size={28} className="text-faint" />
        </div>
        <div>
          <p className="font-display font-bold text-text tracking-wide text-xl">Aucun programme</p>
          <p className="text-sm text-muted mt-1 font-condensed">Importe un programme pour commencer.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/import')}>
          <Upload size={15} />
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
    <div className="flex flex-col flex-1 px-4 pt-6 bg-bg space-y-5" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display font-bold text-2xl text-text tracking-wide leading-tight flex-1" style={{ fontWeight: 800 }}>
            {program.name}
          </h1>
          <span className="text-[10px] px-2 py-1 rounded-full bg-surface-2 border border-border text-muted font-condensed font-semibold tracking-wide flex-shrink-0 mt-1">
            {GOAL_FR[program.goal] ?? program.goal}
          </span>
        </div>
        {program.notes && (
          <p className="text-sm text-muted mt-2 font-condensed leading-relaxed">{program.notes}</p>
        )}
      </div>

      {/* Session list */}
      <div className="space-y-2.5">
        {sessions.map((session, i) => {
          const totalSets = session.blocks.flatMap((b) =>
            b.exercises.flatMap((e) => e.sets.filter((s) => s.type !== 'warmup'))
          ).length
          const exercises = session.blocks.flatMap((b) => b.exercises)

          return (
            <Card key={session.id} className="p-4" onClick={() => setSelected(session)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-condensed font-bold text-muted bg-surface-2 border border-border px-1.5 py-0.5 rounded">
                      J{i + 1}
                    </span>
                    {session.scheduled_weekday && (
                      <span className="text-[10px] font-condensed text-muted">
                        {WEEKDAY_FR[session.scheduled_weekday]}
                      </span>
                    )}
                  </div>
                  <p className="font-display font-bold text-text tracking-wide truncate">{session.name}</p>
                </div>
                <ChevronRight size={15} className="text-faint flex-shrink-0 mt-1" />
              </div>

              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted font-condensed">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {session.estimated_duration_minutes} min
                </span>
                <span className="text-faint">·</span>
                <span>{exercises.length} exercices</span>
                <span className="text-faint">·</span>
                <span>{totalSets} sets</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {session.blocks.map((b) => (
                  <span key={b.id} className={`text-[10px] px-2 py-0.5 rounded-full font-condensed font-semibold ${
                    b.type === 'superset' ? 'bg-violet-100 text-violet-600' : 'bg-surface-2 text-muted'
                  }`}>
                    {b.name}
                  </span>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>
        <Upload size={13} />
        Remplacer le programme
      </Button>
    </div>
  )
}

function SessionDetail({ session, onBack }: { session: WorkoutSession; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 bg-bg" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-4 pt-4 pb-3 border-b border-border bg-surface flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 className="font-display font-bold text-text tracking-wide">{session.name}</h2>
          <p className="text-xs text-muted font-condensed">~{session.estimated_duration_minutes} min</p>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4 space-y-4">
        {session.warmup && (
          <Card className="p-4">
            <p className="text-[10px] font-condensed tracking-widest uppercase text-green mb-2">
              Échauffement · {session.warmup.duration_minutes} min
            </p>
            <p className="text-sm text-text font-condensed">{session.warmup.instructions}</p>
          </Card>
        )}

        {session.blocks.map((block) => (
          <div key={block.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-condensed font-semibold ${
                block.type === 'superset' ? 'bg-violet-100 text-violet-600' : 'bg-surface-2 text-muted'
              }`}>
                {block.type === 'superset' ? 'Superset' : 'Strength'}
              </span>
              <span className="text-sm font-condensed font-semibold text-text">{block.name}</span>
            </div>
            {block.notes && <p className="text-xs text-muted font-condensed">{block.notes}</p>}

            {block.exercises.map((ex) => (
              <Card key={ex.id} className="p-4">
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <p className="font-display font-bold text-text tracking-wide">{ex.name}</p>
                    {ex.muscle_groups_primary.length > 0 && (
                      <p className="text-xs text-muted mt-0.5 font-condensed">{ex.muscle_groups_primary.join(' · ')}</p>
                    )}
                  </div>
                  {ex.equipment.length > 0 && (
                    <p className="text-[11px] text-faint font-condensed">{ex.equipment.join(', ')}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  {ex.sets.map((s) => (
                    <div key={s.set_number} className="flex items-center gap-2 text-xs font-condensed">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        s.type === 'warmup' ? 'bg-sky-100 text-sky-600' : 'bg-surface-2 text-muted'
                      }`}>{s.set_number}</span>
                      <span className="text-muted w-14 flex-shrink-0 capitalize">{s.type}</span>
                      <span className="text-text">
                        {s.type === 'timed'
                          ? `${s.duration_seconds}s`
                          : s.type === 'amrap'
                          ? `Max × ${s.weight_kg ?? '—'} kg`
                          : s.reps_min && s.reps_max
                          ? `${s.reps_min}–${s.reps_max} × ${s.weight_kg ?? '—'} kg`
                          : `${s.reps ?? '—'} × ${s.weight_kg ?? '—'} kg`}
                      </span>
                      {s.rpe_target && (
                        <span className="text-muted ml-auto">RPE {s.rpe_target}</span>
                      )}
                      <span className="text-faint">{s.rest_seconds}s</span>
                    </div>
                  ))}
                </div>

                {ex.coaching_cues.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border space-y-1">
                    {ex.coaching_cues.map((cue, i) => (
                      <p key={i} className="text-xs text-muted font-condensed">· {cue}</p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}

        {session.cooldown && (
          <Card className="p-4">
            <p className="text-[10px] font-condensed tracking-widest uppercase text-green mb-2">
              Cooldown · {session.cooldown.duration_minutes} min
            </p>
            <p className="text-sm text-text font-condensed">{session.cooldown.instructions}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
