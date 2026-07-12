import { Plus, Upload, Download, Globe, Layers, Flame, Clock, BookOpenCheck, ChevronRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SectionHeader } from '../components/ui/SectionHeader'
import { ProgressRing } from '../components/ui/ProgressRing'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatTile } from '../components/ui/StatTile'
import { PageContainer } from '../components/layout/PageContainer'
import { FlipCard } from '../components/flashcards/FlipCard'
import { decks, flashcardSample } from '../data/mock'

const quickActions = [
  { label: 'Create Deck', icon: Plus, tone: 'brand' },
  { label: 'Upload Deck', icon: Upload, tone: 'info' },
  { label: 'Import Anki', icon: Download, tone: 'gold' },
  { label: 'Browse Community', icon: Globe, tone: 'brand' },
] as const

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  info: 'bg-info-500/10 text-info-600 dark:text-info-400',
  gold: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
}

export function Flashcards() {
  const totalDue = decks.reduce((a, d) => a + d.due, 0)

  return (
    <PageContainer>
      <h1 className="text-[22px] font-extrabold tracking-tight font-[var(--font-display)] pt-1">Flashcards</h1>

      {/* Hero */}
      <Card className="p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-info-500/10 blur-2xl" />
        <div className="flex items-center justify-between relative">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Today's Reviews</p>
              <p className="text-2xl font-extrabold font-[var(--font-display)] mt-0.5">{totalDue} <span className="text-sm font-medium text-neutral-400">cards due</span></p>
            </div>
            <div className="flex gap-5">
              <div>
                <p className="text-lg font-bold leading-none">{decks.length}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Decks</p>
              </div>
              <div>
                <p className="text-lg font-bold leading-none">86%</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Retention</p>
              </div>
              <div>
                <p className="text-lg font-bold leading-none">4.5h</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Study Time</p>
              </div>
            </div>
          </div>
          <ProgressRing progress={64} size={92} strokeWidth={9} color="var(--color-info-500)">
            <div className="flex flex-col items-center">
              <span className="text-lg font-extrabold font-[var(--font-display)]">64%</span>
              <span className="text-[10px] text-neutral-500">goal</span>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Quick actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((a) => (
            <Card key={a.label} interactive className="flex flex-col items-center justify-center gap-2 py-4 px-1.5 text-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses[a.tone]}`}>
                <a.icon size={18} />
              </div>
              <span className="text-[10.5px] font-semibold leading-tight">{a.label}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Today's review */}
      <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-info-500 to-info-600 border-0 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <BookOpenCheck size={26} />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold font-[var(--font-display)]">{totalDue} Cards Due</p>
            <p className="text-sm text-blue-100">Keep your retention streak alive</p>
          </div>
        </div>
        <Button size="md" variant="secondary" className="w-full mt-4 bg-white !text-info-600">
          Start Review
        </Button>
      </Card>

      {/* Sample flashcard */}
      <div>
        <SectionHeader title="Try a Flashcard" subtitle="Tap the card to flip" />
        <FlipCard cards={flashcardSample} />
      </div>

      {/* My decks */}
      <div>
        <SectionHeader title="My Decks" action="See all" />
        <div className="flex flex-col gap-2.5">
          {decks.map((d) => (
            <Card key={d.name} interactive className="p-4 flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Layers size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{d.name}</p>
                  {d.due > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400">
                      {d.due} due
                    </span>
                  )}
                </div>
                <ProgressBar progress={d.retention} className="h-1.5 mt-2" color="var(--color-info-500)" />
                <div className="flex justify-between text-[10.5px] text-neutral-500 mt-1.5">
                  <span>{d.cards} cards · {d.retention}% retention</span>
                  <span>{d.last}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-400 shrink-0" />
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <SectionHeader title="Your Statistics" />
        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={Layers} label="Cards Learned" value="1,240" tone="brand" />
          <StatTile icon={Flame} label="Review Streak" value="12 days" tone="gold" />
          <StatTile icon={Clock} label="Study Time" value="4.5h" tone="info" />
        </div>
      </div>
    </PageContainer>
  )
}
