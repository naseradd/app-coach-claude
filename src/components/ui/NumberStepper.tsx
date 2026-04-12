import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  label: string
  value: number | null
  onChange: (v: number) => void
  step?: number
  min?: number
  unit?: string
  large?: boolean
}

export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit,
  large = false,
}: NumberStepperProps) {
  const display = value !== null ? `${value}${unit ? ` ${unit}` : ''}` : '—'

  function decrement() {
    const current = value ?? 0
    onChange(Math.max(min, Math.round((current - step) * 100) / 100))
  }

  function increment() {
    const current = value ?? 0
    onChange(Math.round((current + step) * 100) / 100)
  }

  const btnSize = large ? 'w-14 h-14' : 'w-11 h-11'
  const valueSize = large ? 'text-4xl w-28' : 'text-2xl w-20'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] font-condensed tracking-widest uppercase text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={decrement}
          className={`${btnSize} rounded-full bg-surface-2 border border-edge hover:border-lime/40 hover:bg-surface active:scale-95 transition-all flex items-center justify-center text-muted hover:text-white`}
        >
          <Minus size={large ? 18 : 15} />
        </button>
        <span className={`${valueSize} font-condensed font-bold text-white text-center tabular-nums`}>
          {display}
        </span>
        <button
          onClick={increment}
          className={`${btnSize} rounded-full bg-surface-2 border border-edge hover:border-lime/40 hover:bg-surface active:scale-95 transition-all flex items-center justify-center text-muted hover:text-white`}
        >
          <Plus size={large ? 18 : 15} />
        </button>
      </div>
    </div>
  )
}
