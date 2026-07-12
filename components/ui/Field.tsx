import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const base =
  'w-full h-12 rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/50 dark:bg-[var(--color-surface-dark-muted)]/50 px-4 text-[15px] outline-none transition-colors focus:border-brand-500 placeholder:text-neutral-400'

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-0.5">{children}</label>
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, 'appearance-none', className)} {...props}>
      {children}
    </select>
  )
}
