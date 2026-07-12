'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Trophy,
  Swords,
  BookOpen,
  Brain,
  Layers,
  Sun,
  Moon,
  ChevronRight,
  Target,
  TrendingUp,
  Calendar,
  Zap,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Avatar } from '@/components/ui/Avatar'
import { PageContainer } from '@/components/layout/PageContainer'
import { useTheme } from '@/lib/theme'
import { useUser } from '@/features/auth/user-provider'
import { useAuthGate } from '@/features/auth/use-auth-gate'
import { useDisplayName } from '@/features/auth/use-display-name'
import { recentBattles, grandTests, subjects } from '@/lib/mock'
import { getRank } from '@/lib/config/ranks'

const weakSubjects = [...subjects].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)
const trending = ['Acute Pancreatitis', 'Nephrotic Syndrome', 'TB Pharmacotherapy', 'Wilms Tumor']

function greeting(hour: number) {
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const features = [
  {
    icon: Swords,
    tone: 'brand' as const,
    title: 'Battle Mode',
    badge: null,
    description:
      'Face other students in real-time matches — Rapid Fire, Blitz, or Marathon. Climb a fair, rating-based ladder from Intern to Consultant.',
    href: '/battle',
    cta: 'Explore Battle',
  },
  {
    icon: Brain,
    tone: 'info' as const,
    title: 'Flashcards',
    badge: null,
    description:
      'Build spaced-repetition decks that adapt to what you remember, browse community decks, or import an existing Anki deck.',
    href: '/flashcards',
    cta: 'Explore Flashcards',
  },
  {
    icon: Layers,
    tone: 'gold' as const,
    title: 'QBank',
    badge: 'Coming Soon',
    description:
      'An AI-powered, original question bank — plus PYQs, subject-wise practice, and deep analytics. We’re putting on the finishing touches.',
    href: '/qbank',
    cta: 'Preview QBank',
  },
]

const toneClasses = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  info: 'bg-info-500/10 text-info-600 dark:text-info-400',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
}

