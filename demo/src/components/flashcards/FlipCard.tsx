import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Shuffle, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FlipCardProps {
  cards: { front: string; back: string }[]
}

export function FlipCard({ cards }: FlipCardProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const card = cards[index]

  function go(dir: 1 | -1) {
    setFlipped(false)
    setIndex((i) => (i + dir + cards.length) % cards.length)
  }

  function shuffle() {
    setFlipped(false)
    setIndex(Math.floor(Math.random() * cards.length))
  }

  function toggleFavorite() {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full [perspective:1200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            onClick={() => setFlipped((f) => !f)}
            className="relative h-64 w-full cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* front */}
              <div
                className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-brand-500 to-brand-700 p-6 flex flex-col justify-between text-white shadow-[var(--shadow-glow-brand)]"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-brand-100">Question</span>
                <p className="text-[15px] font-semibold leading-snug">{card.front}</p>
                <span className="text-[11px] text-brand-100 flex items-center gap-1">
                  <RotateCw size={12} /> Tap to flip
                </span>
              </div>
              {/* back */}
              <div
                className="absolute inset-0 rounded-[24px] bg-white dark:bg-[var(--color-surface-dark-card)] border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] p-6 flex flex-col justify-between shadow-[var(--shadow-soft)]"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">Answer</span>
                <p className="text-[14.5px] leading-snug text-neutral-700 dark:text-neutral-200">{card.back}</p>
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <RotateCw size={12} /> Tap to flip back
                </span>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
        >
          <ChevronLeft size={19} />
        </button>
        <button
          onClick={shuffle}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
        >
          <Shuffle size={17} />
        </button>
        <button
          onClick={toggleFavorite}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full',
            favorites.has(index) ? 'bg-danger-500/10 text-danger-500' : 'bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]',
          )}
        >
          <Heart size={17} fill={favorites.has(index) ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
        >
          <ChevronRight size={19} />
        </button>
      </div>
      <p className="text-xs text-neutral-400">{index + 1} / {cards.length}</p>
    </div>
  )
}
