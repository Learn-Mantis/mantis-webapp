'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Swords, Bot as BotIcon, Link2, Trophy, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/layout/PageContainer'
import { BattleSetupSheet, type SetupAction, type SetupChoice } from '@/components/battle/BattleSetupSheet'
import { MatchmakingOverlay } from '@/components/battle/MatchmakingOverlay'
import { LeaderboardModal } from '@/components/battle/LeaderboardModal'
import { RankBadge } from '@/components/battle/RankBadge'
import { useUser } from '@/features/auth/user-provider'
import { ensurePlayer } from '@/features/auth/guest'
import { battleApi, BattleApiError, type BattleLogItem, type BattleProfile, type Bot } from '@/features/battle/api'
import { useMatchmaking } from '@/features/battle/use-matchmaking'
import { playPath, useStartBattle } from '@/features/battle/use-start-battle'
import { BATTLE_MODES, type BattleModeKey } from '@/lib/config/battle-modes'
import { categoryLabel } from '@/lib/config/subjects'
import { getRank, getNextRank, STARTING_RATING } from '@/lib/config/ranks'
import { cn } from '@/lib/utils'

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - Date.parse(iso)) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function logTitle(item: BattleLogItem): string {
  if (item.kind === 'challenge' && item.role === 'host') {
    return `Your challenge · ${item.challengers ?? 0} played`
  }
  if (item.kind === 'challenge') return `${item.opponent?.username ?? 'Someone'}’s challenge`
  if (item.kind === 'bot') return `vs ${item.opponent?.username ?? 'Bot'} · Bot`
  return `vs ${item.opponent?.username ?? 'Opponent'}`
}

const ACTIONS: { key: SetupAction; title: string; sub: string; icon: typeof Swords }[] = [
  { key: 'live', title: 'Find opponent', sub: 'Live 1v1 with a player near your rating', icon: Swords },
  { key: 'bot', title: 'Practice vs bot', sub: 'Choose a bot by rank. No rating change', icon: BotIcon },
  { key: 'challenge', title: 'Challenge a friend', sub: 'Play a set, send a one-time link', icon: Link2 },
]

