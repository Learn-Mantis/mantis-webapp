import { getRank, RANK_TIERS, type RankTier } from '@/lib/config/ranks'
import { cn } from '@/lib/utils'

interface RankBadgeProps {
  rating?: number
  tier?: RankTier
  size?: 'sm' | 'md'
  showLabel?: boolean
  showRating?: boolean
  className?: string
}

/** Five ascending bars, filled up to the player's tier, plus the rank name. */
export function RankBadge({ rating, tier, size = 'sm', showLabel = true, showRating = false, className }: RankBadgeProps) {
  const resolved = tier ?? getRank(rating ?? 0)
  const level = RANK_TIERS.findIndex((t) => t.key === resolved.key) + 1
  const md = size === 'md'
  const barH = md ? 12 : 10
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap font-medium text-fg-2',
        md ? 'gap-2 text-sm' : 'gap-1.5 text-xs',
        className,
      )}
    >
      <span aria-hidden className="inline-flex items-end gap-0.5" style={{ height: barH }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn('rounded-[1px]', i <= level ? 'bg-accent-strong' : 'bg-line-3')}
            style={{ width: md ? 3 : 2.5, height: Math.round(barH * (0.4 + i * 0.12)) }}
          />
        ))}
      </span>
      {showLabel && <span>{resolved.name}</span>}
      {showRating && rating != null && <span className="num text-fg-3">{rating}</span>}
    </span>
  )
}
