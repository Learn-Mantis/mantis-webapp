'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

interface Props<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, size = 'md', className }: Props<T>) {
  return (
    <div role="tablist" className={cn('flex gap-0.5 rounded-xl bg-sunken p-[3px]', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3.5 transition-[background-color,color] duration-200',
              size === 'sm' ? 'h-8 text-[13px]' : 'h-[38px] text-sm',
              on ? 'bg-surface font-semibold text-fg shadow-e1' : 'font-medium text-fg-3',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
