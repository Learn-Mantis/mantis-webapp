'use client'

import { Plus, Upload, Download, Globe, Layers, Flame, Clock, BookOpenCheck, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatTile } from '@/components/ui/StatTile'
import { PageContainer } from '@/components/layout/PageContainer'
import { FlipCard } from '@/components/flashcards/FlipCard'
import { decks, flashcardSample } from '@/lib/mock'
import { useAuthGate } from '@/features/auth/use-auth-gate'

const quickActions = [
  { label: 'Create Deck', icon: Plus, tone: 'brand', reason: 'create a deck' },
  { label: 'Upload Deck', icon: Upload, tone: 'info', reason: 'upload a deck' },
  { label: 'Import Anki', icon: Download, tone: 'gold', reason: 'import an Anki deck' },
  { label: 'Community', icon: Globe, tone: 'brand', reason: 'browse community decks' },
] as const

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  info: 'bg-info-500/10 text-info-600 dark:text-info-400',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
}

export default function FlashcardsPage() {
  const requireAuth = useAuthGate()
  const totalDue = decks.reduce((a, d) => a + d.due, 0)

  return (
    <PageContainer>
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)]">
            Flashcards
          </h1>
          <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Spaced repetition memory training for clinical mastery
          </p>
        </div>
      </div>

      {/* Responsive 2-column Grid on Large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (6 of 12) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Hero reviews progress */}
          <Card className="p-6 relative overflow-hidden shadow-md">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-info-500/10 blur-2xl" />
            <div className="flex items-center justify-between relative">
              <div className="flex flex-col gap-3.5">
                <div>
                  <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Today&apos;s Reviews
                  </p>
                  <p className="text-3xl font-black font-[var(--font-display)] mt-0.5">
                    {totalDue} <span className="text-sm font-semibold text-neutral-400">cards due</span>
                  </p>
                </div>
                <div className="flex gap-5">
                  <div>
                    <p className="text-xl font-extrabold leading-none">{decks.length}</p>
                    <p className="text-xs text-neutral-500 mt-1">Decks</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none">86%</p>
                    <p className="text-xs text-neutral-500 mt-1">Retention</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none">4.5h</p>
                    <p className="text-xs text-neutral-500 mt-1">Study Time</p>
                  </div>
                </div>
              </div>
              <ProgressRing progress={64} size={96} strokeWidth={9} color="var(--color-info-500)">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black font-[var(--font-display)]">64%</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-500">goal</span>
                </div>
              </ProgressRing>
            </div>
          </Card>

          {/* Quick actions */}
          <div>
            <SectionHeader title="Deck Management" />
            <div className="grid grid-cols-4 gap-2.5">
              {quickActions.map((a) => (
                <button key={a.label} onClick={() => requireAuth({ reason: a.reason })} className="text-left">
                  <Card interactive className="flex flex-col items-center justify-center gap-2 py-4 px-2 text-center h-full hover:border-brand-500/40 transition-colors">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[a.tone]}`}>
                      <a.icon size={20} />
                    </div>
                    <span className="text-xs font-bold leading-tight">{a.label}</span>
                  </Card>
                </button>
              ))}
            </div>
          </div>

          {/* My decks */}
          <div>
            <SectionHeader title="My Decks" action="See all" onAction={() => requireAuth({ reason: 'view your decks' })} />
            <div className="flex flex-col gap-2.5">
              {decks.map((d) => (
                <button key={d.name} onClick={() => requireAuth({ reason: `study the ${d.name} deck` })} className="text-left">
                  <Card interactive className="p-4 flex items-center gap-3.5 hover:border-brand-500/40 transition-colors">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <Layers size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{d.name}</p>
                        {d.due > 0 && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400">
                            {d.due} due
                          </span>
                        )}
                      </div>
                      <ProgressBar progress={d.retention} className="h-2 mt-2" color="var(--color-info-500)" />
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                        <span>
                          {d.cards} cards · {d.retention}% retention
                        </span>
                        <span>{d.last}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400 shrink-0" />
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (6 of 12) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Today's review banner */}
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-info-500 to-info-600 border-0 text-white shadow-xl shadow-info-900/20">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <BookOpenCheck size={28} />
              </div>
              <div className="flex-1">
                <p className="text-xl font-black font-[var(--font-display)]">{totalDue} Cards Due for Review</p>
                <p className="text-xs text-blue-100 mt-0.5">Spaced repetition schedule is ready for today</p>
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="w-full mt-4 bg-white !text-info-600 font-bold shadow-md"
              onClick={() => requireAuth({ reason: 'start your review session' })}
            >
              Start Review Session
            </Button>
          </Card>

          {/* Interactive FlipCard */}
          <div>
            <SectionHeader title="Active Study Card" subtitle="Tap card to flip between front & back" />
            <FlipCard cards={flashcardSample} />
          </div>

          {/* Stats */}
          <div>
            <SectionHeader title="Your Statistics" />
            <div className="grid grid-cols-3 gap-3">
              <StatTile icon={Layers} label="Learned" value="1,240" tone="brand" />
              <StatTile icon={Flame} label="Streak" value="12 days" tone="gold" />
              <StatTile icon={Clock} label="Study Time" value="4.5h" tone="info" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