function BattleHub() {
  const router = useRouter()
  const params = useSearchParams()
  const { sessionUser, loading } = useUser()
  const [profile, setProfile] = useState<BattleProfile | null>(null)
  const [log, setLog] = useState<BattleLogItem[] | null>(null)
  const [bots, setBots] = useState<Bot[]>([])
  const [setup, setSetup] = useState<SetupAction | null>(null)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const starter = useStartBattle()

  const rating = profile?.rating ?? STARTING_RATING
  const rank = getRank(rating)
  const next = getNextRank(rating)

  // Only touch the server for people who already have a session; visitors get
  // a guest session the moment they start a game.
  useEffect(() => {
    if (loading || !sessionUser) return
    let cancelled = false
    ensurePlayer()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => {})
    battleApi
      .myBattles(20)
      .then((l) => !cancelled && setLog(l))
      .catch(() => !cancelled && setLog([]))
    return () => {
      cancelled = true
    }
  }, [loading, sessionUser])

  useEffect(() => {
    battleApi.bots().then(setBots).catch(() => {})
  }, [])

  const matchmaking = useMatchmaking(
    useCallback((battleId: string) => router.push(playPath(battleId)), [router]),
  )

  const fallbackBot = bots.length
    ? [...bots].sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating))[0]
    : null

  const startSearch = matchmaking.start
  const startLive = useCallback(
    async (mode: BattleModeKey, categoryId: string, rated: boolean) => {
      try {
        const p = await ensurePlayer()
        setProfile(p)
        startSearch({ mode, categoryId, rated })
      } catch (e) {
        toast.error(e instanceof BattleApiError ? e.message : 'Could not start matchmaking.')
      }
    },
    [startSearch],
  )

  async function handleStart(choice: SetupChoice) {
    setSetup(null)
    if (choice.action === 'live') await startLive(choice.mode, choice.categoryId, choice.rated)
    else if (choice.action === 'bot' && choice.botId) await starter.startBot(choice.botId, choice.mode, choice.categoryId)
    else if (choice.action === 'challenge') await starter.startChallenge(choice.mode, choice.categoryId, choice.rated)
  }

  // "Play again" from a live result lands here with the same settings.
  const againHandled = useRef(false)
  useEffect(() => {
    if (againHandled.current || params.get('again') !== 'live') return
    const mode = params.get('mode') as BattleModeKey | null
    const cat = params.get('cat')
    if (!mode || !BATTLE_MODES[mode] || !cat) return
    const rated = params.get('rated') === '1'
    const id = setTimeout(() => {
      againHandled.current = true
      router.replace('/battle')
      startLive(mode, cat, rated)
    }, 0)
    return () => clearTimeout(id)
  }, [params, router, startLive])

  async function fallbackToBot() {
    const s = matchmaking.settings
    const matched = await matchmaking.cancel()
    if (matched) return router.push(playPath(matched))
    if (s && fallbackBot) await starter.startBot(fallbackBot.id, s.mode, s.categoryId)
  }

  async function fallbackToChallenge() {
    const s = matchmaking.settings
    const matched = await matchmaking.cancel()
    if (matched) return router.push(playPath(matched))
    if (s) await starter.startChallenge(s.mode, s.categoryId, s.rated)
  }

  async function cancelSearch() {
    const matched = await matchmaking.cancel()
    if (matched) router.push(playPath(matched))
  }

  return (
    <PageContainer>
      <div className="flex items-end justify-between pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Battle</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Quiz duels on real exam-style questions</p>
        </div>
        <button
          onClick={() => setLeaderboardOpen(true)}
          className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300 hover:text-brand-600"
        >
          <Trophy size={16} /> Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Rating */}
          <Card className="p-5 flex items-center gap-4">
            <RankBadge tier={rank} size={52} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500">
                {profile ? profile.username : 'Not played yet'}
                {profile?.is_guest && ' · guest'}
              </p>
              <p className="text-3xl font-bold tabular-nums leading-tight">{rating}</p>
              <p className="text-xs text-neutral-500">
                {rank.name}
                {next ? ` · ${next.minRating - rating} to ${next.name}` : ''}
              </p>
            </div>
            {profile && (
              <div className="text-right text-xs text-neutral-500 leading-5">
                <p>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{profile.games}</span> ranked games
                </p>
                <p>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{profile.wins}</span> wins
                </p>
              </div>
            )}
          </Card>

          {/* Play */}
          <div className="flex flex-col gap-2.5">
            {ACTIONS.map((a) => (
              <Card
                key={a.key}
                interactive
                onClick={() => setSetup(a.key)}
                className="p-4 flex items-center gap-4 cursor-pointer"
              >
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                    a.key === 'live' ? 'bg-brand-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
                  )}
                >
                  <a.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-neutral-500">{a.sub}</p>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </Card>
            ))}
            {!sessionUser && !loading && (
              <p className="text-xs text-neutral-500 px-1">
                No account needed — you&rsquo;ll play as a guest. Sign up any time to keep your rating.
              </p>
            )}
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Recent battles</h2>
          {log === null && sessionUser && <p className="text-sm text-neutral-500">Loading…</p>}
          {(log?.length === 0 || (!sessionUser && !loading)) && (
            <Card className="p-5 text-sm text-neutral-500">Your battles will show up here.</Card>
          )}
          {log?.map((item) => {
            const delta = item.rating_delta
            return (
              <Card
                key={item.battle_id}
                interactive
                onClick={() => router.push(playPath(item.battle_id))}
                className="p-3.5 flex items-center gap-3 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{logTitle(item)}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {BATTLE_MODES[item.mode].label} · {categoryLabel(item.category_id)} ·{' '}
                    {item.kind === 'bot' ? 'Practice' : item.rated ? 'Ranked' : 'Friendly'} · {timeAgo(item.played_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {item.score}
                    {item.opponent && item.kind !== 'challenge' ? ` – ${item.opponent.score}` : ''}
                    {item.kind === 'challenge' && item.role === 'challenger' && item.opponent ? ` – ${item.opponent.score}` : ''}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      !item.finished
                        ? 'text-neutral-400'
                        : item.outcome === 'win'
                          ? 'text-brand-600'
                          : item.outcome === 'loss'
                            ? 'text-danger-500'
                            : 'text-neutral-500',
                    )}
                  >
                    {!item.finished
                      ? 'Unfinished'
                      : item.outcome
                        ? item.outcome === 'win'
                          ? 'Won'
                          : item.outcome === 'loss'
                            ? 'Lost'
                            : 'Draw'
                        : item.kind === 'challenge'
                          ? 'Shared'
                          : 'Waiting'}
                    {item.rated && delta ? ` · ${delta > 0 ? '+' : ''}${delta}` : ''}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <BattleSetupSheet
        open={setup !== null}
        action={setup ?? 'live'}
        onClose={() => setSetup(null)}
        onStart={handleStart}
        rating={rating}
        busy={starter.busy}
      />

      <LeaderboardModal
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        userRating={rating}
        userName={profile?.username ?? ''}
        onChallengeDoctor={() => {
          setLeaderboardOpen(false)
          setSetup('challenge')
          toast.info('Play a set, then send them the link.')
        }}
      />

      {matchmaking.settings && (
        <MatchmakingOverlay
          mode={matchmaking.settings.mode}
          categoryId={matchmaking.settings.categoryId}
          rated={matchmaking.settings.rated}
          waited={matchmaking.waited}
          showFallback={matchmaking.showFallback}
          error={matchmaking.error}
          fallbackBot={fallbackBot ? { name: fallbackBot.name, rating: fallbackBot.rating } : null}
          onCancel={cancelSearch}
          onPlayBot={fallbackToBot}
          onChallenge={fallbackToChallenge}
        />
      )}
    </PageContainer>
  )
}

export default function BattlePage() {
  return (
    <Suspense>
      <BattleHub />
    </Suspense>
  )
}
