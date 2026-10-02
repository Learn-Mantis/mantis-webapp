import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  icon?: LucideIcon
  label: string
  value: string | number
  unit?: string
  footnote?: string
  trailing?: ReactNode
  /** @deprecated Colour tones are gone: the number carries the meaning. */
  tone?: string
  className?: string
}

export function StatTile({ icon: Icon, label, value, unit, footnote, trailing, className }: StatTileProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4', className)}>
      <div className="flex items-center gap-1.5 text-[13px] leading-[18px] font-medium text-fg-3">
        {Icon && <Icon size={16} strokeWidth={1.75} />}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="num text-[28px] leading-8 tracking-[-0.03em] text-fg">{value}</span>
        {unit && <span className="text-[13px] text-fg-3">{unit}</span>}
        {trailing}
      </div>
      {footnote && <p className="text-xs text-fg-3">{footnote}</p>}
    </div>
  )
}
