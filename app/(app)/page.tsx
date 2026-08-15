'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Trophy,
  Swords,
  BookOpen,
  Brain,
  Sun,
  Moon,
  ChevronRight,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { PageContainer } from '@/components/layout/PageContainer'
import { QuickBattleOnboarding } from '@/components/onboarding/QuickBattleOnboarding'
import { useTheme } from '@/lib/theme'
import { useUser } from '@/features/auth/user-provider'
import { useDisplayName } from '@/features/auth/use-display-name'
import { getRank } from '@/lib/config/ranks'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

const trending = ['Acute Pancreatitis', 'Nephrotic Syndrome', 'TB Pharmacotherapy', 'Wilms Tumor', 'Aortic Dissection', 'Kawasaki Disease']

function greeting(hour: number) {
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function AuthedHome() {
  const { user } = useUser()
  const { theme, toggleTheme, mounted } = useTheme()
  const name = useDisplayName()
  const [hello, setHello] = useState('Welcome')

  // Real profile data
  const [rating, setRating] = useState<number>(1000)
  const [streak, setStreak] = useState<number>(0)
  const [games, setGames] = useState<number>(0)
  const [wins, setWins] = useState<number>(0)

  useEffect(() => {
    setHello(greeting(new Date().getHours()))
  }, [])

  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    supabase
      .from('battle_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        const profile = data as Database['public']['Tables']['battle_profiles']['Row'] | null
        if (profile) {
          if (typeof profile.rating === 'number') setRating(profile.rating)
          if (typeof profile.current_streak === 'number') setStreak(profile.current_streak)
          if (typeof profile.games === 'number') setGames(profile.games)
          if (typeof profile.wins === 'number') setWins(profile.wins)
        }
      })
  }, [user])

  const initials = name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR'
  const rank = getRank(rating)

  return (
    <PageContainer>
      {/* Header Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 font-medium">{hello},</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)]">{name}</h1>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Avatar initials={initials} size={42} />
        </div>
      </div>

      {/* Multi-column Grid on Laptop/Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (7 of 12) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6">
          {/* Daily progress hero */}
          <Card className="p-6 overflow-hidden relative shadow-md">
            <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-brand-500/10 blur-2xl" />
            <div className="flex items-center justify-between relative">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Diagnostic Rating & League
                  </p>
                  <p className="text-3xl font-black font-[var(--font-display)] mt-1">
                    {rating} <span className="text-sm font-bold text-brand-600 dark:text-brand-400">Elo · {rank.name}</span>
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
                      <Flame size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold leading-none">{streak} days</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold leading-none">{wins} / {games}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Battles Won</p>
                    </div>
                  </div>
                </div>
              </div>
              <ProgressRing progress={games > 0 ? Math.min(100, Math.round((wins / games) * 100)) : 0} size={100} strokeWidth={10}>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black font-[var(--font-display)]">
                    {games > 0 ? `${Math.round((wins / games) * 100)}%` : '--'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Win Rate</span>
                </div>
              </ProgressRing>
            </div>
          </Card>

          {/* Quick actions */}
          <div>
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Start Battle', icon: Swords, tone: 'gold', href: '/battle' },
                { label: 'Review Flashcards', icon: Brain, tone: 'info', href: '/flashcards' },
                { label: 'Browse QBank', icon: BookOpen, tone: 'brand', href: '/qbank' },
              ].map((a) => (
                <Link key={a.label} href={a.href}>
                  <Card interactive className="flex flex-col items-center justify-center gap-3 py-5 px-3 text-center h-full hover:border-brand-500/40 transition-colors">
                    <div
                      className={
                        a.tone === 'brand'
                          ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : a.tone === 'gold'
                            ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400'
                            : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-info-500/10 text-info-600 dark:text-info-400'
                      }
                    >
                      <a.icon size={22} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold leading-tight">{a.label}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Battle of the day */}
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-brand-600 to-brand-800 border-0 text-white shadow-xl shadow-brand-900/20">
            <motion.div
              animate={{ rotate: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-4 -top-4 opacity-20 pointer-events-none"
            >
              <Swords size={120} />
            </motion.div>
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-100">
                <Zap size={14} /> Battle Arena Duel
              </div>
              <div>
                <p className="text-xl font-extrabold font-[var(--font-display)]">Live Medical Matchmaking</p>
                <p className="text-sm text-brand-100/90 mt-0.5">Rapid Fire & Blitz 1v1 duels against peer doctors</p>
              </div>
              <Link href="/battle" className="w-fit">
                <Button size="md" className="bg-white !text-brand-700 shadow-lg w-fit mt-1 font-bold" variant="secondary">
                  Enter Battle Arena <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column (5 of 12) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6">
          {/* Daily Challenge */}
          <Link href="/battle">
            <Card interactive className="p-5 flex items-center gap-4 hover:border-gold-500/40 transition-colors">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
                <Target size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">Daily Clinical Duel</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Timed 1v1 battle · Rating & XP rewards</p>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </Card>
          </Link>

          {/* Recent battles status */}
          <div>
            <SectionHeader title="Your Battles" />
            {games === 0 ? (
              <Card className="p-6 text-center flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Swords size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm">No battles played yet</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[240px] mx-auto">
                    Challenge a peer doctor in a 1v1 clinical duel to climb the national leaderboard.
                  </p>
                </div>
                <Link href="/battle">
                  <Button size="sm" className="font-bold mt-1">
                    Play First Battle
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{games} Matches Completed</p>
                  <p className="text-xs text-neutral-500">{wins} Victories · {games - wins} Defeats</p>
                </div>
                <Link href="/battle">
                  <Button size="sm" variant="secondary" className="font-semibold text-xs">
                    Arena History
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Trending topics */}
          <div>
            <SectionHeader title="Trending High-Yield Topics" icon={<TrendingUp size={18} className="text-brand-500" />} />
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <Card key={t} interactive className="px-3.5 py-2">
                  <span className="text-xs font-semibold">{t}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default function HomePage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <PageContainer>
        <div className="h-44 rounded-[24px] bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] animate-pulse" />
      </PageContainer>
    )
  }

  return user ? <AuthedHome /> : <QuickBattleOnboarding />
}

