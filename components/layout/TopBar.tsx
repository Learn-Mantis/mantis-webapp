'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title?: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  /** "x" for focus screens you leave, "back" for stacked screens. */
  backIcon?: 'back' | 'x'
  actions?: ReactNode
  /** Big page title (tab roots). */
  large?: boolean
  center?: boolean
  className?: string
}

export function TopBar({ title, subtitle, onBack, backIcon = 'back', actions, large, center, className }: TopBarProps) {
  if (large) {
    return (
      <header className={cn('flex items-end justify-between gap-3 pt-1', className)}>
        <div className="min-w-0">
          <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.02em] text-fg">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-fg-3">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
      </header>
    )
  }
  return (
    <header className={cn('relative -mx-2 flex h-14 items-center gap-1', className)}>
      {onBack ? (
        <IconButton label={backIcon === 'x' ? 'Close' : 'Back'} onClick={onBack}>
          {backIcon === 'x' ? <X size={20} strokeWidth={1.75} /> : <ArrowLeft size={20} strokeWidth={1.75} />}
        </IconButton>
      ) : (
        <span className="w-2" />
      )}
      <div
        className={cn(
          'min-w-0 flex-1',
          center && 'pointer-events-none absolute inset-x-14 text-center',
        )}
      >
        {title && <p className="truncate text-base leading-[22px] font-semibold text-fg">{title}</p>}
        {subtitle && <p className="truncate text-xs text-fg-3">{subtitle}</p>}
      </div>
      {center && <div className="flex-1" />}
      <div className="flex items-center gap-0.5">{actions}</div>
    </header>
  )
}

/**
 * Primary actions pinned to the bottom of the screen. `aboveNav` lifts it over
 * the phone tab bar on screens that keep the navigation visible.
 */
export function StickyFooter({
  children,
  aboveNav,
  className,
}: {
  children: ReactNode
  aboveNav?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'sticky -mx-5 mt-auto flex flex-col gap-2 bg-app px-5 pt-3',
        aboveNav
          ? 'bottom-[calc(64px+env(safe-area-inset-bottom))] pb-4 lg:bottom-0 lg:pb-5'
          : 'bottom-0 pb-[max(env(safe-area-inset-bottom),20px)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
