import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Star } from 'lucide-react'
import { useWorkoutStore } from '../../store/workout.store'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function PostSessionView() {
  const { finishSession, reset } = useWorkoutStore()
  const [feeling, setFeeling] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
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
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 space-y-8">
      <div className="text-center">
        <Trophy size={48} className="text-orange-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-white mb-1">Séance terminée</h2>
        <p className="text-zinc-400 text-sm">Comment tu t'es senti ?</p>
      </div>

      {/* Feeling rating */}
      <Card className="w-full p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-orange-400" />
          <span className="text-sm font-medium text-zinc-200">Ressenti global</span>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <button
              key={v}
              onClick={() => setFeeling(feeling === v ? null : v)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                feeling === v
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card className="w-full p-4">
        <label className="text-sm font-medium text-zinc-200 block mb-2">Notes (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, ce qui a bien marché, ce qui était dur..."
          className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 resize-none outline-none min-h-[80px]"
          rows={3}
        />
      </Card>

      <div className="w-full space-y-3">
        <Button fullWidth size="lg" onClick={handleFinish} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
        </Button>
        <Button fullWidth variant="ghost" onClick={reset}>
          Ignorer
        </Button>
      </div>
    </div>
  )
}
