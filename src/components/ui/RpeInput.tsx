import { Tooltip } from './Tooltip'

interface RpeInputProps {
  value: number | null
  onChange: (v: number | null) => void
}

const RPE_TOOLTIP = `RPE (Rate of Perceived Exertion) : note ton effort sur 10.
• RPE 10 = impossible de faire une rep de plus
• RPE 9 = 1 rep en réserve
• RPE 8 = 2 reps en réserve
• RPE 7 = 3 reps en réserve
Laisse vide si tu ne sais pas.`

export function RpeInput({ value, onChange }: RpeInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-condensed tracking-widest uppercase text-muted">RPE</span>
        <Tooltip content={RPE_TOOLTIP} />
      </div>
      <div className="flex gap-1.5">
        {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
          <button
            key={v}
            onClick={() => onChange(value === v ? null : v)}
            className={`flex-1 h-9 rounded-lg text-xs font-condensed font-semibold tracking-wide transition-all active:scale-95 ${
              value === v
                ? 'bg-lime text-[#08080F]'
                : 'bg-surface-2 text-muted border border-edge hover:border-lime/30 hover:text-white'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
