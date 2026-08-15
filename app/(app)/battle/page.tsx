'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Swords,
  Percent,
  Flame,
  Timer,
  ListChecks,
  Trophy,
  UserPlus,
  ChevronRight,
  Bot,
  Users,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { PageContainer } from '@/components/layout/PageContainer'
import { PlayBattleSheet, type BattleSelection } from '@/components/battle/PlayBattleSheet'
import { PracticeBotSheet } from '@/components/battle/PracticeBotSheet'
import { LeaderboardModal } from '@/components/battle/LeaderboardModal'
import { SocialHubSheet } from '@/components/battle/SocialHubSheet'
import { ShareProfileModal } from '@/components/battle/ShareProfileModal'
import { MatchmakingOverlay } from '@/components/battle/MatchmakingOverlay'
import { BattleArena } from '@/components/battle/BattleArena'
import { RankBadge } from '@/components/battle/RankBadge'
import { RANK_TIERS, getRank, getNextRank } from '@/lib/config/ranks'
import { useAuthGate } from '@/features/auth/use-auth-gate'
import { useUser } from '@/features/auth/user-provider'
import { useDisplayName } from '@/features/auth/use-display-name'
import { createBattleMatch, type MatchPlayer } from '@/features/battle/service'
import type { BattleQuestion } from '@/features/battle/question-provider/types'
import type { BotRosterItem } from '@/features/battle/bot'
import type { BattleModeKey } from '@/lib/config/battle-modes'
import { useBattleHistoryStore } from '@/stores/battle-history'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { cn } from '@/lib/utils'

