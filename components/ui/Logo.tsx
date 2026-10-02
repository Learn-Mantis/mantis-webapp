import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** Height of the pixel mark in px. */
  size?: number
  withText?: boolean
  /** @deprecated The design has no tagline under the wordmark. */
  showSubtext?: boolean
  className?: string
  href?: string
}

/**
 * The pixel mantis mark + wordmark. The mark is the only pixel-art element in
 * the product: never recolour, outline or add effects to it.
 */
export function MantisLogo({ size = 24, withText = true, className, href }: LogoProps) {
  const content = (
    <span className={cn('inline-flex select-none items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- crisp SVG pixels */}
      <img src="/brand/mantis-mark.svg" alt={withText ? '' : 'Mantis'} width={size} height={size} style={{ imageRendering: 'pixelated' }} />
      {withText && (
        <span className="font-semibold tracking-[-0.02em] text-fg" style={{ fontSize: Math.max(17, Math.round(size * 0.72)) }}>
          Mantis
        </span>
      )}
    </span>
  )
  return href ? (
    <Link href={href} className="hover:no-underline">
      {content}
    </Link>
  ) : (
    content
  )
}

export default MantisLogo
