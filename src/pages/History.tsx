import { useEffect, useState } from 'react'
import { Clock, TrendingUp, CheckCircle, Share2, ChevronRight, BarChart2, ArrowLeft } from 'lucide-react'
import { getAllReports } from '../db'
import { useProgramStore } from '../store/program.store'
import { buildCoachingContext, syncToGithub } from '../utils/exportContext'
import { getSetting } from '../db'
import type { SessionReport } from '../schemas'
import { Card } from '../components/ui/Card'

export function History() {
  const { currentProgram } = useProgramStore()
  const [reports,  setReports]  = useState<SessionReport[]>([])
  const [selected, setSelected] = useState<SessionReport | null>(null)
  const [syncing,  setSyncing]  = useState(false)
  const [syncMsg,  setSyncMsg]  = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => { getAllReports().then(setReports) }, [])

  async function handleSync() {
    const token = await getSetting('gh_token')
    if (!token) { setSyncMsg({ ok: false, text: 'Token GitHub manquant — configure-le dans Réglages' }); return }
    setSyncing(true)
    setSyncMsg(null)
    const ctx = buildCoachingContext(currentProgram, reports)
    const res = await syncToGithub(ctx, token, 'naseradd', 'app-coach-claude')
    setSyncing(false)
    setSyncMsg(res.success ? { ok: true, text: `Synced → ${res.url}` } : { ok: false, text: res.error ?? 'Erreur GitHub API' })
  }

  function copyExport() {
    const ctx = buildCoachingContext(currentProgram, reports)
    navigator.clipboard.writeText(JSON.stringify(ctx, null, 2))
    setSyncMsg({ ok: true, text: 'Contexte copié dans le presse-papiers' })
  }

  if (selected) return <ReportDetail report={selected} onBack={() => setSelected(null)} />

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-condensed font-bold text-2xl text-white tracking-wide">Historique</h1>
        {reports.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={copyExport}
              className="w-9 h-9 rounded-xl bg-surface-2 border border-edge flex items-center justify-center text-faint hover:text-white transition-colors"
              title="Copier contexte pour Claude"
            >
              <Share2 size={15} />
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-9 h-9 rounded-xl bg-surface-2 border border-edge flex items-center justify-center text-faint hover:text-lime disabled:opacity-40 transition-colors"
              title="Sync vers GitHub"
            >
              <TrendingUp size={15} />
            </button>
          </div>
        )}
      </div>

      {syncMsg && (
        <div className={`text-xs px-3 py-2.5 rounded-xl font-condensed ${syncMsg.ok ? 'bg-win/10 text-win border border-win/20' : 'bg-loss/10 text-loss border border-loss/20'}`}>
          {syncMsg.text}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 py-20">
          <BarChart2 size={44} className="text-faint" strokeWidth={1.5} />
          <div>
            <p className="font-condensed font-bold text-white tracking-wide">Aucune séance enregistrée</p>
            <p className="text-sm text-muted mt-1 font-condensed">Tes performances apparaîtront ici.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const date = new Date(r.started_at)
            const pct  = Math.round(r.completion_rate * 100)
            const vol  = r.volume_summary.total_volume_kg
            return (
              <Card key={r.id} className="p-4" onClick={() => setSelected(r)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed font-bold text-white tracking-wide truncate">{r.session_name}</p>
                    <p className="text-xs text-muted mt-0.5 font-condensed">
                      {date.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{r.duration_actual_minutes} min
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-faint flex-shrink-0 mt-1" />
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-condensed mb-1">
                      <span className="text-faint tracking-wide uppercase">Complétion</span>
                      <span className={pct >= 80 ? 'text-win' : 'text-warn'}>{pct}%</span>
                    </div>
                    <div className="h-1 bg-edge rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-win' : 'bg-warn'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {vol > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="font-condensed font-bold text-sm text-white">{vol.toLocaleString()} <span className="text-faint font-normal text-xs">kg</span></p>
                    </div>
                  )}
                </div>

                {r.post_session.overall_feeling !== null && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <CheckCircle size={11} className="text-lime" />
                    <span className="text-[11px] text-muted font-condensed">Ressenti {r.post_session.overall_feeling}/10</span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReportDetail({ report, onBack }: { report: SessionReport; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 pb-28">
      <div className="px-4 pt-4 pb-3 border-b border-edge flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-surface-2 border border-edge flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 className="font-condensed font-bold text-white tracking-wide">{report.session_name}</h2>
          <p className="text-xs text-muted font-condensed">
            {new Date(report.started_at).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Durée',       value: `${report.duration_actual_minutes}`, unit: 'min', icon: Clock },
            { label: 'Complétion',  value: `${Math.round(report.completion_rate * 100)}`, unit: '%',  icon: CheckCircle },
            { label: 'Volume',      value: report.volume_summary.total_volume_kg.toLocaleString(), unit: 'kg', icon: TrendingUp },
          ].map(({ label, value, unit, icon: Icon }) => (
            <Card key={label} className="p-3 text-center">
              <Icon size={14} className="text-lime mx-auto mb-1.5" strokeWidth={2} />
              <p className="font-condensed font-bold text-white text-lg tabular-nums">{value}</p>
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
                <span className="text-white font-condensed font-bold">{report.pre_session.energy_level}/10</span>
              </div>
            )}
            {report.post_session.overall_feeling !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted font-condensed">Ressenti global</span>
                <span className="text-white font-condensed font-bold">{report.post_session.overall_feeling}/10</span>
              </div>
            )}
            {report.post_session.notes && (
              <p className="text-xs text-muted italic pt-2 border-t border-edge">{report.post_session.notes}</p>
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
                <p className="font-condensed font-bold text-white tracking-wide">{ex.exercise_name}</p>
                <span className="text-xs text-muted font-condensed">{doneSets.length}/{workingSets.length} sets</span>
              </div>
              <div className="space-y-1.5">
                {ex.sets_log.map((s) => (
                  <div key={s.set_number} className={`flex items-center gap-2 text-xs font-condensed ${!s.completed ? 'opacity-35' : ''}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      s.completed ? 'bg-win/20 text-win' : 'bg-surface-2 text-faint'
                    }`}>{s.set_number}</span>
                    <span className="text-faint w-14 flex-shrink-0 capitalize">{s.type}</span>
                    <span className="text-[#EEEEFF]">
                      {s.actual_reps ?? '—'} × {s.actual_weight_kg ?? '—'} kg
                    </span>
                    {s.rpe_actual && (
                      <span className="text-muted ml-auto">RPE {s.rpe_actual}</span>
                    )}
                  </div>
                ))}
              </div>
              {totalVol > 0 && (
                <p className="text-xs text-muted mt-2.5 pt-2.5 border-t border-edge text-right font-condensed">
                  Volume : <span className="text-white font-bold">{totalVol.toLocaleString()} kg</span>
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
