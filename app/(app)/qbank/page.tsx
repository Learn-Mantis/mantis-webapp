'use client'

import { Layers, Bell, FileQuestion, BookMarked, GraduationCap, Bookmark, Lock, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuthGate } from '@/features/auth/use-auth-gate'

const upcoming = [
  { label: 'Previous Year Papers', sub: 'NEET-PG (2017–2026) & INI-CET', icon: FileQuestion },
  { label: '19 Subject QBanks', sub: '113,000+ MedMCQA clinical questions', icon: BookMarked },
  { label: 'Timed Grand Tests', sub: 'Full-length 200Q simulations', icon: GraduationCap },
  { label: 'High-Yield Bookmarks', sub: 'Custom smart revision lists', icon: Bookmark },
]

export default function QBankPage() {
  const requireAuth = useAuthGate()

  return (
    <PageContainer>
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)]">
            Question Bank
          </h1>
          <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            113,000+ Previous Year & High-Yield Clinical Questions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Hero Banner (7 of 12) */}
        <div className="lg:col-span-7">
          <Card className="relative overflow-hidden p-8 lg:p-10 flex flex-col items-center text-center gap-5 shadow-xl">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-brand-400 to-brand-600 shadow-[var(--shadow-glow-brand)]"
            >
              <Layers size={36} className="text-white" strokeWidth={2} />
            </motion.div>
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              <Database size={13} /> 113,076 Questions Ready
            </span>
            <div className="relative max-w-md">
              <h2 className="text-2xl font-black font-[var(--font-display)]">Comprehensive Medical Question Bank</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                The database is loaded with 113,000+ single-choice clinical questions across 19 subjects. Subject-wise practice modules and high-yield filters are arriving in the next release.
              </p>
            </div>
            <Button
              size="lg"
              className="relative w-full max-w-sm mt-2 font-bold shadow-lg"
              onClick={() => requireAuth({ reason: 'get notified when QBank browser launches' })}
            >
              <Bell size={18} /> Notify Me on QBank Release
            </Button>
          </Card>
        </div>

        {/* Feature Modules (5 of 12) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-0.5">
            Upcoming Modules
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {upcoming.map((f) => (
              <Card key={f.label} className="p-4 flex items-center gap-3.5 hover:border-brand-500/30 transition-colors">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-brand-600 dark:text-brand-400">
                  <f.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{f.label}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{f.sub}</p>
                </div>
                <Lock size={14} className="text-neutral-400 shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
