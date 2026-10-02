'use client'

import type { Flashcard } from '@/features/flashcards/types'

interface FlipCardProps {
  card: Pick<Flashcard, 'front' | 'back' | 'explanation' | 'clinicalPearl' | 'mnemonic'>
  deckLabel?: string
  flipped: boolean
  onFlip: () => void
  minHeight?: number
}

/** 3D flip card: question on the front, answer (+ explanation) on the back. */
export function FlipCard({ card, deckLabel, flipped, onFlip, minHeight = 360 }: FlipCardProps) {
  const face =
    'absolute inset-0 flex flex-col rounded-[20px] border border-line bg-surface p-6 shadow-e2 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={flipped ? 'Answer — tap to see the question' : 'Question — tap to show the answer'}
      onClick={onFlip}
      className="relative cursor-pointer [perspective:1400px]"
      style={{ minHeight }}
    >
      <div
        className="absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(.45,0,.25,1)] [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
      >
        <div className={face}>
          {deckLabel && <p className="text-xs font-medium text-fg-3">{deckLabel}</p>}
          <div className="flex flex-1 items-center justify-center px-1 py-3 text-center text-xl leading-[29px] font-medium tracking-[-0.01em] text-fg [text-wrap:balance]">
            {card.front}
          </div>
          <p className="text-center text-[13px] text-fg-4">Tap to show answer</p>
        </div>
        <div className={face} style={{ transform: 'rotateY(180deg)' }}>
          <p className="text-xs font-medium text-fg-3">Answer</p>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-1 py-3 text-center">
            <p className="text-[17px] leading-[27px] text-fg [text-wrap:pretty]">{card.back}</p>
            {card.explanation && <p className="text-sm leading-[21px] text-fg-2">{card.explanation}</p>}
            {card.clinicalPearl && <p className="text-[13px] leading-[19px] text-fg-3">{card.clinicalPearl}</p>}
            {card.mnemonic && <p className="text-[13px] leading-[19px] text-on-highlight">{card.mnemonic}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
