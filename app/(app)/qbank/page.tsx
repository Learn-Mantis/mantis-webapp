'use client'

import { Layers, Bell, FileQuestion, BookMarked, GraduationCap, Bookmark, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuthGate } from '@/features/auth/use-auth-gate'

const upcoming = [
  { label: 'PYQs', sub: 'NEET-PG & INI-CET', icon: FileQuestion },
  { label: 'Subject QBank', sub: '19 subjects', icon: BookMarked },
  { label: 'Grand Tests', sub: 'Timed mocks', icon: GraduationCap },
  { label: 'Bookmarks', sub: 'Saved questions', icon: Bookmark },
]

export default function QBankPage() {
  const requireAuth = useAuthGate()

  return (
    <PageContainer>
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">QBank</h1>

      {/* Coming soon hero */}
      <Card className="relative overflow-hidden p-7 flex flex-col items-center text-center gap-4">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-b from-brand-400 to-brand-600 shadow-[var(--shadow-glow-brand)]"
        >
          <Layers size={34} className="text-white" strokeWidth={2} />
        </motion.div>
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1 text-xs font-bold uppercase tracking-wide">
          Coming Soon
        </span>
        <div className="relative">
          <h2 className="text-xl font-extrabold font-[var(--font-display)]">Your complete question bank</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-[300px] mx-auto">
            Thousands of PYQs, subject-wise practice, grand tests, and deep analytics — all in one place. We&apos;re
            putting on the finishing touches.
          </p>
        </div>
        <Button size="lg" className="relative w-full mt-1" onClick={() => requireAuth({ reason: 'get notified when QBank launches' })}>
          <Bell size={18} /> Notify me when it&apos;s ready
        </Button>
      </Card>

      {/* Preview of what's coming */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 px-0.5">What&apos;s coming</p>
        <div className="grid grid-cols-2 gap-3">
          {upcoming.map((f) => (
            <Card key={f.label} className="relative p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] text-neutral-400">
                  <f.icon size={19} />
                </div>
                <Lock size={14} className="text-neutral-300 dark:text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-bold">{f.label}</p>
                <p className="text-[11px] text-neutral-500">{f.sub}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
