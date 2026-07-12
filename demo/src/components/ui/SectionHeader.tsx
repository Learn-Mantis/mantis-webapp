import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  action?: string
  onAction?: () => void
  subtitle?: string
  icon?: ReactNode
}

export function SectionHeader({ title, action, onAction, subtitle, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-3.5 px-0.5">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[19px] font-bold tracking-tight font-[var(--font-display)]">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
          {action}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}
