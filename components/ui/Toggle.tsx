'use client'

import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  className?: string
}

/** Switch: 44×26 track, green when on. */
export function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[26px] w-11 shrink-0 rounded-full p-[3px] transition-colors duration-200',
        checked ? 'bg-action' : 'bg-line-3',
        className,
      )}
    >
      <span
        className={cn(
          'block h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)]',
          checked && 'translate-x-[18px]',
        )}
      />
    </button>
  )
}

export { Toggle as Switch }
