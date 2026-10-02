import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Timer as TimerIcon } from 'lucide-react'
import { ProgressRing } from './ProgressRing'
import { cn } from '@/lib/utils'

/** Empty state: a Lucide icon in a sunken circle, a title and one line. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  compact,
  className,
}: {
  icon: ReactNode
  title: string
  body?: string
  action?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5 text-center', compact ? 'px-4 py-6' : 'px-6 py-12', className)}>
      <div className="mb-2.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-sunken text-fg-3">{icon}</div>
      <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-fg">{title}</p>
      {body && <p className="max-w-[300px] text-sm leading-[21px] text-fg-3">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Signed Elo change, mono, green up / clay down. */
export function RatingDelta({
  value,
  size = 'md',
  showIcon = true,
  className,
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}) {
  const up = value > 0
  const down = value < 0
  const fs = size === 'lg' ? 28 : size === 'sm' ? 12 : 14
  const text = up ? `+${value}` : down ? `−${Math.abs(value)}` : '±0'
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'num inline-flex items-center leading-none',
        up ? 'text-rating-up' : down ? 'text-rating-down' : 'text-fg-3',
        size === 'lg' ? 'gap-1.5 tracking-[-0.02em]' : 'gap-[3px]',
        className,
      )}
      style={{ fontSize: fs }}
    >
      {showIcon && (up || down) && <Icon size={size === 'lg' ? 22 : fs + 2} strokeWidth={2} />}
      {text}
    </span>
  )
}

/** Shimmering placeholder bar (or `lines` stacked bars). */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  circle,
  lines,
  className,
}: {
  width?: number | string
  height?: number
  radius?: number
  circle?: boolean
  lines?: number
  className?: string
}) {
  const bar = (w: number | string, key: number) => (
    <span
      key={key}
      className="shimmer-bg block shrink-0 animate-shimmer bg-[var(--skeleton-base)]"
      style={{ width: circle ? height : w, height, borderRadius: circle ? '50%' : radius }}
    />
  )
  if (lines) {
    return (
      <span className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }, (_, i) => bar(i === lines - 1 ? '62%' : width, i))}
      </span>
    )
  }
  return <span className={cn('block', className)}>{bar(width, 0)}</span>
}

function mmss(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Countdown. Low time turns honey (never red). */
export function Timer({
  seconds,
  total,
  variant = 'pill',
  warnAt = 10,
  className,
}: {
  seconds: number
  total?: number
  variant?: 'pill' | 'ring'
  warnAt?: number
  className?: string
}) {
  const warn = seconds <= warnAt
  if (variant === 'ring') {
    return (
      <ProgressRing progress={total ? (seconds / total) * 100 : 100} size={40} strokeWidth={3.5} tone={warn ? 'warn' : 'neutral'}>
        <span className={cn('num text-[13px]', warn ? 'text-on-highlight' : 'text-fg')}>{Math.max(0, Math.ceil(seconds))}</span>
      </ProgressRing>
    )
  }
  return (
    <span
      role="timer"
      className={cn(
        'num inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm transition-colors duration-200',
        warn ? 'bg-highlight-soft text-on-highlight' : 'bg-sunken text-fg-2',
        className,
      )}
    >
      <TimerIcon size={16} strokeWidth={1.75} />
      {mmss(seconds)}
    </span>
  )
}
