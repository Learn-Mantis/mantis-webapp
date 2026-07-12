import { cn } from '../../lib/utils'

interface AvatarProps {
  initials: string
  size?: number
  className?: string
  ring?: boolean
}

export function Avatar({ initials, size = 48, className, ring = false }: AvatarProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white font-bold font-[var(--font-display)]',
        ring && 'ring-4 ring-brand-500/20',
        className,
      )}
    >
      <span style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  )
}
