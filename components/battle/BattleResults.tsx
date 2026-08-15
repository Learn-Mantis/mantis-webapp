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
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { RankBadge } from '@/components/battle/RankBadge'
import { getRank, getNextRank } from '@/lib/config/ranks'
import { subjectName } from '@/lib/config/subjects'
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
      <Card className="p-4 bg-gradient-to-br from-[var(--color-surface-light-muted)] to-[var(--color-surface-light)] dark:from-[var(--color-surface-dark-muted)] dark:to-[var(--color-surface-dark)]">
        <div className="flex items-center justify-between gap-3">
          {/* User */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar initials={user.avatarKey || user.name.slice(0, 2).toUpperCase()} size={42} />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Score: {userScore}</p>
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-center px-4 py-2 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 shrink-0">
            <span className="text-2xl font-black font-[var(--font-display)]">
              {correctCount} - {opponentScore}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              {totalQuestions} Questions
            </span>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{opponent.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Score: {opponentScore}</p>
            </div>
            <Avatar initials={opponent.avatarKey || opponent.name.slice(0, 2).toUpperCase()} size={42} />
          </div>
        </div>
      </Card>

      {/* Elo Rating Update Card */}
      <Card className="p-5 border-brand-500/20 bg-brand-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RankBadge tier={userRank} size={40} />
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                {isPractice ? 'Practice Session' : 'Rating Progress'}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold font-[var(--font-display)]">
                  {userRatingUpdate.rating}
                </span>
                {isPractice ? (
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    ±0 Elo (Practice)
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-sm font-black',
                      userRatingUpdate.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {userRatingUpdate.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {userRatingUpdate.delta >= 0 ? `+${userRatingUpdate.delta}` : userRatingUpdate.delta}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full">
              {userRank.name}
            </span>
            {nextRank && !isPractice && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                {nextRank.minRating - userRatingUpdate.rating} pts to {nextRank.name}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Match Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] text-center">
          <Target size={18} className="text-brand-500 mb-1" />
          <span className="text-lg font-extrabold font-[var(--font-display)]">{accuracy}%</span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Accuracy</span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] text-center">
          <Clock size={18} className="text-info-500 mb-1" />
          <span className="text-lg font-extrabold font-[var(--font-display)]">{avgResponseSec}s</span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Avg Speed</span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] text-center">
          <Flame size={18} className="text-gold-500 mb-1" />
          <span className="text-lg font-extrabold font-[var(--font-display)]">{maxStreak}</span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Best Streak</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={onPlayAgain}>
          <RotateCcw size={18} /> Play Again
        </Button>
        <Button size="lg" variant="secondary" onClick={onExit} className="px-6">
          Exit Arena
        </Button>
      </div>

      {/* Question Review Section */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand-500" />
            <h3 className="font-bold text-base">Question Review</h3>
          </div>
          <span className="text-xs text-neutral-500">{questions.length} questions</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {questions.map((q, idx) => {
            const record = userRecords[idx]
            const isCorrect = record?.correct
            const isExpanded = expandedIndex === idx

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
