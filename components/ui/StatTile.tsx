import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'brand' | 'info' | 'gold' | 'danger' | 'neutral'
  className?: string
}

const toneStyles: Record<NonNullable<StatTileProps['tone']>, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  info: 'bg-info-500/10 text-info-600 dark:text-info-400',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  danger: 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
  neutral: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-300',
}

export function StatTile({ icon: Icon, label, value, tone = 'brand', className }: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl p-3.5 bg-[var(--color-surface-light-muted)]/60 dark:bg-[var(--color-surface-dark-muted)]/60',
        className,
      )}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', toneStyles[tone])}>
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight font-[var(--font-display)]">{value}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      </div>
    </div>
  )
}
