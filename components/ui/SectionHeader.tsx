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
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[17px] leading-6 font-semibold tracking-[-0.01em]">{title}</h2>
        </div>
        {subtitle && <p className="text-[13px] text-fg-3">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-0.5 text-sm font-medium text-link">
          {action}
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}
