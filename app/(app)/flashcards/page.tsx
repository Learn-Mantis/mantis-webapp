'use client'

import { useState } from 'react'
import {
  Plus,
  Upload,
  Sparkles,
  Layers,
  Flame,
  Clock,
  BookOpenCheck,
  ChevronRight,
  RotateCw,
  Library,
  Trash2,
  FileDown,
  BookMarked,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatTile } from '@/components/ui/StatTile'
import { PageContainer } from '@/components/layout/PageContainer'
import { FlipCard } from '@/components/flashcards/FlipCard'
import { StudyArena } from '@/components/flashcards/StudyArena'
import { CreateDeckModal } from '@/components/flashcards/CreateDeckModal'
import { AddCardModal } from '@/components/flashcards/AddCardModal'
import { DeckCatalogModal } from '@/components/flashcards/DeckCatalogModal'
import { ImportExportModal } from '@/components/flashcards/ImportExportModal'
import { useFlashcardStore, MISTAKE_DECK_ID } from '@/stores/flashcards'
import { Deck, Flashcard } from '@/features/flashcards/types'
import { cn } from '@/lib/utils'

type DeckTab = 'all' | 'official' | 'custom' | 'mistakes'

export default function FlashcardsPage() {
  const {
    decks,
    cards,
    reviews,
    getDueCards,
    getRetentionRate,
    getTotalDueCount,
    deleteDeck,
  } = useFlashcardStore()

  const [activeTab, setActiveTab] = useState<DeckTab>('all')
  const [createDeckOpen, setCreateDeckOpen] = useState(false)
  const [addCardDeckId, setAddCardDeckId] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [importExportOpen, setImportExportOpen] = useState(false)

  // Active full-screen study session
  const [studyingDeck, setStudyingDeck] = useState<{ title: string; cards: Flashcard[] } | null>(null)

  const totalDueCount = getTotalDueCount()
  const retentionRate = getRetentionRate()
  const totalCardsCount = cards.length
  const totalDecksCount = decks.length

  // Filter decks by tab
  const filteredDecks = decks.filter((d) => {
    if (activeTab === 'official') return d.isOfficial && !d.isMistakeNotebook
    if (activeTab === 'custom') return !d.isOfficial && !d.isMistakeNotebook
    if (activeTab === 'mistakes') return d.isMistakeNotebook
    return true
  })

  // Start study session for a specific deck
  function handleStartDeckStudy(deck: Deck) {
    const due = getDueCards(deck.id)
    const deckCards = cards.filter((c) => c.deckId === deck.id)
    const studyCards = due.length > 0 ? due : deckCards // If none due, study all for review

    if (studyCards.length === 0) {
      setAddCardDeckId(deck.id)
      return
    }

    setStudyingDeck({
      title: deck.title,
      cards: studyCards,
    })
  }

  // Start study session for all due cards across entire library
  function handleStudyAllDue() {
    const allDue = getDueCards()
    if (allDue.length === 0) {
      // If 0 due, review official high yield cards
      setStudyingDeck({
        title: 'Daily High-Yield Recall Review',
        cards: cards.slice(0, 15),
      })
      return
    }

    setStudyingDeck({
      title: `Daily Due Review (${allDue.length} Cards)`,
      cards: allDue,
    })
  }

  return (
    <PageContainer>
      {/* Full-Screen Study Arena Active View */}
      {studyingDeck && (
        <StudyArena
          deckTitle={studyingDeck.title}
          cards={studyingDeck.cards}
          onClose={() => setStudyingDeck(null)}
        />
      )}

      {/* Modals */}
      <CreateDeckModal open={createDeckOpen} onClose={() => setCreateDeckOpen(false)} />
      <AddCardModal
        open={addCardDeckId !== null}
        defaultDeckId={addCardDeckId || undefined}
        onClose={() => setAddCardDeckId(null)}
      />
      <DeckCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <ImportExportModal open={importExportOpen} onClose={() => setImportExportOpen(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-[var(--font-display)]">
            Flashcards
          </h1>
          <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Anki-style Spaced Repetition (SM-2) memory engine for clinical mastery
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCatalogOpen(true)}
            className="gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700"
          >
            <Sparkles size={14} /> Anki Deck Catalog
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setImportExportOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Upload size={14} /> Import / Export
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDeckOpen(true)}
            className="gap-1.5 text-xs font-bold shadow-md"
          >
            <Plus size={14} /> New Deck
          </Button>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (7 of 12) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Hero reviews progress banner */}
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 border-0 text-white shadow-xl shadow-brand-900/20">
            <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-center justify-between relative">
              <div className="flex flex-col gap-3.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-100">
                    Spaced Repetition Schedule
                  </p>
                  <p className="text-3xl sm:text-4xl font-black font-[var(--font-display)] mt-0.5">
                    {totalDueCount} <span className="text-sm sm:text-base font-semibold text-brand-100">cards due today</span>
                  </p>
                </div>
                <div className="flex gap-5 text-sm">
                  <div>
                    <p className="text-xl font-extrabold leading-none">{totalDecksCount}</p>
                    <p className="text-xs text-brand-100 mt-1">Decks</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none">{retentionRate}%</p>
                    <p className="text-xs text-brand-100 mt-1">Retention</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none">{totalCardsCount}</p>
                    <p className="text-xs text-brand-100 mt-1">Total Cards</p>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block">
                <ProgressRing
                  progress={totalDueCount > 0 ? Math.min(100, Math.round((cards.length / (totalDueCount + 1)) * 10)) : 100}
                  size={96}
                  strokeWidth={9}
                  color="#ffffff"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black font-[var(--font-display)]">SM-2</span>
                    <span className="text-[9px] uppercase font-bold text-white/80">Active</span>
                  </div>
                </ProgressRing>
              </div>
            </div>

            <Button
              size="lg"
              variant="secondary"
              className="w-full mt-5 bg-white !text-brand-700 font-extrabold shadow-md gap-2"
              onClick={handleStudyAllDue}
            >
              <BookOpenCheck size={18} /> {totalDueCount > 0 ? `Review All Due (${totalDueCount} Cards)` : 'Practice High-Yield Cards'}
            </Button>
          </Card>

          {/* Deck Library Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <SectionHeader title="Your Deck Library" />

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] p-1 rounded-xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                    activeTab === 'all'
                      ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
                  )}
                >
                  All ({decks.length})
                </button>
                <button
                  onClick={() => setActiveTab('official')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                    activeTab === 'official'
                      ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
                  )}
                >
                  High-Yield ({decks.filter((d) => d.isOfficial && !d.isMistakeNotebook).length})
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0',
                    activeTab === 'custom'
                      ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
                  )}
                >
                  Custom ({decks.filter((d) => !d.isOfficial && !d.isMistakeNotebook).length})
                </button>
                <button
                  onClick={() => setActiveTab('mistakes')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0',
                    activeTab === 'mistakes'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm'
                      : 'text-rose-600/70 dark:text-rose-400/70 hover:text-rose-600',
                  )}
                >
                  ⚡ Mistakes
                </button>
              </div>
            </div>

            {/* Deck List Cards */}
            <div className="flex flex-col gap-3">
              {filteredDecks.map((deck) => {
                const deckDue = getDueCards(deck.id).length
                const deckCards = cards.filter((c) => c.deckId === deck.id)
                const isMistake = deck.isMistakeNotebook

                return (
                  <Card
                    key={deck.id}
                    className={cn(
                      'p-4 sm:p-5 flex flex-col gap-3 rounded-2xl transition-all shadow-sm hover:shadow-md border',
                      isMistake
                        ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/[0.03] to-transparent'
                        : 'border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] hover:border-brand-500/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                            isMistake
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xl'
                              : 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
                          )}
                        >
                          {isMistake ? '⚡' : <Layers size={22} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold font-[var(--font-display)] truncate">
                              {deck.title}
                            </h3>
                            {deck.isOfficial && !isMistake && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {deck.subject} · {deckCards.length} Cards
                          </p>
                        </div>
                      </div>

                      {/* Due Badge */}
                      {deckDue > 0 ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/25 shrink-0">
                          {deckDue} Due
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                    </div>

                    {deck.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {deck.description}
                      </p>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 border-t border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] pt-3 mt-1">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddCardDeckId(deck.id)}
                          className="text-xs font-bold gap-1 text-neutral-600 dark:text-neutral-300"
                        >
                          <Plus size={13} /> Add Card
                        </Button>
                        {!deck.isOfficial && !isMistake && (
                          <button
                            onClick={() => deleteDeck(deck.id)}
                            className="text-neutral-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                            title="Delete Deck"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleStartDeckStudy(deck)}
                        className={cn(
                          'gap-1.5 text-xs font-bold shadow-sm',
                          isMistake ? 'bg-rose-600 hover:bg-rose-700 text-white' : '',
                        )}
                      >
                        <BookOpenCheck size={14} /> Study Now
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Deck Catalog Explore Banner */}
          <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-transparent border-purple-500/20 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Sparkles size={22} />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Anki Repository
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold font-[var(--font-display)]">Pre-Made Medical Decks</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Download ready-to-study AnKing & High-Yield decks for Cardiology, OB-GYN, Pediatrics, and Neurology.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setCatalogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-md mt-1"
            >
              Explore Catalog <ChevronRight size={14} />
            </Button>
          </Card>

          {/* Interactive Study Sample */}
          <div>
            <SectionHeader title="Quick Practice" subtitle="Tap card to flip between question & answer" />
            <FlipCard
              cards={cards.slice(0, 10).map((c) => ({
                front: c.front,
                back: `${c.back}${c.clinicalPearl ? `\n\n💡 Pearl: ${c.clinicalPearl}` : ''}`,
              }))}
            />
          </div>

          {/* Performance Statistics Tile Grid */}
          <div>
            <SectionHeader title="Your Memory Retention" />
            <div className="grid grid-cols-3 gap-3">
              <StatTile icon={Layers} label="Mastered" value={String(cards.length)} tone="brand" />
              <StatTile icon={Flame} label="Retention" value={`${retentionRate}%`} tone="gold" />
              <StatTile icon={Clock} label="Due Today" value={String(totalDueCount)} tone="info" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
