'use client'

import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListRowProps {
  leading?: ReactNode
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  chevron?: boolean
  onClick?: () => void
  divider?: boolean
  highlight?: boolean
  className?: string
}

/** Settings, subjects, leaderboard and history rows. */
export function ListRow({
  leading,
  icon,
  title,
  subtitle,
  trailing,
  chevron,
  onClick,
  divider,
  highlight,
  className,
}: ListRowProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full min-h-14 items-center gap-3 px-4 py-2.5 text-left transition-colors duration-[120ms]',
        highlight ? 'bg-action-soft' : onClick && 'hover:bg-hover',
        divider && 'border-b border-line',
        className,
      )}
    >
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-fg-2">{icon}</span>
      )}
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] leading-[22px] font-medium text-fg">{title}</span>
        {subtitle && <span className="block truncate text-[13px] leading-[18px] text-fg-3">{subtitle}</span>}
      </span>
      {trailing != null && <span className="flex shrink-0 items-center gap-2 text-sm text-fg-3">{trailing}</span>}
      {chevron && <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-fg-4" />}
    </Tag>
  )
}
