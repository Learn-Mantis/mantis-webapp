import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  withText?: boolean
  showSubtext?: boolean
  className?: string
  href?: string
}

export function MantisLogo({
  size = 36,
  withText = true,
  showSubtext = false,
  className,
  href,
}: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5 select-none group', className)}>
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl overflow-hidden bg-[#12161f] border border-emerald-500/30 shadow-md shadow-brand-500/20 group-hover:border-emerald-400 group-hover:scale-105 transition-all"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Mantis"
          width={size}
          height={size}
          className="object-cover w-full h-full"
          style={{ imageRendering: 'pixelated' }}
          priority
        />
      </div>

      {withText && (
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black font-[var(--font-display)] tracking-tight leading-none">
            Mantis<span className="text-brand-500">.</span>
          </span>
          {showSubtext && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-0.5">
              NEET-PG & INI-CET
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

export default MantisLogo
