'use client'

import { useState, useEffect } from 'react'
import { Trophy, Search, UserPlus, Swords, MapPin, Building2, Globe, Loader2, Sparkles } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { cn } from '@/lib/utils'

interface LeaderboardModalProps {
  open: boolean
  onClose: () => void
  userRating: number
  userName: string
  userCollege?: string | null
  onChallengeDoctor?: (name: string, rating: number) => void
}

type TabKey = 'national' | 'state' | 'college'

interface LeaderboardDoctor {
  rank: number
  userId: string
  name: string
  username: string
  rating: number
  college: string
  state: string
  avatarKey: string
  isYou: boolean
}

export function LeaderboardModal({
  open,
  onClose,
  userRating,
  userName,
  userCollege,
  onChallengeDoctor,
}: LeaderboardModalProps) {
  const [tab, setTab] = useState<TabKey>('national')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const [doctors, setDoctors] = useState<LeaderboardDoctor[]>([])
  const [loading, setLoading] = useState(false)
  const [userRank, setUserRank] = useState<number>(1)

  useEffect(() => {
    if (!open) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      // Offline / guest state: show only the current player
      setDoctors([
        {
          rank: 1,
          userId: 'current-user',
          name: userName,
          username: userName.toLowerCase().replace(/\s+/g, '_'),
          rating: userRating,
          college: userCollege || 'Your College',
          state: 'India',
          avatarKey: '🦉',
          isYou: true,
        },
      ])
      setUserRank(1)
      return
    }

    setLoading(true)
    supabase
      .from('battle_profiles')
      .select('user_id, battle_username, avatar_key, rating, college, state')
      .order('rating', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setLoading(false)
        if (error || !data || data.length === 0) {
          // Fallback to current user as first doctor
          setDoctors([
            {
              rank: 1,
              userId: 'current-user',
              name: userName,
              username: userName.toLowerCase().replace(/\s+/g, '_'),
              rating: userRating,
              college: userCollege || 'Your College',
              state: 'India',
              avatarKey: '🦉',
              isYou: true,
            },
          ])
          setUserRank(1)
          return
        }

        const list: LeaderboardDoctor[] = (data as any[]).map((row, index) => {
          const isYou = row.battle_username === userName || row.user_id === 'current'
          return {
            rank: index + 1,
            userId: row.user_id,
            name: row.battle_username || 'Doctor',
            username: (row.battle_username || 'doc').toLowerCase().replace(/\s+/g, '_'),
            rating: row.rating ?? 1000,
            college: row.college || 'Medical Aspirant',
            state: row.state || 'India',
            avatarKey: row.avatar_key || '🩺',
            isYou,
          }
        })

        // Check if user is in list, if not add user in correct sorted position
        const foundIndex = list.findIndex((d) => d.name === userName)
        if (foundIndex >= 0) {
          setUserRank(foundIndex + 1)
        } else {
          // Insert user at rank based on rating
          const newDoc: LeaderboardDoctor = {
            rank: 0,
            userId: 'current-user',
            name: userName,
            username: userName.toLowerCase().replace(/\s+/g, '_'),
            rating: userRating,
            college: userCollege || 'Your College',
            state: 'India',
            avatarKey: '🦉',
            isYou: true,
          }
          const merged = [...list, newDoc].sort((a, b) => b.rating - a.rating)
          const finalDocs = merged.map((d, i) => ({ ...d, rank: i + 1 }))
          setDoctors(finalDocs)
          const myRank = finalDocs.findIndex((d) => d.isYou)
          setUserRank(myRank >= 0 ? myRank + 1 : 1)
          return
        }

        setDoctors(list)
      })
  }, [open, userName, userRating, userCollege])

  function toggleFollow(username: string) {
    setFollowing((prev) => ({ ...prev, [username]: !prev[username] }))
  }

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.username.toLowerCase().includes(q) ||
      d.college.toLowerCase().includes(q)

    if (tab === 'college' && userCollege) {
      return matchesSearch && d.college.toLowerCase().includes(userCollege.toLowerCase().slice(0, 5))
    }
    return matchesSearch
  })

  return (
    <Sheet open={open} onClose={onClose} showClose className="sm:max-w-2xl md:max-w-3xl">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <Trophy size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
              Competitive Standings
            </span>
          </div>
          <h2 className="text-2xl font-extrabold font-[var(--font-display)] mt-1">Medical Leaderboard</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Ranked live among registered medical aspirants and doctors across India.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] gap-1">
          {[
            { key: 'national' as TabKey, label: 'National', icon: Globe },
            { key: 'state' as TabKey, label: 'State', icon: MapPin },
            { key: 'college' as TabKey, label: 'My College', icon: Building2 },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all',
                tab === t.key
                  ? 'bg-white dark:bg-neutral-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
              )}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search registered doctors, colleges, states..."
            className="pl-9 h-10 text-xs"
          />
        </div>

        {/* Your Ranking Highlight */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white font-black text-xs">
              #{userRank}
            </span>
            <Avatar initials={userName.slice(0, 2).toUpperCase()} size={38} />
            <div>
              <p className="text-sm font-bold">{userName} (You)</p>
              <p className="text-[11px] text-neutral-500 truncate">{userCollege || 'Medical Aspirant'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black font-[var(--font-display)] text-brand-600 dark:text-brand-400">
              {userRating} Elo
            </span>
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Your Rating</p>
          </div>
        </div>

        {/* Standings List */}
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400 text-xs">
              <Loader2 className="animate-spin text-brand-500" size={20} />
              <span>Loading live standings…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No doctors found matching your query.
            </div>
          ) : (
            filtered.map((doc) => {
              const isFollowed = following[doc.username]
              return (
                <div
                  key={doc.userId || doc.username}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border transition-all',
                    doc.isYou
                      ? 'border-brand-500/40 bg-brand-500/10 dark:bg-brand-500/15'
                      : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/20 dark:bg-[var(--color-surface-dark-muted)]/20 hover:border-brand-500/30',
                  )}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <span
                      className={cn(
                        'text-xs font-black',
                        doc.rank === 1
                          ? 'text-amber-500 text-sm'
                          : doc.rank === 2
                            ? 'text-neutral-400 text-sm'
                            : doc.rank === 3
                              ? 'text-amber-700 text-sm'
                              : 'text-neutral-400',
                      )}
                    >
                      {doc.rank === 1 ? '🥇' : doc.rank === 2 ? '🥈' : doc.rank === 3 ? '🥉' : `#${doc.rank}`}
                    </span>
                  </div>

                  <Avatar initials={doc.name.slice(0, 2).toUpperCase()} size={36} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold truncate">
                        {doc.name} {doc.isYou && '(You)'}
                      </p>
                      <span className="text-[10px] text-neutral-400">@{doc.username}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {doc.college} · {doc.state}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold font-[var(--font-display)] text-brand-600 dark:text-brand-400">
                      {doc.rating} Elo
                    </span>

                    {!doc.isYou && onChallengeDoctor && (
                      <button
                        onClick={() => onChallengeDoctor(doc.name, doc.rating)}
                        className="flex h-8 px-2.5 items-center gap-1 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 text-[11px] font-bold hover:text-white transition-all"
                      >
                        <Swords size={12} /> Duel
                      </button>
                    )}

                    {!doc.isYou && (
                      <button
                        onClick={() => toggleFollow(doc.username)}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                          isFollowed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
                        )}
                        aria-label="Follow user"
                      >
                        <UserPlus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Sheet>
  )
}