function GuestHome() {
  const { theme, toggleTheme, mounted } = useTheme()

  return (
    <PageContainer>
      <div className="flex items-center justify-between pt-1">
        <span className="text-lg font-extrabold font-[var(--font-display)]">
          Mantis<span className="text-brand-500">.</span>
        </span>
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
          aria-label="Toggle theme"
        >
          {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Title / hero card */}
      <Card className="relative overflow-hidden p-6 flex flex-col items-center text-center gap-4 bg-gradient-to-br from-brand-600 to-brand-800 border-0 text-white">
        <motion.div
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-6 -top-6 opacity-15"
        >
          <Sparkles size={120} />
        </motion.div>
        <div className="relative flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Sparkles size={13} /> Welcome to Mantis
          </span>
          <h1 className="text-2xl font-extrabold font-[var(--font-display)] leading-tight max-w-[280px]">
            The future of medical learning
          </h1>
          <p className="text-sm text-brand-100/90 max-w-[300px]">
            Compete in real-time battles, master concepts with smart flashcards, and soon — practice with an
            AI-powered original question bank.
          </p>
          <div className="flex flex-col w-full gap-2 mt-1">
            <Link href="/onboarding" className="w-full">
              <Button size="lg" className="w-full bg-white !text-brand-700 shadow-xl" variant="secondary">
                Get Started
              </Button>
            </Link>
            <Link href="/login" className="text-sm font-semibold text-white/90">
              I already have an account
            </Link>
          </div>
        </div>
      </Card>

      {/* Feature explainer cards */}
      <div className="flex flex-col gap-3">
        {features.map((f) => (
          <Card key={f.title} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[f.tone]}`}>
                <f.icon size={21} />
              </div>
              {f.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400">
                  {f.badge}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-[16px]">{f.title}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{f.description}</p>
            </div>
            <Link href={f.href} className="flex items-center gap-0.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
              {f.cta} <ChevronRight size={16} />
            </Link>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}

function AuthedHome() {
  const { theme, toggleTheme, mounted } = useTheme()
  const requireAuth = useAuthGate()
  const name = useDisplayName()
  const [hello, setHello] = useState('Welcome')

  useEffect(() => {
    setHello(greeting(new Date().getHours()))
  }, [])

  const initials = name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const rank = getRank(1842)

  return (
    <PageContainer>
      {/* Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{hello},</p>
          <h1 className="text-[26px] font-extrabold tracking-tight font-[var(--font-display)]">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)]"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Avatar initials={initials || 'G'} size={42} />
        </div>
      </div>

      {/* Daily progress hero */}
      <Card className="p-5 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Today&apos;s Progress
              </p>
              <p className="text-2xl font-extrabold font-[var(--font-display)] mt-0.5">
                42 / 60 <span className="text-sm font-medium text-neutral-400">questions</span>
              </p>
            </div>
            <div className="flex gap-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
                  <Flame size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">12 days</p>
                  <p className="text-[11px] text-neutral-500">Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Trophy size={17} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">1842</p>
                  <p className="text-[11px] text-neutral-500">{rank.name}</p>
                </div>
              </div>
            </div>
          </div>
          <ProgressRing progress={70} size={92} strokeWidth={9}>
            <div className="flex flex-col items-center">
              <span className="text-lg font-extrabold font-[var(--font-display)]">70%</span>
              <span className="text-[10px] text-neutral-500">daily</span>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Quick actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Continue Practice', icon: BookOpen, tone: 'brand', href: '/qbank' },
            { label: 'Start Battle', icon: Swords, tone: 'gold', href: '/battle' },
            { label: 'Review Flashcards', icon: Brain, tone: 'info', href: '/flashcards' },
          ].map((a) => (
            <Link key={a.label} href={a.href}>
              <Card interactive className="flex flex-col items-center justify-center gap-2.5 py-5 px-2 text-center h-full">
                <div
                  className={
                    a.tone === 'brand'
                      ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : a.tone === 'gold'
                        ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400'
                        : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-info-500/10 text-info-600 dark:text-info-400'
                  }
                >
                  <a.icon size={20} />
                </div>
                <span className="text-[12.5px] font-semibold leading-tight">{a.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Battle of the day */}
      <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-brand-600 to-brand-800 border-0 text-white">
        <motion.div
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-4 -top-4 opacity-20"
        >
          <Swords size={110} />
        </motion.div>
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-100">
            <Zap size={14} /> Battle of the Day
          </div>
          <div>
            <p className="text-lg font-extrabold font-[var(--font-display)]">Cardiology Blitz Challenge</p>
            <p className="text-sm text-brand-100/90 mt-0.5">15 questions · 20 sec each · 2,840 playing today</p>
          </div>
          <Button
            size="md"
            className="bg-white !text-brand-700 shadow-lg w-fit mt-1"
            variant="secondary"
            onClick={() => requireAuth({ reason: 'join the daily battle' })}
          >
            Join Now <ChevronRight size={16} />
          </Button>
        </div>
      </Card>

      {/* Daily Challenge */}
      <Card
        interactive
        className="p-4 flex items-center gap-4"
        onClick={() => requireAuth({ reason: 'start the daily challenge' })}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
          <Target size={22} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[15px]">Daily Challenge</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">10 mixed questions · +50 XP reward</p>
        </div>
        <ChevronRight size={18} className="text-neutral-400" />
      </Card>

      {/* Recent battles */}
      <div>
        <SectionHeader title="Recent Battles" action="See all" onAction={() => requireAuth({ reason: 'view your battle history' })} />
        <div className="flex flex-col gap-2.5">
          {recentBattles.slice(0, 3).map((b) => (
            <Card key={b.opponent + b.time} className="p-3.5 flex items-center gap-3">
              <Avatar initials={b.opponent.slice(0, 2).toUpperCase()} size={40} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{b.opponent}</p>
                <p className="text-xs text-neutral-500">
                  {b.time} · {b.score}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    b.result === 'win'
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'bg-danger-500/10 text-danger-600 dark:text-danger-400'
                  }`}
                >
                  {b.result === 'win' ? 'Victory' : 'Defeat'}
                </span>
                <span
                  className={`text-xs font-semibold mt-1 ${b.ratingChange > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger-500'}`}
                >
                  {b.ratingChange > 0 ? '+' : ''}
                  {b.ratingChange}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming grand test */}
      <div>
        <SectionHeader title="Upcoming Grand Test" />
        <Card className="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-info-500/10 text-info-600 dark:text-info-400">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[15px]">{grandTests[0].name}</p>
            <p className="text-xs text-neutral-500">
              {grandTests[0].date} · {grandTests[0].questions} Qs · {grandTests[0].duration}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => requireAuth({ reason: 'set a reminder' })}>
            Set Alert
          </Button>
        </Card>
      </div>

      {/* Weak subjects */}
      <div>
        <SectionHeader title="Weak Subjects" subtitle="Focus areas based on recent performance" />
        <div className="flex flex-col gap-2.5">
          {weakSubjects.map((s) => (
            <Card key={s.code} interactive className="p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-500/10 text-danger-600 dark:text-danger-400 text-xs font-bold">
                {s.accuracy}%
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-neutral-500">
                  {s.solved}/{s.total} solved
                </p>
              </div>
              <ChevronRight size={16} className="text-neutral-400" />
            </Card>
          ))}
        </div>
      </div>

      {/* Trending topics */}
      <div>
        <SectionHeader title="Trending Topics" icon={<TrendingUp size={18} className="text-brand-500" />} />
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {trending.map((t) => (
            <Card key={t} interactive className="px-4 py-3 shrink-0">
              <span className="text-sm font-semibold whitespace-nowrap">{t}</span>
            </Card>
          ))}
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
        <div className="h-40 rounded-[24px] bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] animate-pulse" />
      </PageContainer>
    )
  }

  return user ? <AuthedHome /> : <GuestHome />
}
