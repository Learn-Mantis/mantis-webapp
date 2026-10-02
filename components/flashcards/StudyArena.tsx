'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatTile } from '@/components/ui/StatTile'
import { StickyFooter, TopBar } from '@/components/layout/TopBar'
import { FlipCard } from '@/components/flashcards/FlipCard'
import type { Flashcard, SRSRating } from '@/features/flashcards/types'
import { getIntervalPreview } from '@/features/flashcards/srs'
import { useFlashcardStore } from '@/stores/flashcards'
import { cn } from '@/lib/utils'

const GRADES: { key: SRSRating; label: string; tone: string; hotkey: string }[] = [
  { key: 'again', label: 'Again', tone: 'text-on-incorrect', hotkey: '1' },
  { key: 'hard', label: 'Hard', tone: 'text-fg', hotkey: '2' },
  { key: 'good', label: 'Good', tone: 'text-on-correct', hotkey: '3' },
  { key: 'easy', label: 'Easy', tone: 'text-fg', hotkey: '4' },
]

interface StudyArenaProps {
  deckTitle: string
  cards: Flashcard[]
  onClose: () => void
}

/** Full-screen study session: flip, then grade Again / Hard / Good / Easy (SM-2). */
export function StudyArena({ deckTitle, cards, onClose }: StudyArenaProps) {
  const [queue, setQueue] = useState<Flashcard[]>(cards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState<Record<SRSRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 })
  const startedAt = useRef(0)
  const recordReview = useFlashcardStore((s) => s.recordReview)
  const recordSessionStats = useFlashcardStore((s) => s.recordSessionStats)
  const reviews = useFlashcardStore((s) => s.reviews)

  const done = index >= queue.length
  const card = queue[index]

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const grade = useCallback(
    (rating: SRSRating) => {
      if (!card || !flipped) return
      recordReview(card.id, rating)
      const next = { ...tally, [rating]: tally[rating] + 1 }
      setTally(next)
      // "Again" comes back later in this session until it sticks.
      const nextQueue = rating === 'again' ? [...queue, card] : queue
      if (rating === 'again') setQueue(nextQueue)
      setFlipped(false)
      setIndex(index + 1)
      if (index + 1 >= nextQueue.length) {
        const total = next.again + next.hard + next.good + next.easy
        recordSessionStats({
          deckTitle,
          totalReviewed: total,
          againCount: next.again,
          hardCount: next.hard,
          goodCount: next.good,
          easyCount: next.easy,
          startTime: startedAt.current,
          endTime: Date.now(),
          xpEarned: total * 15,
        })
      }
    },
    [card, flipped, tally, queue, index, deckTitle, recordReview, recordSessionStats],
  )

  // Space / Enter flips, 1–4 grade, Esc leaves.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') return onClose()
      if (done) return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
        return
      }
      const g = GRADES.find((x) => x.hotkey === e.key)
      if (g && flipped) {
        e.preventDefault()
        grade(g.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, flipped, grade, onClose])

  const reviewed = tally.again + tally.hard + tally.good + tally.easy
  const recall = reviewed ? Math.round(((tally.good + tally.easy) / reviewed) * 100) : 0

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-app">
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col px-5">
        <TopBar
          backIcon="x"
          onBack={onClose}
          title={deckTitle}
          subtitle={done ? 'Done' : `${index + 1} of ${queue.length}`}
          center
        />
        <ProgressBar progress={(index / Math.max(1, queue.length)) * 100} height={4} />

        {!done && card ? (
          <>
            <div className="flex flex-1 flex-col justify-center py-6">
              <FlipCard
                key={`${card.id}-${index}`}
                card={card}
                deckLabel={deckTitle}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
              />
            </div>
            <StickyFooter>
              {flipped ? (
                <div className="flex gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g.key}
                      onClick={() => grade(g.key)}
                      className="flex h-[60px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] border border-line-2 bg-surface transition-colors duration-[120ms] hover:border-line-3 hover:bg-hover"
                    >
                      <span className={cn('text-[15px] font-semibold', g.tone)}>{g.label}</span>
                      <span className="num text-xs text-fg-3">{getIntervalPreview(reviews[card.id], g.key)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <Button variant="secondary" size="lg" fullWidth className="h-[60px]" onClick={() => setFlipped(true)}>
                  Show answer
                </Button>
              )}
              <p className="hidden text-center text-xs text-fg-4 lg:block">Space to flip · 1–4 to grade</p>
            </StickyFooter>
          </>
        ) : (
          <>
            <div className="flex flex-1 flex-col justify-center gap-4">
              <EmptyState
                icon={<CircleCheck size={24} strokeWidth={1.75} />}
                title="All caught up"
                body={`You reviewed ${reviewed} ${reviewed === 1 ? 'card' : 'cards'}. They’ll come back when they’re due.`}
                className="py-6"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile label="Reviewed" value={reviewed} />
                <StatTile label="Recalled" value={recall} unit="%" />
              </div>
            </div>
            <StickyFooter>
              <Button size="lg" fullWidth onClick={onClose}>
                Done
              </Button>
            </StickyFooter>
          </>
        )}
      </div>
    </div>
  )
}
