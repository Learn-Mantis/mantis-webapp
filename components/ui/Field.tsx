'use client'

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const base =
  'w-full h-12 rounded-xl border border-line-2 bg-surface px-3.5 text-[15px] text-fg outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-fg-4 focus:border-focus focus:shadow-focus disabled:bg-sunken aria-[invalid=true]:border-incorrect-line'

export function Label({ children, className, htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn('text-[13px] leading-[19px] font-medium text-fg-2', className)}>
      {children}
    </label>
  )
}

export function Hint({ children, error, className }: { children: ReactNode; error?: boolean; className?: string }) {
  return <p className={cn('text-[13px] leading-[19px]', error ? 'text-on-incorrect' : 'text-fg-3', className)}>{children}</p>
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

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
  error?: string | null
  leading?: ReactNode
  trailing?: ReactNode
}

/** Labelled input with optional hint / error and leading or trailing adornments. */
export function TextField({ label, hint, error, leading, trailing, className, id, ...props }: FieldProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={fid}>{label}</Label>
      <div
        className={cn(
          'flex h-12 items-center gap-2.5 rounded-xl border bg-surface px-3.5 transition-[border-color,box-shadow] duration-[120ms]',
          'focus-within:border-focus focus-within:shadow-focus',
          error ? 'border-incorrect-line' : 'border-line-2',
          props.disabled && 'bg-sunken',
        )}
      >
        {leading && <span className="shrink-0 text-fg-3">{leading}</span>}
        <input
          id={fid}
          aria-invalid={error ? true : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-4 focus-visible:shadow-none"
          {...props}
        />
        {trailing}
      </div>
      {(error || hint) && <Hint error={Boolean(error)}>{error || hint}</Hint>}
    </div>
  )
}

/** Password field with a show / hide toggle. */
export function PasswordField(props: Omit<FieldProps, 'type' | 'trailing'>) {
  const [show, setShow] = useState(false)
  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-fg-3 hover:bg-hover"
        >
          {show ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      }
    />
  )
}

/** Labelled multi-line field. */
export function TextAreaField({
  label,
  hint,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={fid}>{label}</Label>
      <textarea
        id={fid}
        rows={3}
        className="w-full resize-none rounded-xl border border-line-2 bg-surface px-3.5 py-3 text-[15px] leading-[23px] text-fg outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-fg-4 focus:border-focus focus:shadow-focus"
        {...props}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  )
}
