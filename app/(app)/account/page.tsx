'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import {
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Swords,
  ShieldCheck,
  Bell,
  Lock,
  Sparkles,
  HelpCircle,
  LogOut,
  ChevronRight,
  Trophy,
  BookOpen,
  Flame,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Toggle } from '@/components/ui/Toggle'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { PageContainer } from '@/components/layout/PageContainer'
import { useTheme } from '@/lib/theme'
import { useUser } from '@/features/auth/user-provider'
import { useDisplayName } from '@/features/auth/use-display-name'

function AppearanceToggle() {
  const { theme, toggleTheme, mounted } = useTheme()
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
        {mounted && theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </div>
      <span className="flex-1 text-sm font-semibold">Dark Mode</span>
      <Toggle checked={mounted && theme === 'dark'} onChange={toggleTheme} />
    </div>
  )
}

function GuestAccount() {
  return (
    <PageContainer>
      <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)] pt-1">Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7">
          <Card className="relative overflow-hidden p-8 flex flex-col items-center text-center gap-5 shadow-xl">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-brand-400 to-brand-600 shadow-[var(--shadow-glow-brand)]">
              <Swords size={36} className="text-white" strokeWidth={2} />
            </div>
            <div className="relative max-w-sm">
              <h2 className="text-2xl font-black font-[var(--font-display)]">Join Mantis</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                Battle other medical students, track your rating on college leaderboards, and build flashcard decks that stick.
              </p>
            </div>
            <div className="relative w-full max-w-xs flex flex-col gap-3 mt-1">
              <Link href="/onboarding">
                <Button size="lg" className="w-full font-bold">
                  <UserPlus size={18} /> Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full font-semibold">
                  <LogIn size={18} /> Log In
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <SectionHeader title="Preferences" />
          <Card className="p-1.5">
            <AppearanceToggle />
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

function AuthedAccount() {
  const { user, signOut } = useUser()
  const name = useDisplayName()
  const router = useRouter()

  const [rating, setRating] = useState(1000)
  const [streak, setStreak] = useState(0)
  const [games, setGames] = useState(0)
  const [wins, setWins] = useState(0)
  const [battleUsername, setBattleUsername] = useState('')
  const [college, setCollege] = useState('')
  const [batch, setBatch] = useState('')

  useEffect(() => {
    if (!user) return
    const meta = user.user_metadata as { college?: string; batch?: string; battle_username?: string } | undefined
    if (meta?.college) setCollege(meta.college)
    if (meta?.batch) setBatch(meta.batch)
    if (meta?.battle_username) setBattleUsername(meta.battle_username)

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
          if (profile.battle_username) setBattleUsername(profile.battle_username)
          if (profile.college) setCollege(profile.college)
        }
      })
  }, [user])

  const initials =
    name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'DR'

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <PageContainer>
      <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)] pt-1">Account & Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (5 of 12) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Profile header */}
          <Card className="p-6 flex flex-col items-center gap-3.5 text-center relative overflow-hidden shadow-md">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-brand-500/10 blur-2xl" />
            <Avatar initials={initials} size={88} ring />
            <div>
              <p className="text-xl font-black font-[var(--font-display)]">{name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email}</p>
              {college && <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1">{college}</p>}
              {batch && <span className="inline-block text-[11px] font-bold text-neutral-400 mt-0.5">{batch}</span>}
            </div>
          </Card>

          {/* Battle profile (separate identity) */}
          <Card className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Swords size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Battle Profile</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {battleUsername ? `@${battleUsername}` : 'Anonymous competitive identity'}
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 text-xs font-bold shrink-0">
              <Trophy size={13} /> {rating} Elo
            </span>
          </Card>

          {/* Stats */}
          <div>
            <SectionHeader title="Performance Stats" />
            <div className="grid grid-cols-3 gap-3">
              <StatTile icon={BookOpen} label="Win Rate" value={games > 0 ? `${Math.round((wins / games) * 100)}%` : '100%'} tone="brand" />
              <StatTile icon={Swords} label="Battles" value={String(games)} tone="gold" />
              <StatTile icon={Flame} label="Streak" value={`${streak}d`} tone="info" />
            </div>
          </div>
        </div>

        {/* Right Column (7 of 12) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <SectionHeader title="Preferences & Account" />
          <Card className="p-1.5 flex flex-col divide-y divide-[var(--color-surface-light-border)] dark:divide-[var(--color-surface-dark-border)] shadow-md">
            <AppearanceToggle />
            {[
              { icon: ShieldCheck, label: 'Battle Username & Avatar', desc: 'Manage your in-game identity' },
              { icon: Bell, label: 'Notifications & Reminders', desc: 'Daily goals and battle alerts' },
              { icon: Lock, label: 'Privacy & Security', desc: 'Leaderboard visibility controls' },
              { icon: Sparkles, label: 'Subscription & Membership', desc: 'Free Beta Tier' },
              { icon: HelpCircle, label: 'Help & Feedback', desc: 'Report errors or request features' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => toast('Coming in a later update')}
                className="flex items-center gap-3.5 px-4 py-3.5 w-full text-left hover:bg-neutral-500/5 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 dark:text-neutral-300 shrink-0">
                  <item.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-neutral-400 shrink-0" />
              </button>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3.5 px-4 py-3.5 w-full text-left hover:bg-danger-500/5 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-500/10 text-danger-500 shrink-0">
                <LogOut size={16} />
              </div>
              <span className="flex-1 text-sm font-semibold text-danger-500">Sign Out</span>
            </button>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

export default function AccountPage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <PageContainer>
        <div className="h-44 rounded-[24px] bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] animate-pulse" />
      </PageContainer>
    )
  }

  return user ? <AuthedAccount /> : <GuestAccount />
}
