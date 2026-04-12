import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutStore } from '../../store/workout.store'
import { Button } from '../ui/Button'

const FEELING_EMOJI: Record<number, string> = {
  1: '😴', 2: '😩', 3: '😤', 4: '😐', 5: '🙂',
  6: '💪', 7: '🔥', 8: '⚡', 9: '🚀', 10: '👑',
}

export function PostSessionView() {
  const { finishSession, reset } = useWorkoutStore()
  const [feeling, setFeeling] = useState<number | null>(null)
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const navigate = useNavigate()

  async function handleFinish() {
    setSaving(true)
    try {
      await finishSession({ overallFeeling: feeling, notes })
      navigate('/history')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 px-5 py-12 space-y-8 overflow-y-auto bg-bg" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="text-6xl">🏆</div>
        <h2 className="font-display text-4xl text-text tracking-wide" style={{ fontWeight: 800 }}>Séance terminée</h2>
        <p className="text-muted font-condensed">Comment tu t'es senti ?</p>
      </div>

      {/* Feeling scale */}
      <div className="space-y-3">
        <p className="text-[11px] font-condensed tracking-widest uppercase text-muted text-center">Ressenti global</p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <button
              key={v}
              onClick={() => setFeeling(feeling === v ? null : v)}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95 ${
                feeling === v
                  ? 'bg-accent border border-accent text-white'
                  : 'bg-surface border border-border text-muted hover:border-accent/30'
              }`}
            >
              <span className="text-xl">{FEELING_EMOJI[v]}</span>
              <span className={`text-xs font-condensed font-bold mt-0.5 ${feeling === v ? 'text-white' : 'text-faint'}`}>{v}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <p className="text-[11px] font-condensed tracking-widest uppercase text-muted">Notes (optionnel)</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, ce qui a bien marché..."
          className="w-full bg-surface border border-border focus:border-accent/40 rounded-xl px-4 py-3 text-sm text-text placeholder:text-faint resize-none outline-none transition-colors min-h-[90px]"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button fullWidth size="lg" onClick={handleFinish} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
        </Button>
        <button
          onClick={reset}
          className="w-full text-center text-xs font-condensed text-faint hover:text-muted py-2 transition-colors"
        >
          Ignorer et fermer
        </button>
      </div>
    </div>
  )
}
