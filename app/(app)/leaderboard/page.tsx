'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState, RatingDelta, Skeleton } from '@/components/ui/Feedback'
import { ListRow } from '@/components/ui/ListRow'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Tabs } from '@/components/ui/Tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopBar } from '@/components/layout/TopBar'
import { RankBadge } from '@/components/battle/RankBadge'
import { battleApi, type Leaderboard, type LeaderRow } from '@/features/battle/api'
import { useUser } from '@/features/auth/user-provider'
import { getNextRank, getRank, rankProgress, RANK_TIERS, getRankByKey } from '@/lib/config/ranks'
import { cn } from '@/lib/utils'

type Period = 'week' | 'all'

function Row({ row, period, divider }: { row: LeaderRow; period: Period; divider?: boolean }) {
  return (
    <ListRow
      divider={divider}
      highlight={row.me}
      leading={
        <span className="flex items-center gap-3">
          <span className="num w-7 text-right text-[13px] text-fg-3">{row.position}</span>
          <Avatar name={row.username} size={36} />
        </span>
      }
      title={row.me ? `${row.username} (you)` : row.username}
      subtitle={<RankBadge tier={getRankByKey(row.rank_key) ?? getRank(row.rating)} />}
      trailing={
        period === 'week' ? (
          <RatingDelta value={row.value} showIcon={false} />
        ) : (
          <span className="num text-[15px] text-fg">{row.value.toLocaleString('en-IN')}</span>
        )
      }
    />
  )
}

export default function LeaderboardPage() {
  const { user } = useUser()
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<Record<Period, Leaderboard | null>>({ week: null, all: null })

  useEffect(() => {
    if (data[period]) return
    battleApi
      .leaderboard(period)
      .then((d) => setData((cur) => ({ ...cur, [period]: d })))
      .catch(() => setData((cur) => ({ ...cur, [period]: { period, rows: [], me: null } })))
  }, [period, data])

  const board = data[period]
  const me = board?.me ?? data.all?.me ?? null
  const myRating = me?.rating ?? null
  const next = myRating != null ? getNextRank(myRating) : null
  const inTop = board?.rows.some((r) => r.me)

  return (
    <PageContainer>
      <TopBar large title="Leaderboard" />
      <Tabs
        fullWidth
        value={period}
        onChange={setPeriod}
        items={[
          { value: 'week', label: 'This week' },
          { value: 'all', label: 'All-time' },
        ]}
      />

      {user && myRating != null && (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <RankBadge rating={myRating} size="md" />
            <span className="text-[13px] text-fg-3">
              {next ? (
                <>
                  <span className="num">{next.minRating - myRating}</span> to {next.name}
                </>
              ) : (
                'Top rank'
              )}
            </span>
          </div>
          <ProgressBar progress={rankProgress(myRating)} />
          <div className="flex justify-between text-[11px] text-fg-3">
            {RANK_TIERS.map((t) => (
              <span key={t.key} className={cn(t.key === getRank(myRating).key && 'font-semibold text-fg')}>
                {t.name === 'Senior Resident' ? 'Sr Resident' : t.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {!board ? (
        <Card className="flex flex-col gap-4 p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} height={36} radius={10} />
          ))}
        </Card>
      ) : board.rows.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon={<Trophy size={24} strokeWidth={1.75} />}
            title={period === 'week' ? 'No ranked games this week' : 'No players yet'}
            body={period === 'week' ? 'Play a ranked battle to get on this week’s board.' : undefined}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {board.rows.map((r, i) => (
            <Row key={`${r.position}-${r.username}`} row={r} period={period} divider={i < board.rows.length - 1 || (!inTop && !!board.me)} />
          ))}
          {!inTop && board.me && (
            <>
              <div className="border-b border-line py-1.5 text-center text-[13px] text-fg-4">···</div>
              <Row row={board.me} period={period} />
            </>
          )}
        </Card>
      )}
      <p className="text-center text-[13px] text-fg-3">
        {period === 'week' ? 'Rating gained in ranked play over the last 7 days. ' : ''}Only usernames are shown.
      </p>
    </PageContainer>
  )
}
