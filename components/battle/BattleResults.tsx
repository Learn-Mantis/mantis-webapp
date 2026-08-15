'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Swords,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Target,
  BookOpen,
  Sparkles,
  BookmarkPlus,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { RankBadge } from '@/components/battle/RankBadge'
import { getRank, getNextRank } from '@/lib/config/ranks'
import { subjectName } from '@/lib/config/subjects'
import { useFlashcardStore } from '@/stores/flashcards'
import type { MatchSummary } from '@/features/battle/service'
import { cn } from '@/lib/utils'

interface BattleResultsProps {
  summary: MatchSummary
  isPractice?: boolean
  onPlayAgain: () => void
  onExit: () => void
}

export function BattleResults({ summary, isPractice = false, onPlayAgain, onExit }: BattleResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [savedCards, setSavedCards] = useState<Record<number, boolean>>({})
  const { addFromMistake } = useFlashcardStore()

  const { user, opponent, questions, userRecords, userScore, opponentScore, winner, userRatingUpdate } = summary

  const isWin = winner === 'user'
  const isDraw = winner === 'draw'
  const isLoss = winner === 'opponent'

  const userRank = getRank(userRatingUpdate.rating)
  const nextRank = getNextRank(userRatingUpdate.rating)

  const totalQuestions = questions.length
  const correctCount = userRecords.filter((r) => r.correct).length
  const accuracy = Math.round((correctCount / Math.max(1, totalQuestions)) * 100)

  const totalResponseMs = userRecords.reduce((acc, r) => acc + r.responseMs, 0)
  const avgResponseSec = (totalResponseMs / Math.max(1, userRecords.length) / 1000).toFixed(1)

  // Max streak
  let maxStreak = 0
  let currentStreak = 0
  for (const r of userRecords) {
    if (r.correct) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }

  const missedIndices = userRecords
    .map((r, i) => (!r.correct ? i : -1))
    .filter((i) => i !== -1)

  function handleSaveSingleMistake(idx: number) {
    const q = questions[idx]
    if (!q) return
    const correctText = q.options[q.correctOption]
    addFromMistake({
      question: q.question,
      correctAnswer: `${q.correctOption}: ${correctText}`,
      explanation: q.explanation || undefined,
      clinicalPearl: q.explanation ? `Remember: ${correctText}` : undefined,
      subject: subjectName(q.subject),
    })
    setSavedCards((prev) => ({ ...prev, [idx]: true }))
    toast.success(`Saved Q${idx + 1} to your Mistake Flashcards!`)
  }

  function handleSaveAllMissed() {
    let savedCount = 0
    missedIndices.forEach((idx) => {
      const q = questions[idx]
      if (q && !savedCards[idx]) {
        const correctText = q.options[q.correctOption]
        addFromMistake({
          question: q.question,
          correctAnswer: `${q.correctOption}: ${correctText}`,
          explanation: q.explanation || undefined,
          clinicalPearl: q.explanation ? `Remember: ${correctText}` : undefined,
          subject: subjectName(q.subject),
        })
        savedCount++
      }
    })
    const newSaved: Record<number, boolean> = { ...savedCards }
    missedIndices.forEach((i) => {
      newSaved[i] = true
    })
    setSavedCards(newSaved)
    toast.success(`Saved ${savedCount || missedIndices.length} missed questions to your Mistake Flashcards!`)
  }

  return (
    <div className="flex flex-col gap-6 py-4 max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full">
      {/* Victory / Defeat Header */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center text-center gap-3"
      >
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl border border-white/20',
            isWin && 'bg-gradient-to-tr from-gold-500 to-amber-400 text-white shadow-gold-500/30',
            isLoss && 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/30',
            isDraw && 'bg-gradient-to-tr from-neutral-600 to-neutral-500 text-white shadow-neutral-500/30',
          )}
        >
          {isWin ? <Trophy size={42} /> : isLoss ? <Swords size={40} /> : <Zap size={40} />}
        </div>

        <div>
          <h1 className="text-3xl font-black font-[var(--font-display)] tracking-tight">
            {isPractice ? (isWin ? 'PRACTICE VICTORY!' : isLoss ? 'PRACTICE COMPLETE' : 'PRACTICE DRAW') : isWin ? 'VICTORY!' : isLoss ? 'DEFEAT' : 'DRAW MATCH'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isPractice
              ? `Practice match vs ${opponent.name} (${opponent.rating} Elo) complete. Zero rating risk.`
              : isWin
                ? 'Outstanding performance! You outscored your opponent.'
                : isLoss
                  ? 'Good effort! Review the explanations below to learn from mistakes.'
                  : 'A well-fought battle! Points shared equally.'}
          </p>
        </div>
      </motion.div>

      {/* Duel Score Comparison Card */}
      <Card className="p-6 relative overflow-hidden shadow-lg border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]">
        <div className="grid grid-cols-3 items-center text-center">
          {/* User Side */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar initials={user.name.slice(0, 2).toUpperCase()} size={60} ring />
              {isWin && (
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-white shadow-md">
                  <Trophy size={13} />
                </div>
              )}
            </div>
            <div>
              <p className="font-extrabold text-sm truncate max-w-[120px] sm:max-w-none">{user.name} (You)</p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <RankBadge tier={userRank} size={20} />
                <span className="text-xs font-bold text-neutral-500">{userRatingUpdate.rating}</span>
              </div>
            </div>
            <div className="text-3xl lg:text-4xl font-black font-[var(--font-display)] text-brand-600 dark:text-brand-400">
              {userScore}
            </div>
          </div>

          {/* VS Divider & Rating Delta */}
          <div className="flex flex-col items-center justify-center gap-2 px-2">
            <span className="text-xs font-black uppercase text-neutral-400">VS</span>
            <div
              className={cn(
                'px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm shadow-sm flex items-center gap-1',
                isPractice
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : userRatingUpdate.delta >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
              )}
            >
              {isPractice ? (
                '±0 Practice'
              ) : userRatingUpdate.delta >= 0 ? (
                <>
                  <TrendingUp size={14} /> +{userRatingUpdate.delta} Elo
                </>
              ) : (
                <>
                  <TrendingDown size={14} /> {userRatingUpdate.delta} Elo
                </>
              )}
            </div>
          </div>

          {/* Opponent Side */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar initials={opponent.name.slice(0, 2).toUpperCase()} size={60} ring />
              {isLoss && (
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-white shadow-md">
                  <Trophy size={13} />
                </div>
              )}
            </div>
            <div>
              <p className="font-extrabold text-sm truncate max-w-[120px] sm:max-w-none">{opponent.name}</p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-neutral-500">{opponent.rating}</span>
              </div>
            </div>
            <div className="text-3xl lg:text-4xl font-black font-[var(--font-display)] text-neutral-400">
              {opponentScore}
            </div>
          </div>
        </div>
      </Card>

      {/* Match Performance Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 flex flex-col items-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-2">
            <Target size={18} />
          </div>
          <span className="text-xl font-black font-[var(--font-display)]">{accuracy}%</span>
          <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Accuracy</span>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-500/10 text-info-600 dark:text-info-400 mb-2">
            <Clock size={18} />
          </div>
          <span className="text-xl font-black font-[var(--font-display)]">{avgResponseSec}s</span>
          <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Avg Speed</span>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 mb-2">
            <Flame size={18} />
          </div>
          <span className="text-xl font-black font-[var(--font-display)]">{maxStreak}</span>
          <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">Max Streak</span>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
            <Zap size={18} />
          </div>
          <span className="text-xl font-black font-[var(--font-display)]">+{userScore * 20}</span>
          <span className="text-[10px] uppercase font-bold text-neutral-400 mt-0.5">XP Gained</span>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <Button size="lg" onClick={onPlayAgain} className="gap-2 font-bold shadow-lg px-6">
          <RotateCcw size={18} /> Play Again
        </Button>
        <Button size="lg" variant="secondary" onClick={onExit} className="px-6">
          Exit Arena
        </Button>
      </div>

      {/* Question Review Section */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand-500" />
            <h3 className="font-bold text-base">Question Review</h3>
            <span className="text-xs text-neutral-500">({questions.length} questions)</span>
          </div>

          {missedIndices.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveAllMissed}
              className="gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 self-start sm:self-auto"
            >
              <BookmarkPlus size={14} /> Save {missedIndices.length} Missed to Flashcards
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {questions.map((q, idx) => {
            const record = userRecords[idx]
            const isCorrect = record?.correct
            const isExpanded = expandedIndex === idx
            const isSaved = savedCards[idx]

            return (
              <div
                key={`${q.id || 'q'}_${idx}`}
                className="rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="flex items-center justify-between w-full p-4 text-left gap-3 hover:bg-neutral-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <XCircle size={20} className="text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">Q{idx + 1}</span>
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          {subjectName(q.subject)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1 mt-1">
                        {q.question}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-neutral-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-col gap-3 text-sm">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-3 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Options list */}
                    <div className="flex flex-col gap-1.5">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const optText = q.options[opt]
                        const isThisCorrect = q.correctOption === opt
                        const wasUserPick = record?.selectedOption === opt

                        let style = 'border-neutral-200 dark:border-neutral-700 bg-neutral-500/5 text-neutral-700 dark:text-neutral-300'
                        if (isThisCorrect) {
                          style = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                        } else if (wasUserPick && !isThisCorrect) {
                          style = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 line-through'
                        }

                        return (
                          <div
                            key={opt}
                            className={cn('flex items-center gap-3 p-2.5 rounded-xl border text-xs leading-snug', style)}
                          >
                            <span className="font-bold shrink-0">{opt}.</span>
                            <span className="flex-1">{optText}</span>
                            {isThisCorrect && (
                              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                Correct
                              </span>
                            )}
                            {wasUserPick && !isThisCorrect && (
                              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 shrink-0">
                                Your Pick
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs leading-relaxed text-brand-950 dark:text-brand-200">
                        <span className="font-bold block mb-1">💡 Explanation:</span>
                        {q.explanation}
                      </div>
                    )}

                    {/* Quick Flashcard Save Action */}
                    {!isCorrect && (
                      <div className="flex items-center justify-end pt-1">
                        <Button
                          size="sm"
                          variant={isSaved ? 'secondary' : 'primary'}
                          disabled={isSaved}
                          onClick={() => handleSaveSingleMistake(idx)}
                          className="gap-1.5 text-xs font-bold"
                        >
                          {isSaved ? <Check size={13} className="text-emerald-500" /> : <BookmarkPlus size={13} />}
                          {isSaved ? 'Saved to Mistake Notebook' : '+ Save to Mistake Flashcards'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
