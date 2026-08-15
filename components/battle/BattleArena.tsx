'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { BattleResults } from '@/components/battle/BattleResults'
import { subjectName } from '@/lib/config/subjects'
import { BATTLE_MODES, type BattleModeKey } from '@/lib/config/battle-modes'
import { defaultBotStrategy, type BotAnswer } from '@/features/battle/bot'
import { useBattleHistoryStore } from '@/stores/battle-history'
import {
  type MatchPlayer,
  type PlayerRoundRecord,
  type MatchSummary,
  settleBattleMatch,
} from '@/features/battle/service'
import type { BattleQuestion } from '@/features/battle/question-provider/types'
import { cn } from '@/lib/utils'

interface BattleArenaProps {
  matchId: string
  mode: BattleModeKey
  categoryLabel: string
  user: MatchPlayer
  opponent: MatchPlayer
  questions: BattleQuestion[]
  isPractice?: boolean
  onExit: () => void
  onPlayAgain: () => void
}

export function BattleArena({
  matchId,
  mode,
  categoryLabel,
  user,
  opponent,
  questions,
  isPractice = false,
  onExit,
  onPlayAgain,
}: BattleArenaProps) {
  const modeConfig = BATTLE_MODES[mode] || BATTLE_MODES.blitz

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [roundPhase, setRoundPhase] = useState<'answering' | 'revealed'>('answering')

  // Scores & streaks
  const [userScore, setUserScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [userStreak, setUserStreak] = useState(0)
  const [oppStreak, setOppStreak] = useState(0)

  // Records for post-game
  const [userRecords, setUserRecords] = useState<PlayerRoundRecord[]>([])
  const [oppRecords, setOppRecords] = useState<PlayerRoundRecord[]>([])

  // Opponent state for current round
  const [oppAnswered, setOppAnswered] = useState(false)
  const [oppAnswerResult, setOppAnswerResult] = useState<BotAnswer | null>(null)

  // Global match timer for time-boxed modes (e.g. Rapid Fire 5 min)
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number>(modeConfig.totalSeconds ?? 0)

  // Per-question timer (for Blitz 20s)
  const maxPerQuestion = modeConfig.perQuestionSeconds ?? 20
  const [timeLeft, setTimeLeft] = useState<number>(maxPerQuestion)

  // Finished state
  const [summary, setSummary] = useState<MatchSummary | null>(null)

  const roundStartTimeRef = useRef<number>(Date.now())
  const oppTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentBotAnsRef = useRef<BotAnswer | null>(null)
  const userScoreRef = useRef<number>(0)
  const oppScoreRef = useRef<number>(0)

  const currentQ = questions[currentIndex]
  const isLastQuestion = currentIndex >= questions.length - 1

  // Keep refs in sync
  useEffect(() => {
    userScoreRef.current = userScore
  }, [userScore])

  useEffect(() => {
    oppScoreRef.current = opponentScore
  }, [opponentScore])

  // Settle and finish match when global timer expires
  const finishMatchOnTimeExpiry = useCallback(async () => {
    if (summary) return
    const finalUserScore = userScoreRef.current
    const finalOppScore = oppScoreRef.current
    const winner =
      finalUserScore > finalOppScore ? 'user' : finalUserScore < finalOppScore ? 'opponent' : 'draw'

    const ratingUpdate = await settleBattleMatch(
      user,
      opponent,
      finalUserScore,
      finalOppScore,
      10,
      isPractice,
    )

    useBattleHistoryStore.getState().addMatch({
      mode,
      categoryLabel,
      opponent: {
        name: opponent.name,
        avatarKey: opponent.avatarKey || '🤖',
        rating: opponent.rating,
        college: opponent.college,
        isBot: opponent.isBot ?? isPractice,
      },
      userScore: finalUserScore,
      opponentScore: finalOppScore,
      totalQuestions: questions.length,
      winner,
      ratingDelta: ratingUpdate.delta,
      isPractice,
    })

    setSummary({
      matchId,
      mode,
      categoryLabel,
      user,
      opponent,
      questions,
      userRecords,
      opponentRecords: oppRecords,
      userScore: finalUserScore,
      opponentScore: finalOppScore,
      winner,
      userRatingUpdate: ratingUpdate,
    })
  }, [
    summary,
    user,
    opponent,
    isPractice,
    matchId,
    mode,
    categoryLabel,
    questions,
    userRecords,
    oppRecords,
  ])

  // Global match countdown timer (e.g. Rapid Fire 5 min = 300s)
  useEffect(() => {
    if (summary || !modeConfig.totalSeconds) return

    const interval = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          finishMatchOnTimeExpiry()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [summary, modeConfig.totalSeconds, finishMatchOnTimeExpiry])

  // Handle advancing to next question or ending match
  const handleNextQuestion = useCallback(
    async (
      finalUserRecords: PlayerRoundRecord[],
      finalOppRecords: PlayerRoundRecord[],
      finalUserScore: number,
      finalOppScore: number,
    ) => {
      if (isLastQuestion) {
        // Settle match
        const winner =
          finalUserScore > finalOppScore ? 'user' : finalUserScore < finalOppScore ? 'opponent' : 'draw'

        const ratingUpdate = await settleBattleMatch(
          user,
          opponent,
          finalUserScore,
          finalOppScore,
          10,
          isPractice,
        )

        useBattleHistoryStore.getState().addMatch({
          mode,
          categoryLabel,
          opponent: {
            name: opponent.name,
            avatarKey: opponent.avatarKey || '🤖',
            rating: opponent.rating,
            college: opponent.college,
            isBot: opponent.isBot ?? isPractice,
          },
          userScore: finalUserScore,
          opponentScore: finalOppScore,
          totalQuestions: questions.length,
          winner,
          ratingDelta: ratingUpdate.delta,
          isPractice,
        })

        setSummary({
          matchId,
          mode,
          categoryLabel,
          user,
          opponent,
          questions,
          userRecords: finalUserRecords,
          opponentRecords: finalOppRecords,
          userScore: finalUserScore,
          opponentScore: finalOppScore,
          winner,
          userRatingUpdate: ratingUpdate,
        })
      } else {
        setCurrentIndex((i) => i + 1)
        setSelectedOption(null)
        setIsLocked(false)
        setRoundPhase('answering')
        setTimeLeft(maxPerQuestion)
        setOppAnswered(false)
        setOppAnswerResult(null)
        currentBotAnsRef.current = null
        roundStartTimeRef.current = Date.now()
      }
    },
    [
      isLastQuestion,
      user,
      opponent,
      matchId,
      mode,
      categoryLabel,
      questions,
      maxPerQuestion,
      isPractice,
    ],
  )

  // Handle user picking an option
  const handleOptionSelect = useCallback(
    (opt: 'A' | 'B' | 'C' | 'D' | null) => {
      if (isLocked || !currentQ) return

      setIsLocked(true)
      setSelectedOption(opt)
      setRoundPhase('revealed')

      // Clear pending bot timer since round is ending
      if (oppTimeoutRef.current) {
        clearTimeout(oppTimeoutRef.current)
      }

      const responseMs = Date.now() - roundStartTimeRef.current
      const isUserCorrect = opt === currentQ.correctOption

      // 1. Update User Score
      let nextUserScore = userScoreRef.current
      let nextUserStreak = userStreak

      if (isUserCorrect) {
        nextUserScore += 1
        nextUserStreak += 1
        userScoreRef.current = nextUserScore
        setUserScore(nextUserScore)
        setUserStreak(nextUserStreak)
      } else {
        nextUserStreak = 0
        setUserStreak(0)
      }

      // 2. Resolve Opponent Bot Answer
      const botAns =
        currentBotAnsRef.current ||
        defaultBotStrategy.answer(
          opponent,
          {
            difficulty: currentQ.difficulty,
            perQuestionSeconds: modeConfig.perQuestionSeconds,
          },
          currentQ.correctOption,
        )

      let nextOppScore = oppScoreRef.current

      // If the bot's live timer hadn't fired yet, commit its answer now
      if (!oppAnswered) {
        setOppAnswered(true)
        if (botAns.correct) {
          nextOppScore += 1
          oppScoreRef.current = nextOppScore
          setOpponentScore(nextOppScore)
          setOppStreak((st) => st + 1)
        } else {
          setOppStreak(0)
        }
      }

      // 3. Build Round Records
      const userRecord: PlayerRoundRecord = {
        questionIndex: currentIndex,
        selectedOption: opt,
        correct: isUserCorrect,
        responseMs,
        scoreDelta: isUserCorrect ? 1 : 0,
      }

      const oppRecord: PlayerRoundRecord = {
        questionIndex: currentIndex,
        selectedOption: botAns.selectedOption,
        correct: botAns.correct,
        responseMs: botAns.responseMs,
        scoreDelta: botAns.correct ? 1 : 0,
      }

      const updatedUserRecords = [...userRecords, userRecord]
      const updatedOppRecords = [...oppRecords, oppRecord]

      setUserRecords(updatedUserRecords)
      setOppRecords(updatedOppRecords)

      // 4. Wait 1.2s to show feedback and advance
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextQuestion(
          updatedUserRecords,
          updatedOppRecords,
          nextUserScore,
          nextOppScore,
        )
      }, 1200)
    },
    [
      isLocked,
      currentQ,
      userStreak,
      currentIndex,
      userRecords,
      oppRecords,
      handleNextQuestion,
      opponent,
      modeConfig.perQuestionSeconds,
      oppAnswered,
    ],
  )

  // Initialize bot simulation for current question
  useEffect(() => {
    if (!currentQ || summary) return

    // Calculate bot answer and response time immediately
    const botAns = defaultBotStrategy.answer(
      opponent,
      {
        difficulty: currentQ.difficulty,
        perQuestionSeconds: modeConfig.perQuestionSeconds,
      },
      currentQ.correctOption,
    )

    currentBotAnsRef.current = botAns
    setOppAnswerResult(botAns)

    // Schedule live UI indicator when bot finishes thinking
    oppTimeoutRef.current = setTimeout(() => {
      setOppAnswered(true)
      if (botAns.correct) {
        setOpponentScore((s) => {
          const next = s + 1
          oppScoreRef.current = next
          return next
        })
        setOppStreak((st) => st + 1)
      } else {
        setOppStreak(0)
      }
    }, botAns.responseMs)

    return () => {
      if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current)
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current)
    }
  }, [currentIndex, currentQ, opponent, modeConfig.perQuestionSeconds, summary])

  // Question countdown timer (for Blitz 20s)
  useEffect(() => {
    if (roundPhase === 'revealed' || summary || !modeConfig.perQuestionSeconds) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!isLocked) {
            handleOptionSelect(null)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentIndex, roundPhase, isLocked, summary, modeConfig.perQuestionSeconds, handleOptionSelect])

  // Helper to format MM:SS
  function formatMMSS(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // If summary exists, show BattleResults
  if (summary) {
    return <BattleResults summary={summary} onPlayAgain={onPlayAgain} onExit={onExit} isPractice={isPractice} />
  }

  if (!currentQ) return null

  // Timer ring calculation for Blitz 20s
  const timerFraction = timeLeft / maxPerQuestion
  const timerColor =
    timeLeft <= 5 ? 'stroke-rose-500' : timeLeft <= 10 ? 'stroke-amber-500' : 'stroke-brand-500'

  return (
    <div className="flex flex-col gap-4 py-2 max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto w-full min-h-[85vh] justify-between">
      {/* Top Header: Mode tag + Leave button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPractice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wide">
              🤖 Practice Match
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-extrabold uppercase tracking-wide">
            <Swords size={13} /> {modeConfig.label} · {categoryLabel}
          </span>
        </div>
        <button
          onClick={onExit}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          aria-label="Leave match"
        >
          <X size={16} />
        </button>
      </div>

      {/* Duel Score HUD */}
      <Card className="p-3.5 bg-gradient-to-r from-brand-900/10 via-transparent to-amber-900/10 border-brand-500/20">
        <div className="flex items-center justify-between gap-2">
          {/* User Status */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative">
              <Avatar initials={user.avatarKey || user.name.slice(0, 2).toUpperCase()} size={42} />
              {userStreak >= 2 && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-white text-[10px] font-black shadow">
                  🔥
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xl font-black font-[var(--font-display)] text-brand-600 dark:text-brand-400">
                  {userScore}
                </span>
                {userStreak >= 2 && (
                  <span className="text-[10px] font-extrabold text-gold-500">{userStreak}x streak</span>
                )}
              </div>
            </div>
          </div>

          {/* Center Mode-Specific HUD Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            {modeConfig.totalSeconds ? (
              // Rapid Fire Mode (Global 5-Min Countdown Ring)
              <>
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-neutral-200 dark:text-neutral-800"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={
                      2 * Math.PI * 26 * (1 - globalTimeLeft / modeConfig.totalSeconds)
                    }
                    strokeLinecap="round"
                    className={cn(
                      'transition-all duration-1000 ease-linear',
                      globalTimeLeft <= 30
                        ? 'stroke-rose-500'
                        : globalTimeLeft <= 60
                        ? 'stroke-amber-500'
                        : 'stroke-purple-500',
                    )}
                    fill="none"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      'text-xs font-black font-mono tracking-tight',
                      globalTimeLeft <= 30
                        ? 'text-rose-500 animate-pulse'
                        : 'text-neutral-900 dark:text-white',
                    )}
                  >
                    {formatMMSS(globalTimeLeft)}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">
                    Q {currentIndex + 1}
                  </span>
                </div>
              </>
            ) : modeConfig.perQuestionSeconds ? (
              // Blitz Mode (Per-Question 20s Countdown Ring)
              <>
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-neutral-200 dark:text-neutral-800"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - timerFraction)}
                    strokeLinecap="round"
                    className={cn('transition-all duration-1000 ease-linear', timerColor)}
                    fill="none"
                  />
                </svg>
                <span
                  className={cn(
                    'absolute text-base font-black font-[var(--font-display)]',
                    timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-neutral-900 dark:text-white',
                  )}
                >
                  {timeLeft}
                </span>
              </>
            ) : (
              // Marathon Mode (Self-paced Q Counter Ring)
              <>
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-neutral-200 dark:text-neutral-800"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      22 *
                      (1 -
                        (currentIndex + 1) /
                          (typeof modeConfig.questionCount === 'number'
                            ? modeConfig.questionCount
                            : 30))
                    }
                    strokeLinecap="round"
                    className="stroke-brand-500 transition-all duration-300"
                    fill="none"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs font-black font-[var(--font-display)] text-neutral-900 dark:text-white">
                    {currentIndex + 1}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400">
                    /{modeConfig.questionCount}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Opponent Status */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <p className="font-bold text-xs truncate">{opponent.name}</p>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                {oppAnswered ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full animate-fadeIn">
                    ✓ Locked
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-neutral-400 animate-pulse">Thinking…</span>
                )}
                <span className="text-xl font-black font-[var(--font-display)] text-neutral-700 dark:text-neutral-300">
                  {opponentScore}
                </span>
              </div>
            </div>
            <div className="relative">
              <Avatar initials={opponent.avatarKey || opponent.name.slice(0, 2).toUpperCase()} size={42} />
              {oppStreak >= 2 && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-600 text-white text-[10px] font-black shadow">
                  🔥
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Question Progress Tracker */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-neutral-200/60 dark:border-neutral-800">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
            {modeConfig.totalSeconds ? (
              <>Answered: <strong className="text-neutral-900 dark:text-white font-extrabold">{currentIndex + 1} Qs</strong></>
            ) : (
              <>Q {currentIndex + 1} / {questions.length}</>
            )}
          </span>

          {questions.length <= 30 ? (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {questions.map((_, i) => {
                const rec = userRecords[i]
                let dotColor = 'bg-neutral-300 dark:bg-neutral-700'
                if (i === currentIndex) dotColor = 'bg-brand-500 ring-2 ring-brand-400/40'
                else if (rec?.correct) dotColor = 'bg-emerald-500'
                else if (rec && !rec.correct) dotColor = 'bg-rose-500'

                return <div key={i} className={cn('h-2 w-2 rounded-full transition-all shrink-0', dotColor)} />
              })}
            </div>
          ) : (
            <div className="flex-1 max-w-[200px] h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(100, ((currentIndex + 1) / questions.length) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Main Question Stem Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-3 my-auto"
        >
          <Card className="p-5 flex flex-col gap-3 shadow-lg border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {subjectName(currentQ.subject)}
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 capitalize">
                {currentQ.difficulty}
              </span>
            </div>
            <p className="text-base sm:text-lg font-semibold leading-relaxed text-neutral-900 dark:text-neutral-100">
              {currentQ.question}
            </p>
          </Card>

          {/* Options Grid (A, B, C, D) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optText = currentQ.options[opt]
              const isSelected = selectedOption === opt
              const isCorrect = currentQ.correctOption === opt

              let btnStyle =
                'border-neutral-200 dark:border-neutral-800 bg-[var(--color-surface-light)] dark:bg-[var(--color-surface-dark)] hover:border-brand-400 hover:bg-brand-500/5 text-neutral-800 dark:text-neutral-200'

              if (roundPhase === 'revealed') {
                if (isCorrect) {
                  btnStyle =
                    'border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                } else if (isSelected && !isCorrect) {
                  btnStyle =
                    'border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-300 font-bold'
                } else {
                  btnStyle = 'opacity-40 border-neutral-200 dark:border-neutral-800'
                }
              } else if (isSelected) {
                btnStyle = 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold'
              }

              return (
                <motion.button
                  key={opt}
                  whileTap={!isLocked ? { scale: 0.985 } : {}}
                  disabled={isLocked}
                  onClick={() => handleOptionSelect(opt)}
                  className={cn(
                    'flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-150 relative overflow-hidden',
                    btnStyle,
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0 transition-colors',
                      roundPhase === 'revealed' && isCorrect
                        ? 'bg-emerald-500 text-white'
                        : roundPhase === 'revealed' && isSelected && !isCorrect
                          ? 'bg-rose-500 text-white'
                          : isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    {opt}
                  </div>
                  <span className="text-sm sm:text-base leading-snug flex-1">{optText}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Status feedback */}
      <div className="text-center min-h-[32px] flex items-center justify-center">
        {roundPhase === 'revealed' && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              selectedOption === currentQ.correctOption
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {selectedOption === currentQ.correctOption ? '✓ Correct Answer!' : '✗ Incorrect'}
          </motion.p>
        )}
      </div>
    </div>
  )
}
