'use client'

import type { ReactNode } from 'react'
import { BookMarked, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'dimmed'

const STATE: Record<OptionState, { row: string; tile: string; text: string }> = {
  idle: {
    row: 'bg-surface border-line-2 hover:border-line-3',
    tile: 'border-line-3 text-fg-2',
    text: 'text-fg',
  },
  selected: {
    row: 'bg-selected border-selected-line shadow-[inset_0_0_0_1px_var(--selected-border)]',
    tile: 'bg-inverse border-inverse text-on-inverse',
    text: 'text-fg',
  },
  correct: {
    row: 'bg-correct border-correct-line',
    tile: 'bg-correct-solid border-correct-solid text-on-inverse',
    text: 'text-fg',
  },
  incorrect: {
    row: 'bg-incorrect border-incorrect-line',
    tile: 'bg-incorrect-solid border-incorrect-solid text-on-inverse',
    text: 'text-fg',
  },
  dimmed: {
    row: 'bg-surface border-line',
    tile: 'border-line-2 text-fg-4',
    text: 'text-fg-3',
  },
}

/** One answer row of an MCQ. Selected = ink; correct = green; wrong = clay. */
export function MCQOption({
  letter,
  children,
  state = 'idle',
  percent,
  note,
  onClick,
  disabled,
}: {
  letter: string
  children: ReactNode
  state?: OptionState
  percent?: number
  /** Small trailing label, e.g. "You" / "Opponent". */
  note?: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  const s = STATE[state]
  const interactive = (state === 'idle' || state === 'selected') && !disabled
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={interactive ? onClick : undefined}
      aria-pressed={state === 'selected'}
      className={cn(
        'flex w-full min-h-[54px] items-start gap-3 rounded-[14px] border px-3.5 py-[13px] text-left',
        'transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(.2,.8,.2,1)]',
        interactive ? 'cursor-pointer active:scale-[.99]' : 'cursor-default',
        s.row,
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[13px] font-semibold transition-colors duration-200',
          s.tile,
        )}
      >
        {state === 'correct' ? <Check size={16} strokeWidth={2.5} /> : state === 'incorrect' ? <X size={16} strokeWidth={2.5} /> : letter}
      </span>
      <span className={cn('flex-1 pt-[3px] text-[15px] leading-[22px] [text-wrap:pretty]', s.text)}>{children}</span>
      {note && <span className="shrink-0 pt-[5px] text-xs text-fg-3">{note}</span>}
      {percent != null && <span className="num shrink-0 pt-1.5 text-xs text-fg-3">{percent}%</span>}
    </button>
  )
}

/** Explanation panel shown after an answer is revealed. */
export function Explanation({
  answerLetter,
  answerText,
  reference,
  children,
  className,
}: {
  answerLetter?: string
  answerText?: string
  reference?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-2 px-[18px] py-4 animate-rise', className)}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[15px] font-semibold text-fg">Explanation</span>
        {answerLetter && (
          <span className="text-[13px] font-medium text-on-correct">
            Answer {answerLetter}
            {answerText ? ` · ${answerText}` : ''}
          </span>
        )}
      </div>
      <div className="text-[15px] leading-6 text-fg-2 [text-wrap:pretty]">{children}</div>
      {reference && (
        <p className="flex items-center gap-1.5 text-xs text-fg-3">
          <BookMarked size={14} strokeWidth={1.75} />
          {reference}
        </p>
      )}
    </section>
  )
}
