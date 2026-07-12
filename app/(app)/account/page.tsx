'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { BookOpen, Flame } from 'lucide-react'

function AppearanceToggle() {
  const { theme, toggleTheme, mounted } = useTheme()
  return (
    <div className="flex items-center gap-3.5 px-3.5 py-3.5">
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
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">Account</h1>

      <Card className="relative overflow-hidden p-7 flex flex-col items-center text-center gap-4">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-brand-400 to-brand-600 shadow-[var(--shadow-glow-brand)]">
          <Swords size={34} className="text-white" strokeWidth={2} />
        </div>
        <div className="relative">
          <h2 className="text-xl font-extrabold font-[var(--font-display)]">Join Mantis</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-[290px] mx-auto">
            Battle other students, track your rating, and build flashcard decks that stick.
          </p>
        </div>
        <div className="relative w-full flex flex-col gap-2.5 mt-1">
          <Link href="/onboarding">
            <Button size="lg" className="w-full">
              <UserPlus size={18} /> Create Account
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full">
              <LogIn size={18} /> Log In
            </Button>
          </Link>
        </div>
      </Card>

      <div>
        <SectionHeader title="Preferences" />
        <Card className="p-1.5">
          <AppearanceToggle />
        </Card>
      </div>
    </PageContainer>
  )
}

function AuthedAccount() {
  const { user, signOut } = useUser()
  const name = useDisplayName()
  const router = useRouter()
  const initials =
    name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'M'

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    router.push('/')
  }

  return (
    <PageContainer>
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">Account</h1>

      {/* Profile header */}
      <Card className="p-5 flex flex-col items-center gap-3 text-center relative overflow-hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-brand-500/10 blur-2xl" />
        <Avatar initials={initials} size={84} ring />
        <div>
          <p className="text-lg font-extrabold font-[var(--font-display)]">{name}</p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
      </Card>

      {/* Battle profile (separate identity) */}
      <Card className="p-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Swords size={22} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[15px]">Battle Profile</p>
          <p className="text-xs text-neutral-500">Your anonymous competitive identity</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 text-xs font-bold">
          <Trophy size={13} /> 1000
        </span>
      </Card>

      {/* Stats */}
      <div>
        <SectionHeader title="Statistics" />
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={BookOpen} label="Questions" value="0" tone="brand" />
          <StatTile icon={Swords} label="Battles" value="0" tone="gold" />
          <StatTile icon={Flame} label="Streak" value="0" tone="info" />
        </div>
      </div>

      {/* Settings */}
      <div>
        <SectionHeader title="Settings" />
        <Card className="p-1.5 flex flex-col divide-y divide-[var(--color-surface-light-border)] dark:divide-[var(--color-surface-dark-border)]">
          <AppearanceToggle />
          {[
            { icon: ShieldCheck, label: 'Battle Username & Avatar' },
            { icon: Bell, label: 'Notifications' },
            { icon: Lock, label: 'Privacy' },
            { icon: Sparkles, label: 'Subscription' },
            { icon: HelpCircle, label: 'Help' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => toast('Coming in a later update')}
              className="flex items-center gap-3.5 px-3.5 py-3.5 w-full text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-500 dark:text-neutral-300">
                <item.icon size={16} />
              </div>
              <span className="flex-1 text-sm font-semibold">{item.label}</span>
              <ChevronRight size={16} className="text-neutral-400" />
            </button>
          ))}
          <button onClick={handleSignOut} className="flex items-center gap-3.5 px-3.5 py-3.5 w-full text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-500/10 text-danger-500">
              <LogOut size={16} />
            </div>
            <span className="flex-1 text-sm font-semibold text-danger-500">Sign Out</span>
          </button>
        </Card>
      </div>
    </PageContainer>
  )
}

export default function AccountPage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <PageContainer>
        <div className="h-40 rounded-[24px] bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] animate-pulse" />
      </PageContainer>
    )
  }

  return user ? <AuthedAccount /> : <GuestAccount />
}
