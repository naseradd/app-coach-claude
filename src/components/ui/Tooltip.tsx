import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
}

export function Tooltip({ content }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-faint hover:text-muted transition-colors p-1"
        aria-label="Info"
      >
        <Info size={14} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-text text-surface rounded-xl p-3 text-xs leading-relaxed shadow-xl z-50">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text" />
        </div>
      )}
    </div>
  )
}
