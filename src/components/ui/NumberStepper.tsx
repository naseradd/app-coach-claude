import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  label: string
  value: number | null
  onChange: (v: number) => void
  step?: number
  min?: number
  unit?: string
}

export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit,
}: NumberStepperProps) {
  const display = value !== null ? `${value}${unit ? ` ${unit}` : ''}` : '—'

  function decrement() {
    const current = value ?? 0
    const next = Math.max(min, Math.round((current - step) * 100) / 100)
    onChange(next)
  }

  function increment() {
    const current = value ?? 0
    const next = Math.round((current + step) * 100) / 100
    onChange(next)
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={decrement}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center text-zinc-400"
        >
          <Minus size={16} />
        </button>
        <span className="text-xl font-semibold text-white w-20 text-center">{display}</span>
        <button
          onClick={increment}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center text-zinc-400"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
