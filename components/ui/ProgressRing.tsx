import type { ReactNode } from 'react'

interface ProgressRingProps {
  /** 0–100 */
  progress: number
  size?: number
  strokeWidth?: number
  tone?: 'accent' | 'highlight' | 'warn' | 'neutral'
  /** @deprecated use tone */
  color?: string
  trackColor?: string
  children?: ReactNode
}

const TONE = {
  accent: 'var(--accent)',
  highlight: 'var(--antenna)',
  warn: 'var(--highlight-fg)',
  neutral: 'var(--text-1)',
}

export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 5,
  tone = 'accent',
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const v = Math.min(100, Math.max(0, progress)) / 100
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor ?? 'var(--accent-track)'} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? TONE[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 320ms cubic-bezier(.2,.8,.2,1), stroke 200ms' }}
        />
      </svg>
      {children != null && <div className="absolute inset-0 flex flex-col items-center justify-center text-fg">{children}</div>}
    </div>
  )
}
