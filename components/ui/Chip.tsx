'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps {
  children: ReactNode
  /** Selected chips are ink-filled (green is reserved for "correct"). */
  active?: boolean
  onClick?: () => void
  icon?: ReactNode
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

export function Chip({ children, active = false, onClick, icon, count, size = 'md', className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap font-medium transition-colors duration-[120ms]',
        size === 'sm' ? 'h-[30px] px-[11px] text-[13px]' : 'h-9 px-3.5 text-sm',
        active
          ? 'bg-inverse text-on-inverse border-inverse'
          : 'bg-surface text-fg-2 border-line-2 hover:border-line-3',
        className,
      )}
    >
      {icon}
      {children}
      {count != null && <span className="num text-xs opacity-70">{count}</span>}
    </button>
  )
}
