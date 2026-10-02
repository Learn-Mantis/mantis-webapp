'use client'

import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChoiceCardProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  meta?: ReactNode
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  indicator?: 'radio' | 'chevron' | 'none'
  className?: string
}

/** The large single-select row used by every setup flow. Selected = ink outline. */
export function ChoiceCard({
  title,
  description,
  icon,
  meta,
  selected,
  onClick,
  disabled,
  indicator = 'radio',
  className,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      role={indicator === 'radio' ? 'radio' : undefined}
      aria-checked={indicator === 'radio' ? Boolean(selected) : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full min-h-16 items-center gap-3.5 rounded-[14px] border px-4 py-3.5 text-left transition-[border-color,background-color] duration-200',
        selected
          ? 'border-selected-line bg-selected shadow-[inset_0_0_0_1px_var(--selected-border)]'
          : 'border-line-2 bg-surface hover:border-line-3',
        disabled && 'opacity-50 cursor-default',
        className,
      )}
    >
      {icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-sunken text-fg">{icon}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] leading-[22px] font-semibold text-fg">{title}</span>
        {description && <span className="text-[13px] leading-[19px] text-fg-3">{description}</span>}
      </span>
      {meta != null && <span className="num shrink-0 text-[13px] text-fg-3">{meta}</span>}
      {indicator === 'radio' && (
        <span
          className={cn(
            'h-5 w-5 shrink-0 rounded-full bg-surface transition-[border-width] duration-[120ms]',
            selected ? 'border-[6px] border-selected-line' : 'border-[1.5px] border-line-3',
          )}
        />
      )}
      {indicator === 'chevron' && <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-fg-4" />}
    </button>
  )
}
