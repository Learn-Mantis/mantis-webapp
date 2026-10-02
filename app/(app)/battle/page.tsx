'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Swords, Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, RatingDelta, Skeleton } from '@/components/ui/Feedback'
import { IconButton } from '@/components/ui/IconButton'
import { ListRow } from '@/components/ui/ListRow'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopBar } from '@/components/layout/TopBar'
import { RankBadge } from '@/components/battle/RankBadge'
import { BotAvatar } from '@/components/battle/BattleRun'
import { useUser } from '@/features/auth/user-provider'
import { ensurePlayer } from '@/features/auth/guest'
import { battleApi, type BattleLogItem, type BattleProfile } from '@/features/battle/api'
import { playPath } from '@/features/battle/use-start-battle'
import { BATTLE_MODES } from '@/lib/config/battle-modes'
import { categoryLabel } from '@/lib/config/subjects'
import { getNextRank, STARTING_RATING } from '@/lib/config/ranks'
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
    const n = item.challengers ?? 0
    return `Your challenge · ${n} ${n === 1 ? 'friend' : 'friends'}`
  }
  if (item.kind === 'challenge') return `${item.opponent?.username ?? 'Someone'}’s challenge`
  if (item.kind === 'bot') return `${item.opponent?.username ?? 'Bot'} bot`
  return item.opponent?.username ?? 'Opponent'
}

function LogRow({ item, divider, onOpen }: { item: BattleLogItem; divider: boolean; onOpen: () => void }) {
  const showOpp = item.opponent && !(item.kind === 'challenge' && item.role === 'host')
  const result = !item.finished
    ? 'Unfinished'
    : item.outcome === 'win'
      ? 'Won'
      : item.outcome === 'loss'
        ? 'Lost'
        : item.outcome === 'draw'
          ? 'Draw'
          : item.kind === 'challenge'
            ? 'Shared'
            : 'Waiting'
  return (
    <ListRow
      divider={divider}
      onClick={onOpen}
      leading={item.kind === 'bot' ? <BotAvatar size={36} /> : <Avatar name={logTitle(item)} size={36} />}
      title={logTitle(item)}
      subtitle={`${categoryLabel(item.category_id)} · ${BATTLE_MODES[item.mode].label} · ${
        item.kind === 'bot' ? 'Practice' : item.rated ? 'Ranked' : 'Friendly'
      } · ${timeAgo(item.played_at)}`}
      trailing={
        <span className="flex flex-col items-end gap-1">
          <span className="num text-[15px] text-fg">
            {item.score}
            {showOpp ? ` – ${item.opponent?.score}` : ''}
          </span>
          {item.rated && item.rating_delta ? (
            <RatingDelta value={item.rating_delta} size="sm" showIcon={false} />
          ) : (
            <span className={cn('text-xs', item.outcome === 'loss' ? 'text-on-incorrect' : 'text-fg-3')}>{result}</span>
          )}
        </span>
      }
    />
  )
}

export default function BattlePage() {
  const router = useRouter()
  const { sessionUser, loading } = useUser()
  const [profile, setProfile] = useState<BattleProfile | null>(null)
  const [log, setLog] = useState<BattleLogItem[] | null>(null)

  // Only touch the server for people who already have a session; visitors get
  // a guest session when they start their first battle.
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

  const rating = profile?.rating ?? STARTING_RATING
  const next = getNextRank(rating)
  const noSession = !loading && !sessionUser

  return (
    <PageContainer>
      <TopBar
        large
        title="Battle"
        actions={
          <IconButton label="Leaderboard" onClick={() => router.push('/leaderboard')}>
            <Trophy size={20} strokeWidth={1.75} />
          </IconButton>
        }
      />

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={profile?.username ?? 'You'} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg-2">
            {profile ? profile.username : 'You'}
            {profile?.is_guest && <span className="text-fg-3"> · guest</span>}
          </p>
          <RankBadge rating={rating} size="md" className="mt-1" />
        </div>
        <div className="text-right">
          <p className="num text-[28px] leading-8 tracking-[-0.03em]">{rating.toLocaleString('en-IN')}</p>
          <p className="text-xs text-fg-3">{next ? `${next.minRating - rating} to ${next.name}` : 'Top rank'}</p>
        </div>
      </Card>

      <Link href="/battle/new" className="hover:no-underline">
        <Button size="lg" fullWidth>
          <Swords size={20} strokeWidth={1.75} /> New battle
        </Button>
      </Link>
      {noSession && (
        <p className="text-center text-[13px] text-fg-3">No account needed. You’ll play as a guest.</p>
      )}

      <h2 className="mt-2 text-[15px] font-semibold">Recent battles</h2>
      {log === null && sessionUser ? (
        <Card className="flex flex-col gap-4 p-4">
          <Skeleton lines={2} />
          <Skeleton lines={2} />
        </Card>
      ) : !log?.length ? (
        <Card>
          <EmptyState
            compact
            icon={<Swords size={24} strokeWidth={1.75} />}
            title="No battles yet"
            body="Your battles and challenges will show up here."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {log.map((item, i) => (
            <LogRow key={item.battle_id} item={item} divider={i < log.length - 1} onOpen={() => router.push(playPath(item.battle_id))} />
          ))}
        </Card>
      )}
    </PageContainer>
  )
}