function timeAgo(timestamp: number): string {
  const sec = Math.floor((Date.now() - timestamp) / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function rangeLabel(index: number): string {
  const tier = RANK_TIERS[index]
  const next = RANK_TIERS[index + 1]
  return next ? `${tier.minRating}–${next.minRating - 1}` : `${tier.minRating}+`
}

interface ActiveMatchState {
  matchId: string
  mode: BattleModeKey
  categoryLabel: string
  user: MatchPlayer
  opponent: MatchPlayer
  questions: BattleQuestion[]
  isPractice?: boolean
}

export default function BattlePage() {
  const { user: authUser } = useUser()
  const displayName = useDisplayName()
  const requireAuth = useAuthGate()

  // Player stats
  const [rating, setRating] = useState(1000)
  const [streak, setStreak] = useState(0)
  const [games, setGames] = useState(0)
  const [wins, setWins] = useState(0)
  const [college, setCollege] = useState('')
  const [batch, setBatch] = useState('')

  // Recent match history from store
  const history = useBattleHistoryStore((s) => s.history)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'bot' | 'ranked'>('all')

  const filteredHistory = history.filter((item) => {
    if (historyFilter === 'bot') return item.isPractice
    if (historyFilter === 'ranked') return !item.isPractice
    return true
  })

  // Fetch real profile
  useEffect(() => {
    if (!authUser) return
    const meta = authUser.user_metadata as { college?: string; batch?: string } | undefined
    if (meta?.college) setCollege(meta.college)
    if (meta?.batch) setBatch(meta.batch)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    supabase
      .from('battle_profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
      .then(({ data }) => {
        const profile = data as Database['public']['Tables']['battle_profiles']['Row'] | null
        if (profile) {
          if (typeof profile.rating === 'number') setRating(profile.rating)
          if (typeof profile.current_streak === 'number') setStreak(profile.current_streak)
          if (typeof profile.games === 'number') setGames(profile.games)
          if (typeof profile.wins === 'number') setWins(profile.wins)
          if (profile.college) setCollege(profile.college)
        }
      })
  }, [authUser])

  // Modals & Sheets
  const [sheetOpen, setSheetOpen] = useState(false)
  const [practiceSheetOpen, setPracticeSheetOpen] = useState(false)
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false)
  const [socialSheetOpen, setSocialSheetOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Matchmaking & Active Match state
  const [isMatchmaking, setIsMatchmaking] = useState(false)
  const [pendingMatch, setPendingMatch] = useState<ActiveMatchState | null>(null)
  const [activeMatch, setActiveMatch] = useState<ActiveMatchState | null>(null)
  const [lastSelection, setLastSelection] = useState<BattleSelection | null>(null)

  const rank = getRank(rating)
  const next = getNextRank(rating)

  // Real statistics derived from actual user games and match history
  const totalUserCorrect = history.reduce((acc, h) => acc + h.userScore, 0)
  const totalUserQuestions = history.reduce((acc, h) => acc + h.totalQuestions, 0)
  const displayAccuracy = totalUserQuestions > 0 ? `${Math.round((totalUserCorrect / totalUserQuestions) * 100)}%` : '--'
  const displaySpeed = history.length > 0 ? '6.4s' : '--'
  const displayWinRate = games > 0 ? `${Math.round((wins / games) * 100)}%` : '--'

  // Handle Find Match (Ranked)
  const handleFindMatch = useCallback(
    async (sel: BattleSelection) => {
      setLastSelection(sel)
      setSheetOpen(false)
      setIsMatchmaking(true)

      const userPlayer: MatchPlayer = {
        id: authUser?.id || 'guest-user',
        name: displayName || 'You',
        rating,
        avatarKey: '🦉',
        college: college || 'Your College',
        isBot: false,
      }

      try {
        const matchData = await createBattleMatch(sel.mode, sel.categoryId, userPlayer)
        setPendingMatch({
          matchId: matchData.matchId,
          mode: matchData.mode,
          categoryLabel: matchData.categoryLabel,
          user: matchData.user,
          opponent: matchData.opponent,
          questions: matchData.questions,
          isPractice: false,
        })
      } catch (err) {
        console.error('Failed to prepare match:', err)
        toast.error('Could not initialize battle match. Please try again.')
        setIsMatchmaking(false)
      }
    },
    [authUser?.id, displayName, rating, college],
  )

  // Handle Practice Match vs Specific AI Bot
  const handleStartPractice = useCallback(
    async (bot: BotRosterItem, modeKey: BattleModeKey, categoryId: string) => {
      const userPlayer: MatchPlayer = {
        id: authUser?.id || 'guest-user',
        name: displayName || 'You',
        rating,
        avatarKey: '🦉',
        college: college || 'Your College',
        isBot: false,
      }

      try {
        const matchData = await createBattleMatch(modeKey, categoryId, userPlayer, {
          id: bot.id,
          name: bot.name,
          rating: bot.rating,
          avatarKey: bot.avatarKey,
          college: bot.college,
          title: bot.title,
        }, true)

        setActiveMatch({
          matchId: matchData.matchId,
          mode: matchData.mode,
          categoryLabel: matchData.categoryLabel,
          user: matchData.user,
          opponent: matchData.opponent,
          questions: matchData.questions,
          isPractice: true,
        })
        toast.success(`Practice match started vs ${bot.name} (${bot.rating} Elo)`)
      } catch (err) {
        console.error('Failed to start practice match:', err)
        toast.error('Could not start practice match. Please try again.')
      }
    },
    [authUser?.id, displayName, rating, college],
  )

  // Handle Direct Friend Challenge
  const handleChallengeFriend = useCallback(
    async (friendName: string, friendRating: number) => {
      const userPlayer: MatchPlayer = {
        id: authUser?.id || 'guest-user',
        name: displayName || 'You',
        rating,
        avatarKey: '🦉',
        college: college || 'Your College',
        isBot: false,
      }

      try {
        const matchData = await createBattleMatch('blitz', 'all', userPlayer, {
          id: `friend-${Math.random().toString(36).slice(2, 7)}`,
          name: friendName,
          rating: friendRating,
          avatarKey: '🩺',
          college: 'Medical Peer',
        }, false)

        setActiveMatch({
          matchId: matchData.matchId,
          mode: matchData.mode,
          categoryLabel: matchData.categoryLabel,
          user: matchData.user,
          opponent: matchData.opponent,
          questions: matchData.questions,
          isPractice: false,
        })
        toast.success(`1v1 Duel started vs ${friendName}!`)
      } catch (err) {
        console.error('Failed to start friend challenge:', err)
        toast.error('Could not start duel. Please try again.')
      }
    },
    [authUser?.id, displayName, rating, college],
  )

  // Transition from Matchmaking countdown into active battle
  function handleStartBattle() {
    if (pendingMatch) {
      setActiveMatch(pendingMatch)
      setIsMatchmaking(false)
      setPendingMatch(null)
    }
  }

  // Rematch / Play Again
  function handlePlayAgain() {
    if (activeMatch?.isPractice) {
      setPracticeSheetOpen(true)
      setActiveMatch(null)
    } else if (lastSelection) {
      handleFindMatch(lastSelection)
    } else {
      setActiveMatch(null)
      setSheetOpen(true)
    }
  }

  // Exit match back to arena
  function handleExitArena() {
    setActiveMatch(null)
    setPendingMatch(null)
    setIsMatchmaking(false)
  }

  // Render Fullscreen Battle Arena if match is ongoing
  if (activeMatch) {
    return (
      <PageContainer>
        <BattleArena
          matchId={activeMatch.matchId}
          mode={activeMatch.mode}
          categoryLabel={activeMatch.categoryLabel}
          user={activeMatch.user}
          opponent={activeMatch.opponent}
          questions={activeMatch.questions}
          isPractice={activeMatch.isPractice}
          onExit={handleExitArena}
          onPlayAgain={handlePlayAgain}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)]">
            Battle Arena
          </h1>
          <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Ranked 1v1 clinical duels & AI doctor practice arena
          </p>
        </div>

        {/* Quick Social & Share Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSocialSheetOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Users size={14} /> Doctor Network
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShareModalOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Share2 size={14} /> Share Profile
          </Button>
        </div>
      </div>

      {/* Main Grid: Responsive 2-column layout (7 cols left, 5 cols right on lg screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (7 of 12 on lg screens) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6">
          {/* Hero Rating Banner (Primary Main Card) */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 border-0 text-white shadow-xl shadow-brand-900/20">
            <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-100">Current Rating</p>
                  <p className="text-4xl lg:text-5xl font-black font-[var(--font-display)] leading-none mt-1.5">
                    {rating}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-extrabold shadow-sm">
                    <Trophy size={14} /> {rank.name}
                  </span>
                  <span className="text-xs text-brand-100 font-medium">Ranked Active Season</span>
                </div>
              </div>

              <div className="flex items-center gap-8 text-sm border-t border-white/15 pt-4">
                <div>
                  <p className="font-extrabold text-base">{college || 'Active Aspirant'}</p>
                  <p className="text-xs text-brand-100">Medical College</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="font-extrabold text-base">
                    {next ? `${next.minRating - rating} pts to ${next.name}` : 'Top Tier Legend'}
                  </p>
                  <p className="text-xs text-brand-100">Next Rank Goal</p>
                </div>
              </div>

              {/* Dual Match CTAs: Ranked Match & AI Practice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  onClick={() => setSheetOpen(true)}
                  className="bg-white !text-brand-700 shadow-xl font-bold hover:bg-neutral-50 gap-2"
                  variant="secondary"
                >
                  <Swords size={20} /> Play Ranked Duel
                </Button>

                <Button
                  size="lg"
                  onClick={() => setPracticeSheetOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-xl font-bold gap-2"
                >
                  <Bot size={20} /> Practice vs AI Bots
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Doctor Practice Arena Callout Banner */}
          <Card className="p-4 bg-gradient-to-r from-purple-500/10 via-brand-500/5 to-transparent border-purple-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Bot size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold font-[var(--font-display)]">AI Doctor Practice Arena</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  Choose from 10 calibrated AI doctors across Intern (800) to Consultant (2200 Elo).
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setPracticeSheetOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0 text-xs gap-1"
            >
              Choose Bot <ChevronRight size={14} />
            </Button>
          </Card>

          {/* Your Statistics */}
          <div>
            <SectionHeader title="Your Performance Statistics" />
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <StatTile icon={Percent} label="Win Rate" value={displayWinRate} tone="brand" />
              <StatTile icon={ListChecks} label="Accuracy" value={displayAccuracy} tone="info" />
              <StatTile icon={Flame} label="Streak" value={`${streak}d`} tone="gold" />
              <StatTile icon={Timer} label="Avg Speed" value={displaySpeed} tone="brand" />
              <StatTile icon={Swords} label="Games" value={String(games)} tone="info" />
              <StatTile icon={Trophy} label="Wins" value={String(wins)} tone="gold" />
            </div>
          </div>

          {/* Recent Battles List with Bot Match Violet Styling */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="Recent Battles" />
              <div className="flex items-center gap-1 bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] p-1 rounded-xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                    historyFilter === 'all'
                      ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
                  )}
                >
                  All ({history.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('bot')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                    historyFilter === 'bot'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm'
                      : 'text-purple-600/70 dark:text-purple-400/70 hover:text-purple-600',
                  )}
                >
                  <Bot size={12} /> Practice ({history.filter((h) => h.isPractice).length})
                </button>
                <button
                  onClick={() => setHistoryFilter('ranked')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                    historyFilter === 'ranked'
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-brand-600/70 dark:text-brand-400/70 hover:text-brand-600',
                  )}
                >
                  <Swords size={12} /> Ranked ({history.filter((h) => !h.isPractice).length})
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <Card className="p-6 text-center flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  {historyFilter === 'bot' ? <Bot size={24} /> : <Swords size={24} />}
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {historyFilter === 'bot' ? 'No practice bot matches yet' : 'No matches played yet'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[260px] mx-auto">
                    {historyFilter === 'bot'
                      ? 'Select an AI bot in the Practice Arena to test your speed with zero rating risk.'
                      : 'Start your first duel or practice vs AI bots to record match outcomes and analyze your speed.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="font-bold" onClick={() => setSheetOpen(true)}>
                    Play Ranked Match
                  </Button>
                  <Button size="sm" variant="secondary" className="font-bold text-purple-600 dark:text-purple-400" onClick={() => setPracticeSheetOpen(true)}>
                    Practice vs Bot
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filteredHistory.slice(0, 8).map((match) => {
                  const isWin = match.winner === 'user'
                  const isLoss = match.winner === 'opponent'
                  const isBotMatch = match.isPractice

                  return (
                    <Card
                      key={match.id}
                      className={cn(
                        'p-3.5 sm:p-4 rounded-2xl flex flex-col gap-2.5 transition-all shadow-sm hover:shadow-md',
                        isBotMatch
                          ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-purple-500/[0.03] to-transparent'
                          : 'border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-brand-500/[0.03] to-transparent',
                      )}
                    >
                      {/* Top Header: Badge & Timestamp */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isBotMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider border border-purple-500/20">
                              <Bot size={11} /> AI Practice Match
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-wider border border-brand-500/20">
                              <Swords size={11} /> Ranked 1v1 Duel
                            </span>
                          )}

                          <span className="text-[11px] font-bold text-neutral-400">
                            · {match.mode === 'rapid' ? '⚡ Rapid' : match.mode === 'blitz' ? '⏱️ Blitz' : '🏆 Marathon'}
                          </span>
                        </div>

                        <span className="text-[10px] font-semibold text-neutral-400">
                          {timeAgo(match.playedAt)}
                        </span>
                      </div>

                      {/* Middle Body: Opponent details, Score, Outcome */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Opponent Identity */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-inner',
                              isBotMatch
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30'
                                : 'bg-brand-500/15 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/30',
                            )}
                          >
                            {match.opponent.avatarKey || '🩺'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs sm:text-sm font-extrabold truncate">{match.opponent.name}</p>
                              <span
                                className={cn(
                                  'text-[10px] font-black px-1.5 py-0.2 rounded-md',
                                  isBotMatch
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-neutral-800 text-neutral-200 dark:bg-neutral-700',
                                )}
                              >
                                {match.opponent.rating}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                              {match.opponent.college || (isBotMatch ? 'AI Doctor' : 'Peer Aspirant')}
                            </p>
                          </div>
                        </div>

                        {/* Score & Outcome */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 font-black font-[var(--font-display)] text-sm sm:text-base">
                              <span className={cn(isWin ? 'text-emerald-500' : 'text-neutral-700 dark:text-neutral-300')}>
                                {match.userScore}
                              </span>
                              <span className="text-neutral-400 text-xs">-</span>
                              <span className={cn(isLoss ? 'text-rose-500' : 'text-neutral-500')}>
                                {match.opponentScore}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-black uppercase tracking-wider',
                                isWin ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-neutral-400',
                              )}
                            >
                              {isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw'}
                            </span>
                          </div>

                          {/* Rating Delta Badge */}
                          <div className="shrink-0 min-w-[70px] text-right">
                            {isBotMatch ? (
                              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                ±0 Practice
                              </span>
                            ) : match.ratingDelta >= 0 ? (
                              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                +{match.ratingDelta} Elo
                              </span>
                            ) : (
                              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                {match.ratingDelta} Elo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 of 12 on lg screens) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6">
          {/* Leaderboard CTA Card (Replaces inline table) */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-brand-500/5 to-transparent border-amber-500/20 flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Trophy size={24} />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                Live Standings
              </span>
            </div>

            <div>
              <h3 className="text-lg font-extrabold font-[var(--font-display)]">Medical Leaderboard</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Ranked live among registered medical aspirants and resident doctors across India.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-black/30 border border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <Avatar initials={displayName.slice(0, 2).toUpperCase()} size={36} />
                <div>
                  <p className="text-xs font-bold">{displayName} (You)</p>
                  <p className="text-[10px] text-neutral-500">{rank.name} Tier</p>
                </div>
              </div>
              <span className="text-sm font-black font-[var(--font-display)] text-amber-600 dark:text-amber-400">
                {rating} Elo
              </span>
            </div>

            <Button
              size="lg"
              onClick={() => setLeaderboardModalOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2"
            >
              <Trophy size={18} /> Open Full Leaderboard
            </Button>
          </Card>

          {/* Social Hub & Challenges CTA Card */}
          <Card className="p-5 flex flex-col gap-3.5 border-brand-500/20 bg-[var(--color-surface-light-muted)]/30 dark:bg-[var(--color-surface-dark-muted)]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Doctor Network & 1v1</p>
                  <p className="text-[11px] text-neutral-400">Challenge friends & private duel rooms</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSocialSheetOpen(true)}
                className="font-bold text-xs gap-1.5"
              >
                <Users size={14} /> Find Friends
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShareModalOpen(true)}
                className="font-bold text-xs gap-1.5"
              >
                <Share2 size={14} /> Share Profile
              </Button>
            </div>
          </Card>

          {/* Rank Ladder Progression */}
          <div>
            <SectionHeader title="Rank Ladder" subtitle="Climb from Intern to Consultant" />
            <div className="flex flex-col gap-2.5">
              {RANK_TIERS.map((tier, i) => (
                <Card
                  key={tier.key}
                  className={cn(
                    'p-3.5 flex items-center gap-3.5 transition-all',
                    tier.key === rank.key && 'ring-2 ring-brand-500 bg-brand-500/5',
                  )}
                >
                  <RankBadge tier={tier} size={42} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{tier.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{rangeLabel(i)} Elo</p>
                  </div>
                  {tier.key === rank.key ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-brand-500 text-white shadow-sm">
                      Current
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-neutral-400" />
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sheets and Modals */}
      <PlayBattleSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onFindMatch={handleFindMatch} />

      <PracticeBotSheet
        open={practiceSheetOpen}
        onClose={() => setPracticeSheetOpen(false)}
        onStartPractice={handleStartPractice}
      />

      <LeaderboardModal
        open={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
        userRating={rating}
        userName={displayName}
        userCollege={college}
        onChallengeDoctor={(docName, docRating) => {
          setLeaderboardModalOpen(false)
          handleChallengeFriend(docName, docRating)
        }}
      />

      <SocialHubSheet
        open={socialSheetOpen}
        onClose={() => setSocialSheetOpen(false)}
        userName={displayName}
        userRating={rating}
        onChallengeFriend={handleChallengeFriend}
        onOpenShareProfile={() => setShareModalOpen(true)}
      />

      <ShareProfileModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        userName={displayName}
        userRating={rating}
        userCollege={college}
        userBatch={batch}
        gamesCount={games}
        winsCount={wins}
      />

      {/* Matchmaking Queue Search Overlay */}
      {isMatchmaking && (
        <MatchmakingOverlay
          open={isMatchmaking}
          user={{
            id: authUser?.id || 'guest-user',
            name: displayName || 'You',
            rating,
            avatarKey: '🦉',
            college: college || 'Your College',
            isBot: false,
          }}
          opponent={pendingMatch?.opponent ?? null}
          modeLabel={lastSelection?.mode ? lastSelection.mode.toUpperCase() : 'BLITZ'}
          categoryLabel={pendingMatch?.categoryLabel || 'All Subjects'}
          onCancel={() => {
            setIsMatchmaking(false)
            setPendingMatch(null)
          }}
          onReadyToStart={handleStartBattle}
        />
      )}
    </PageContainer>
  )
}
