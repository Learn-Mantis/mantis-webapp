import { cn } from '@/lib/utils'

type Segment = 'correct' | 'incorrect' | 'current' | 'skipped' | 'pending'

interface ProgressBarProps {
  /** 0–100 */
  progress?: number
  /** Per-question segments instead of a continuous fill. */
  segments?: Segment[]
  tone?: 'accent' | 'highlight' | 'neutral'
  height?: number
  label?: string
  valueLabel?: string
  className?: string
  /** @deprecated use tone */
  color?: string
  trackClassName?: string
}

const SEG: Record<Segment, string> = {
  correct: 'bg-correct-solid',
  incorrect: 'bg-incorrect-solid',
  current: 'bg-fg',
  skipped: 'bg-line-3',
  pending: 'bg-track',
}

export function ProgressBar({
  progress = 0,
  segments,
  tone = 'accent',
  height = 6,
  label,
  valueLabel,
  className,
  color,
  trackClassName,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, progress))
  const fill = tone === 'highlight' ? 'bg-highlight' : tone === 'neutral' ? 'bg-fg' : 'bg-accent'
  return (
    <div className="flex flex-col gap-2">
      {(label || valueLabel) && (
        <div className="flex justify-between text-[13px] leading-[19px]">
          <span className="font-medium text-fg-2">{label}</span>
          <span className="num text-fg-3">{valueLabel}</span>
        </div>
      )}
      {segments ? (
        <div className="flex gap-[3px]">
          {segments.map((s, i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-sm transition-colors duration-200', SEG[s])} />
          ))}
        </div>
      ) : (
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn('w-full overflow-hidden rounded-full bg-track', trackClassName)}
          style={{ height }}
        >
          <div
            className={cn('h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]', !color && fill, className)}
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      )}
    </div>
  )
}
