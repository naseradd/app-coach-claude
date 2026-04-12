import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  highlight?: boolean
}

export function Card({ children, className = '', onClick, highlight }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface border rounded-2xl transition-all shadow-sm
        ${highlight ? 'border-green/40 shadow-[0_0_0_1px_rgb(5_150_105/0.15),0_2px_12px_rgb(5_150_105/0.08)]' : 'border-border'}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  )
}
