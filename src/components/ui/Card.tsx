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
        bg-surface border rounded-2xl transition-all
        ${highlight ? 'border-lime/40 shadow-[0_0_20px_rgb(168_255_62/0.07)]' : 'border-edge'}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  )
}
