import { useEffect, useState } from 'react'
import { Clock, TrendingUp, CheckCircle, Share2, ChevronRight, BarChart2 } from 'lucide-react'
import { getAllReports } from '../db'
import { useProgramStore } from '../store/program.store'
import { buildCoachingContext, syncToGithub } from '../utils/exportContext'
import { getSetting } from '../db'
import type { SessionReport } from '../schemas'
import { Card } from '../components/ui/Card'

export function History() {
  const { currentProgram } = useProgramStore()
  const [reports, setReports] = useState<SessionReport[]>([])
  const [selected, setSelected] = useState<SessionReport | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    getAllReports().then(setReports)
  }, [])

  async function handleSync() {
    const token = await getSetting('gh_token')
    if (!token) {
      setSyncMsg({ ok: false, text: 'Token GitHub manquant — configure-le dans Réglages' })
      return
    }
    setSyncing(true)
    setSyncMsg(null)
    const ctx = buildCoachingContext(currentProgram, reports)
    const res = await syncToGithub(ctx, token, 'naseradd', 'app-coach-claude')
    setSyncing(false)
    if (res.success) {
      setSyncMsg({ ok: true, text: `Synced → ${res.url}` })
    } else {
      setSyncMsg({ ok: false, text: res.error ?? 'Erreur GitHub API' })
    }
  }

  function copyExport() {
    const ctx = buildCoachingContext(currentProgram, reports)
    navigator.clipboard.writeText(JSON.stringify(ctx, null, 2))
    setSyncMsg({ ok: true, text: 'Contexte copié dans le presse-papiers' })
  }

  if (selected) {
    return <ReportDetail report={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-24 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Historique</h1>
        {reports.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={copyExport}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
              title="Copier contexte pour Claude"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-zinc-500 hover:text-orange-400 transition-colors p-2 disabled:opacity-40"
              title="Sync vers GitHub Pages"
            >
              <TrendingUp size={18} />
            </button>
          </div>
        )}
      </div>

      {syncMsg && (
        <div className={`text-xs px-3 py-2 rounded-lg ${syncMsg.ok ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'}`}>
          {syncMsg.text}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-3">
          <BarChart2 size={40} className="text-zinc-700" />
          <p className="text-zinc-500 text-sm">Aucune séance enregistrée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const date = new Date(r.started_at)
            const pct = Math.round(r.completion_rate * 100)
            return (
              <Card key={r.id} className="p-4" onClick={() => setSelected(r)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{r.session_name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {date.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{r.duration_actual_minutes} min
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 flex-shrink-0 mt-1" />
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Complétion</span>
                      <span className={pct >= 80 ? 'text-green-400' : 'text-orange-400'}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-500 flex-shrink-0">
                    <span className="text-white font-medium">{r.volume_summary.total_volume_kg.toLocaleString()}</span> kg
                  </div>
                </div>
                {r.post_session.overall_feeling !== null && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-orange-400" />
                    <span className="text-xs text-zinc-500">Ressenti {r.post_session.overall_feeling}/10</span>
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
    <div className="flex flex-col flex-1 pb-24">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center gap-3">
        <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
          ←
        </button>
        <div>
          <h2 className="text-base font-semibold text-white">{report.session_name}</h2>
          <p className="text-xs text-zinc-500">
            {new Date(report.started_at).toLocaleDateString('fr-CA', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Durée', value: `${report.duration_actual_minutes} min`, icon: Clock },
            { label: 'Complétion', value: `${Math.round(report.completion_rate * 100)}%`, icon: CheckCircle },
            { label: 'Volume', value: `${report.volume_summary.total_volume_kg.toLocaleString()} kg`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-3 text-center">
              <Icon size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-white">{value}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </Card>
          ))}
        </div>

        {/* Feeling */}
        {(report.pre_session.energy_level !== null || report.post_session.overall_feeling !== null) && (
          <Card className="p-4 space-y-2">
            {report.pre_session.energy_level !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Énergie avant</span>
                <span className="text-white font-medium">{report.pre_session.energy_level}/10</span>
              </div>
            )}
            {report.post_session.overall_feeling !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Ressenti global</span>
                <span className="text-white font-medium">{report.post_session.overall_feeling}/10</span>
              </div>
            )}
            {report.post_session.notes && (
              <p className="text-xs text-zinc-500 italic pt-1 border-t border-zinc-800">{report.post_session.notes}</p>
            )}
          </Card>
        )}

        {/* Exercises */}
        {report.exercises_log.map((ex) => {
          const workingSets = ex.sets_log.filter((s) => s.type !== 'warmup')
          const doneSets = workingSets.filter((s) => s.completed)
          const totalVol = doneSets.reduce(
            (acc, s) => acc + (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0), 0
          )
          return (
            <Card key={ex.exercise_id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-white text-sm">{ex.exercise_name}</p>
                <span className="text-xs text-zinc-500">{doneSets.length}/{workingSets.length} sets</span>
              </div>
              <div className="space-y-1.5">
                {ex.sets_log.map((s) => (
                  <div key={s.set_number} className={`flex items-center gap-2 text-xs ${!s.completed ? 'opacity-40' : ''}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      s.completed ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>{s.set_number}</span>
                    <span className="text-zinc-400 w-16 flex-shrink-0 capitalize">{s.type}</span>
                    <span className="text-zinc-300">
                      {s.actual_reps ?? '—'} reps × {s.actual_weight_kg ?? '—'} kg
                    </span>
                    {s.rpe_actual && (
                      <span className="text-zinc-500 ml-auto">RPE {s.rpe_actual}</span>
                    )}
                  </div>
                ))}
              </div>
              {totalVol > 0 && (
                <p className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800 text-right">
                  Volume : <span className="text-white">{totalVol.toLocaleString()} kg</span>
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
