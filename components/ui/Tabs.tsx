'use client'

import { cn } from '@/lib/utils'

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** Underlined text tabs. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  fullWidth,
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (v: T) => void
  fullWidth?: boolean
  className?: string
}) {
  return (
    <div role="tablist" className={cn('flex border-b border-line', fullWidth ? 'gap-0' : 'gap-6', className)}>
      {items.map((t) => {
        const on = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              '-mb-px inline-flex h-11 items-center justify-center gap-1.5 border-b-2 text-[15px] transition-colors duration-200',
              fullWidth && 'flex-1',
              on ? 'border-fg font-semibold text-fg' : 'border-transparent font-medium text-fg-3',
            )}
          >
            {t.label}
            {t.count != null && <span className="num text-xs font-normal text-fg-3">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
