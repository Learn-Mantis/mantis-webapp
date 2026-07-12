import { Shield } from 'lucide-react'
import { getRank, type RankTier } from '@/lib/config/ranks'
import { cn } from '@/lib/utils'

interface RankBadgeProps {
  rating?: number
  tier?: RankTier
  size?: number
  showLabel?: boolean
  className?: string
}

/** Circular rank badge tinted with the tier color. */
export function RankBadge({ rating, tier, size = 44, showLabel = false, className }: RankBadgeProps) {
  const resolved = tier ?? getRank(rating ?? 0)
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="flex items-center justify-center rounded-2xl shrink-0"
        style={{ width: size, height: size, background: `${resolved.color}22`, color: resolved.color }}
      >
        <Shield size={size * 0.46} strokeWidth={2.25} />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-none">{resolved.name}</span>
          {typeof rating === 'number' && <span className="text-[11px] text-neutral-500 mt-0.5">{rating}</span>}
        </div>
      )}
    </div>
  )
}
