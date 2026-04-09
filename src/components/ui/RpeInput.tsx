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
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400 whitespace-nowrap">RPE</span>
      <Tooltip content={RPE_TOOLTIP} />
      <div className="flex gap-1 flex-wrap">
        {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
          <button
            key={v}
            onClick={() => onChange(value === v ? null : v)}
            className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
              value === v
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
