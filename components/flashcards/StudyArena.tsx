'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  RotateCw,
  Sparkles,
  Award,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Keyboard,
  CheckCircle2,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Flashcard, SRSRating, StudySessionStats } from '@/features/flashcards/types'
import { useFlashcardStore } from '@/stores/flashcards'
import { getIntervalPreview } from '@/features/flashcards/srs'
import { cn } from '@/lib/utils'

interface StudyArenaProps {
  deckTitle: string
  cards: Flashcard[]
  onClose: () => void
}

export function StudyArena({ deckTitle, cards, onClose }: StudyArenaProps) {
  const [queue, setQueue] = useState<Flashcard[]>(cards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStartTime] = useState(Date.now())
  const [sessionComplete, setSessionComplete] = useState(false)

  // Session tallies
  const [sessionStats, setSessionStats] = useState({
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    totalReviewed: 0,
  })

  const { recordReview, reviews, recordSessionStats } = useFlashcardStore()

  const currentCard = queue[currentIndex]
  const currentReview = currentCard ? reviews[currentCard.id] : undefined

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (sessionComplete) return

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (flipped) {
        if (e.key === '1') {
          e.preventDefault()
          handleGrade('again')
        } else if (e.key === '2') {
          e.preventDefault()
          handleGrade('hard')
        } else if (e.key === '3') {
          e.preventDefault()
          handleGrade('good')
        } else if (e.key === '4') {
          e.preventDefault()
          handleGrade('easy')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipped, sessionComplete, currentIndex, queue])

  const handleGrade = useCallback(
    (rating: SRSRating) => {
      if (!currentCard) return

      // Record SM-2 review in store
      recordReview(currentCard.id, rating)

      // Update session statistics
      setSessionStats((prev) => ({
        ...prev,
        totalReviewed: prev.totalReviewed + 1,
        againCount: rating === 'again' ? prev.againCount + 1 : prev.againCount,
        hardCount: rating === 'hard' ? prev.hardCount + 1 : prev.hardCount,
        goodCount: rating === 'good' ? prev.goodCount + 1 : prev.goodCount,
        easyCount: rating === 'easy' ? prev.easyCount + 1 : prev.easyCount,
      }))

      // If 'again', requeue card at end of session queue so student masters it today
      if (rating === 'again') {
        setQueue((prev) => [...prev, currentCard])
      }

      setFlipped(false)

      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        // Session Complete!
        setSessionComplete(true)
        const finalStats: StudySessionStats = {
          deckTitle,
          totalReviewed: sessionStats.totalReviewed + 1,
          againCount: rating === 'again' ? sessionStats.againCount + 1 : sessionStats.againCount,
          hardCount: rating === 'hard' ? sessionStats.hardCount + 1 : sessionStats.hardCount,
          goodCount: rating === 'good' ? sessionStats.goodCount + 1 : sessionStats.goodCount,
          easyCount: rating === 'easy' ? sessionStats.easyCount + 1 : sessionStats.easyCount,
          startTime: sessionStartTime,
          endTime: Date.now(),
          xpEarned: (sessionStats.totalReviewed + 1) * 15,
        }
        recordSessionStats(finalStats)
      }
    },
    [currentCard, currentIndex, queue, deckTitle, sessionStartTime, sessionStats, recordReview, recordSessionStats],
  )

  const progressPct = queue.length > 0 ? Math.min(100, Math.round(((currentIndex + 1) / queue.length) * 100)) : 0

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0e12] text-white flex flex-col justify-between overflow-y-auto select-none">
      {/* Top Header HUD */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
            title="Exit Study Mode (Esc)"
          >
            <X size={18} />
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold font-[var(--font-display)] truncate max-w-[200px] sm:max-w-md">
              {deckTitle}
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
              Spaced Repetition (SRS)
            </span>
          </div>
        </div>

        {/* Progress HUD */}
        {!sessionComplete && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold font-[var(--font-display)]">
                Card {currentIndex + 1} of {queue.length}
              </span>
              <span className="text-[10px] text-neutral-400">{progressPct}% Complete</span>
            </div>
            <div className="w-20 sm:w-28">
              <ProgressBar progress={progressPct} color="var(--color-brand-500)" className="h-2" />
            </div>
          </div>
        )}
      </div>

      {/* Main Study Arena Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto w-full my-auto">
        {sessionComplete ? (
          /* ============================================================ */
          /* SESSION RECAP SCREEN                                         */
          /* ============================================================ */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#141822] border border-brand-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/20 text-brand-400 mb-4 shadow-lg border border-brand-500/30">
              <Award size={32} />
            </div>

            <span className="text-[11px] font-black uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              Session Mastered
            </span>

            <h3 className="text-2xl sm:text-3xl font-black font-[var(--font-display)] mt-2">
              Review Session Complete!
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm">
              All due flashcards for <strong className="text-white">{deckTitle}</strong> have been scheduled according to your recall intervals.
            </p>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 w-full my-6">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black font-[var(--font-display)] text-white">
                  {sessionStats.totalReviewed}
                </span>
                <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Reviewed</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black font-[var(--font-display)] text-brand-400">
                  +{sessionStats.totalReviewed * 15}
                </span>
                <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">XP Earned</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black font-[var(--font-display)] text-emerald-400">
                  {sessionStats.totalReviewed > 0
                    ? Math.round(((sessionStats.goodCount + sessionStats.easyCount) / sessionStats.totalReviewed) * 100)
                    : 100}
                  %
                </span>
                <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Retention</span>
              </div>
            </div>

            {/* Performance breakdown */}
            <div className="w-full flex justify-between items-center px-4 py-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-neutral-300 mb-6">
              <span className="text-rose-400 font-bold">Again: {sessionStats.againCount}</span>
              <span className="text-amber-400 font-bold">Hard: {sessionStats.hardCount}</span>
              <span className="text-emerald-400 font-bold">Good: {sessionStats.goodCount}</span>
              <span className="text-sky-400 font-bold">Easy: {sessionStats.easyCount}</span>
            </div>

            <Button size="lg" className="w-full font-extrabold gap-2" onClick={onClose}>
              Back to Deck Library <ArrowRight size={18} />
            </Button>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* 3D FLIP CARD INTERACTIVE VIEWER                              */
          /* ============================================================ */
          <div className="w-full flex flex-col items-center gap-6">
            <div className="w-full [perspective:1400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard?.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setFlipped((f) => !f)}
                  className="relative min-h-[320px] sm:min-h-[360px] w-full cursor-pointer"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <motion.div
                    className="w-full h-full min-h-[320px] sm:min-h-[360px]"
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* FRONT SIDE (QUESTION) */}
                    <div
                      className={cn(
                        'absolute inset-0 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all',
                        'bg-gradient-to-br from-[#181d29] via-[#121620] to-[#0f1219] border border-white/10 hover:border-brand-500/40',
                      )}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                          {currentCard?.subject || 'Clinical Question'}
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                          <RotateCw size={13} className="text-brand-400" /> Tap or Space to Flip
                        </span>
                      </div>

                      <div className="my-auto py-6">
                        <p className="text-lg sm:text-2xl font-bold font-[var(--font-display)] leading-relaxed text-neutral-100">
                          {currentCard?.front}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-white/5 pt-3">
                        <span>Card {currentIndex + 1} of {queue.length}</span>
                        <span className="hidden sm:inline text-neutral-400 font-medium">Press [Space] to reveal answer</span>
                      </div>
                    </div>

                    {/* BACK SIDE (ANSWER & CLINICAL PEARL) */}
                    <div
                      className={cn(
                        'absolute inset-0 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl',
                        'bg-gradient-to-br from-[#121622] via-[#11141d] to-[#0b0e14] border border-brand-500/40',
                      )}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          Verified Answer
                        </span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                          <RotateCw size={13} className="text-emerald-400" /> Tap to Flip Back
                        </span>
                      </div>

                      <div className="my-auto py-4 flex flex-col gap-3">
                        <p className="text-lg sm:text-2xl font-black font-[var(--font-display)] text-emerald-300 leading-snug">
                          {currentCard?.back}
                        </p>

                        {/* Clinical Pearl Highlight */}
                        {currentCard?.clinicalPearl && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
                            <Lightbulb size={16} className="shrink-0 text-amber-400 mt-0.5" />
                            <div>
                              <strong className="text-amber-400 font-black uppercase tracking-wider text-[10px] block">
                                Clinical Pearl:
                              </strong>
                              {currentCard.clinicalPearl}
                            </div>
                          </div>
                        )}

                        {/* Mnemonic if available */}
                        {currentCard?.mnemonic && (
                          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                            <span className="font-black text-[10px] uppercase text-purple-400">Mnemonic:</span>
                            <span>{currentCard.mnemonic}</span>
                          </div>
                        )}

                        {/* Explanation */}
                        {currentCard?.explanation && (
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {currentCard.explanation}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-white/5 pt-3">
                        <span>Grade recall below</span>
                        <span className="hidden sm:inline text-neutral-400">Keys [1, 2, 3, 4]</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Grading Bar / Action Area */}
            {flipped ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full grid grid-cols-4 gap-2 sm:gap-3"
              >
                {/* 1: Again */}
                <button
                  onClick={() => handleGrade('again')}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all',
                    'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white shadow-sm',
                  )}
                >
                  <span className="text-xs sm:text-sm font-black font-[var(--font-display)] flex items-center gap-1">
                    <span className="hidden sm:inline text-[10px] opacity-70">[1]</span> Again
                  </span>
                  <span className="text-[10px] sm:text-xs opacity-80 font-bold mt-0.5">
                    {getIntervalPreview(currentReview, 'again')}
                  </span>
                </button>

                {/* 2: Hard */}
                <button
                  onClick={() => handleGrade('hard')}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all',
                    'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-600 hover:text-white shadow-sm',
                  )}
                >
                  <span className="text-xs sm:text-sm font-black font-[var(--font-display)] flex items-center gap-1">
                    <span className="hidden sm:inline text-[10px] opacity-70">[2]</span> Hard
                  </span>
                  <span className="text-[10px] sm:text-xs opacity-80 font-bold mt-0.5">
                    {getIntervalPreview(currentReview, 'hard')}
                  </span>
                </button>

                {/* 3: Good */}
                <button
                  onClick={() => handleGrade('good')}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all',
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white shadow-sm',
                  )}
                >
                  <span className="text-xs sm:text-sm font-black font-[var(--font-display)] flex items-center gap-1">
                    <span className="hidden sm:inline text-[10px] opacity-70">[3]</span> Good
                  </span>
                  <span className="text-[10px] sm:text-xs opacity-80 font-bold mt-0.5">
                    {getIntervalPreview(currentReview, 'good')}
                  </span>
                </button>

                {/* 4: Easy */}
                <button
                  onClick={() => handleGrade('easy')}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all',
                    'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-600 hover:text-white shadow-sm',
                  )}
                >
                  <span className="text-xs sm:text-sm font-black font-[var(--font-display)] flex items-center gap-1">
                    <span className="hidden sm:inline text-[10px] opacity-70">[4]</span> Easy
                  </span>
                  <span className="text-[10px] sm:text-xs opacity-80 font-bold mt-0.5">
                    {getIntervalPreview(currentReview, 'easy')}
                  </span>
                </button>
              </motion.div>
            ) : (
              <Button
                size="lg"
                onClick={() => setFlipped(true)}
                className="w-full max-w-sm font-extrabold shadow-lg gap-2 text-sm"
              >
                <RotateCw size={16} /> Reveal Answer <span className="hidden sm:inline text-xs opacity-70">[Space]</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Keyboard Shortcut helper */}
      <div className="border-t border-white/10 bg-black/40 px-4 py-2 text-center text-[11px] text-neutral-400 hidden sm:flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Space</kbd> Flip card
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">1 - 4</kbd> Grade recall
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd> Exit
        </span>
      </div>
    </div>
  )
}
