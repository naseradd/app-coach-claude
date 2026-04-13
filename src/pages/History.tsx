import { useEffect, useState } from 'react'
import { Clock, TrendingUp, CheckCircle, Share2, ChevronRight, BarChart2, ArrowLeft, Trash2 } from 'lucide-react'
import { getAllReports, deleteReport } from '../db'
import { useProgramStore } from '../store/program.store'
import { buildCoachingContext } from '../utils/exportContext'
import type { SessionReport } from '../schemas'
import { Card } from '../components/ui/Card'

export function History() {
  const { currentProgram } = useProgramStore()
  const [reports,  setReports]  = useState<SessionReport[]>([])
  const [selected, setSelected] = useState<SessionReport | null>(null)
  const [copyMsg,  setCopyMsg]  = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => { getAllReports().then(setReports) }, [])

  function copyExport() {
    const ctx = buildCoachingContext(currentProgram, reports)
    navigator.clipboard.writeText(JSON.stringify(ctx, null, 2))
    setCopyMsg('Contexte copié')
    setTimeout(() => setCopyMsg(null), 2000)
  }

  async function handleDelete(id: string) {
    await deleteReport(id)
    setReports((prev) => prev.filter((r) => r.id !== id))
    setConfirmDeleteId(null)
    if (selected?.id === id) setSelected(null)
  }

  if (selected) {
    return (
      <ReportDetail
        report={selected}
        onBack={() => setSelected(null)}
        onDelete={() => handleDelete(selected.id)}
      />
    )
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 bg-bg space-y-5" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-text tracking-wide" style={{ fontWeight: 800 }}>Historique</h1>
        {reports.length > 0 && (
          <button
            onClick={copyExport}
            className="w-9 h-9 rounded-xl bg-surface border border-border shadow-sm flex items-center justify-center text-muted hover:text-text transition-colors"
            title="Copier contexte pour Claude"
          >
            <Share2 size={15} />
          </button>
        )}
      </div>

      {copyMsg && (
        <div className="text-xs px-3 py-2.5 rounded-xl font-condensed bg-green-lt text-green border border-green/20">
          {copyMsg}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 py-20">
          <BarChart2 size={44} className="text-faint" strokeWidth={1.5} />
          <div>
            <p className="font-display font-bold text-text tracking-wide">Aucune séance enregistrée</p>
            <p className="text-sm text-muted mt-1 font-condensed">Tes performances apparaîtront ici.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const date = new Date(r.started_at)
            const pct  = Math.round(r.completion_rate * 100)
            const vol  = r.volume_summary.total_volume_kg
            const isConfirming = confirmDeleteId === r.id

            return (
              <div key={r.id} className="relative">
                <Card className="p-4" onClick={() => !isConfirming && setSelected(r)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-text tracking-wide truncate">{r.session_name}</p>
                      <p className="text-xs text-muted mt-0.5 font-condensed">
                        {date.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{r.duration_actual_minutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(isConfirming ? null : r.id) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-faint hover:text-red transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      {!isConfirming && <ChevronRight size={15} className="text-faint" />}
                    </div>
                  </div>

                  {/* Inline delete confirm */}
                  {isConfirming && (
                    <div className="flex gap-2 mt-3 animate-slide-up">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                        className="flex-1 py-2 rounded-lg bg-surface-2 border border-border text-xs font-condensed font-semibold text-muted transition-all active:scale-95"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }}
                        className="flex-1 py-2 rounded-lg bg-red text-white text-xs font-condensed font-semibold transition-all active:scale-95"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}

                  {!isConfirming && (
                    <>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-condensed mb-1">
                            <span className="text-faint tracking-wide uppercase">Complétion</span>
                            <span className={pct >= 80 ? 'text-green' : 'text-orange'}>{pct}%</span>
                          </div>
                          <div className="h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green' : 'bg-orange'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        {vol > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="font-condensed font-bold text-sm text-text">{vol.toLocaleString()} <span className="text-faint font-normal text-xs">kg</span></p>
                          </div>
                        )}
                      </div>

                      {r.post_session.overall_feeling !== null && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <CheckCircle size={11} className="text-green" />
                          <span className="text-[11px] text-muted font-condensed">Ressenti {r.post_session.overall_feeling}/10</span>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReportDetail({ report, onBack, onDelete }: { report: SessionReport; onBack: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="flex flex-col flex-1 bg-bg" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-4 pt-4 pb-3 border-b border-border bg-surface flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-text tracking-wide truncate">{report.session_name}</h2>
          <p className="text-xs text-muted font-condensed">
            {new Date(report.started_at).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-red transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Delete confirm bar */}
      {confirmDelete && (
        <div className="px-4 py-3 bg-red-lt border-b border-red/20 flex items-center gap-3 animate-slide-up">
          <p className="text-xs font-condensed text-red flex-1">Supprimer cette séance ?</p>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-condensed font-semibold text-muted transition-all active:scale-95"
          >
            Annuler
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg bg-red text-white text-xs font-condensed font-semibold transition-all active:scale-95"
          >
            Supprimer
          </button>
        </div>
      )}

      <div className="overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Durée',      value: `${report.duration_actual_minutes}`, unit: 'min', icon: Clock },
            { label: 'Complétion', value: `${Math.round(report.completion_rate * 100)}`, unit: '%',  icon: CheckCircle },
            { label: 'Volume',     value: report.volume_summary.total_volume_kg.toLocaleString(), unit: 'kg', icon: TrendingUp },
          ].map(({ label, value, unit, icon: Icon }) => (
            <Card key={label} className="p-3 text-center">
              <Icon size={14} className="text-green mx-auto mb-1.5" strokeWidth={2} />
              <p className="font-display font-bold text-text text-lg tabular-nums">{value}</p>
              <p className="text-[10px] text-faint font-condensed">{unit} · {label}</p>
            </Card>
          ))}
        </div>

        {/* Feeling */}
        {(report.pre_session.energy_level !== null || report.post_session.overall_feeling !== null) && (
          <Card className="p-4 space-y-2.5">
            {report.pre_session.energy_level !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted font-condensed">Énergie avant</span>
                <span className="text-text font-condensed font-bold">{report.pre_session.energy_level}/10</span>
              </div>
            )}
            {report.post_session.overall_feeling !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted font-condensed">Ressenti global</span>
                <span className="text-text font-condensed font-bold">{report.post_session.overall_feeling}/10</span>
              </div>
            )}
            {report.post_session.notes && (
              <p className="text-xs text-muted italic pt-2 border-t border-border">{report.post_session.notes}</p>
            )}
          </Card>
        )}

        {/* Exercise logs */}
        {report.exercises_log.map((ex) => {
          const workingSets = ex.sets_log.filter((s) => s.type !== 'warmup')
          const doneSets    = workingSets.filter((s) => s.completed)
          const totalVol    = doneSets.reduce((acc, s) => acc + (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0), 0)

          return (
            <Card key={ex.exercise_id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-display font-bold text-text tracking-wide">{ex.exercise_name}</p>
                <span className="text-xs text-muted font-condensed">{doneSets.length}/{workingSets.length} sets</span>
              </div>
              <div className="space-y-1.5">
                {ex.sets_log.map((s) => (
                  <div key={s.set_number} className={`flex items-center gap-2 text-xs font-condensed ${!s.completed ? 'opacity-35' : ''}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      s.completed ? 'bg-green-lt text-green' : 'bg-surface-2 text-faint'
                    }`}>{s.set_number}</span>
                    <span className="text-muted w-14 flex-shrink-0 capitalize">{s.type}</span>
                    <span className="text-text">
                      {s.actual_reps ?? '—'} × {s.actual_weight_kg ?? '—'} kg
                    </span>
                    {s.rpe_actual && (
                      <span className="text-muted ml-auto">RPE {s.rpe_actual}</span>
                    )}
                  </div>
                ))}
              </div>
              {totalVol > 0 && (
                <p className="text-xs text-muted mt-2.5 pt-2.5 border-t border-border text-right font-condensed">
                  Volume : <span className="text-text font-bold">{totalVol.toLocaleString()} kg</span>
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
