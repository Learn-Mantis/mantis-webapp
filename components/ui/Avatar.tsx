import { cn } from '@/lib/utils'

// Muted tones; never a photo in battle / leaderboard contexts.
const TONES: [string, string][] = [
  ['#E2EBDA', '#2F5A2A'],
  ['#ECE5D5', '#5E4E2A'],
  ['#DDE6EC', '#34505F'],
  ['#F0E0D8', '#7A3B28'],
  ['#E5E2EC', '#4A4160'],
  ['#E0E8E2', '#3E5446'],
]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

interface AvatarProps {
  /** A name (initials are derived) or ready-made initials. */
  initials?: string
  name?: string
  size?: number
  className?: string
  ring?: boolean
}

/** Pseudonymous avatar: initials on a muted tone picked from the name. */
export function Avatar({ initials, name, size = 40, className, ring = false }: AvatarProps) {
  const source = name ?? initials ?? ''
  const clean = source.replace(/^Guest-/, '').replace(/[^a-zA-Z0-9]/g, '')
  const text = (initials && !name ? initials.slice(0, 2) : clean.slice(0, 2) || '?').toUpperCase()
  const [bg, fg] = TONES[hash(source) % TONES.length]
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.round(size * 0.38),
        boxShadow: ring ? '0 0 0 2px var(--surface-1), 0 0 0 4px var(--accent)' : undefined,
      }}
      className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[-0.01em]', className)}
    >
      {text}
    </div>
  )
}
