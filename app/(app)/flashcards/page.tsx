'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowDownUp, Layers, Library, NotebookPen, Plus, SquarePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/Feedback'
import { IconButton } from '@/components/ui/IconButton'
import { ListRow } from '@/components/ui/ListRow'
import { Sheet } from '@/components/ui/Sheet'
import { Tabs } from '@/components/ui/Tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { TopBar } from '@/components/layout/TopBar'
import { StudyArena } from '@/components/flashcards/StudyArena'
import { CreateDeckModal } from '@/components/flashcards/CreateDeckModal'
import { AddCardModal } from '@/components/flashcards/AddCardModal'
import { DeckCatalogModal } from '@/components/flashcards/DeckCatalogModal'
import { ImportExportModal } from '@/components/flashcards/ImportExportModal'
import { useFlashcardStore, MISTAKE_DECK_ID } from '@/stores/flashcards'
import type { Deck, Flashcard } from '@/features/flashcards/types'
import { subjectName } from '@/lib/config/subjects'

type Tab = 'decks' | 'mistakes'

function FlashcardsScreen() {
  const params = useSearchParams()
  const decks = useFlashcardStore((s) => s.decks)
  const cards = useFlashcardStore((s) => s.cards)
  const getDueCards = useFlashcardStore((s) => s.getDueCards)
  const totalDue = useFlashcardStore((s) => s.getTotalDueCount())
  const deleteDeck = useFlashcardStore((s) => s.deleteDeck)

  const [tab, setTab] = useState<Tab>(params.get('tab') === 'mistakes' ? 'mistakes' : 'decks')
  const [menuOpen, setMenuOpen] = useState(false)
  const [createDeckOpen, setCreateDeckOpen] = useState(false)
  const [addCardDeckId, setAddCardDeckId] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [importExportOpen, setImportExportOpen] = useState(false)
  const [deckSheet, setDeckSheet] = useState<Deck | null>(null)
  const [mistakeOpen, setMistakeOpen] = useState<Flashcard | null>(null)
  const [subject, setSubject] = useState('all')
  const [studying, setStudying] = useState<{ title: string; cards: Flashcard[] } | null>(null)

  const mistakes = useMemo(() => cards.filter((c) => c.deckId === MISTAKE_DECK_ID), [cards])
  const mistakeSubjects = useMemo(() => [...new Set(mistakes.map((m) => m.subject).filter(Boolean))] as string[], [mistakes])
  const shownMistakes = subject === 'all' ? mistakes : mistakes.filter((m) => m.subject === subject)
  const libraryDecks = decks.filter((d) => !d.isMistakeNotebook)

  function studyDeck(deck: Deck) {
    const due = getDueCards(deck.id)
    const all = cards.filter((c) => c.deckId === deck.id)
    if (!all.length) {
      setAddCardDeckId(deck.id)
      return
    }
    // Nothing due: review the whole deck.
    setStudying({ title: deck.title, cards: due.length ? due : all })
  }

  function studyDue() {
    const due = getDueCards()
    if (due.length) setStudying({ title: 'Due today', cards: due })
  }

  return (
    <PageContainer>
      <TopBar
        large
        title="Flashcards"
        actions={
          <IconButton label="Add" onClick={() => setMenuOpen(true)}>
            <Plus size={20} strokeWidth={1.75} />
          </IconButton>
        }
      />
      <Tabs
        fullWidth
        value={tab}
        onChange={setTab}
        items={[
          { value: 'decks', label: 'Decks' },
          { value: 'mistakes', label: 'Mistakes', count: mistakes.length },
        ]}
      />

      {tab === 'decks' ? (
        <>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <p className="num text-[28px] leading-8 tracking-[-0.03em]" suppressHydrationWarning>
                {totalDue}
              </p>
              <p className="text-[13px] text-fg-3">cards due today</p>
            </div>
            <Button onClick={studyDue} disabled={totalDue === 0}>
              {totalDue ? 'Study now' : 'All caught up'}
            </Button>
          </Card>

          {libraryDecks.length ? (
            <Card className="overflow-hidden p-0">
              {libraryDecks.map((d, i) => {
                const due = getDueCards(d.id).length
                const count = cards.filter((c) => c.deckId === d.id).length
                return (
                  <ListRow
                    key={d.id}
                    icon={<Layers size={18} strokeWidth={1.75} />}
                    title={d.title}
                    subtitle={`${count} ${count === 1 ? 'card' : 'cards'}${d.isOfficial ? ' · Mantis' : ''}`}
                    trailing={due ? <span className="num text-[13px]">{due} due</span> : undefined}
                    chevron
                    divider={i < libraryDecks.length - 1}
                    onClick={() => setDeckSheet(d)}
                  />
                )
              })}
            </Card>
          ) : (
            <Card>
              <EmptyState
                compact
                icon={<Layers size={24} strokeWidth={1.75} />}
                title="No decks yet"
                body="Add a ready-made deck or create your own."
                action={<Button onClick={() => setCatalogOpen(true)}>Browse decks</Button>}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          {mistakeSubjects.length > 1 && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar">
              <Chip size="sm" active={subject === 'all'} onClick={() => setSubject('all')}>
                All
              </Chip>
              {mistakeSubjects.map((s) => (
                <Chip key={s} size="sm" active={subject === s} onClick={() => setSubject(s)}>
                  {subjectName(s)}
                </Chip>
              ))}
            </div>
          )}
          {shownMistakes.length ? (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setStudying({ title: 'Mistake notebook', cards: shownMistakes })}
              >
                Study {shownMistakes.length} {shownMistakes.length === 1 ? 'mistake' : 'mistakes'}
              </Button>
              <Card className="overflow-hidden p-0">
                {shownMistakes.map((m, i) => (
                  <ListRow
                    key={m.id}
                    title={m.front}
                    subtitle={m.subject ? subjectName(m.subject) : 'Battle'}
                    chevron
                    divider={i < shownMistakes.length - 1}
                    onClick={() => setMistakeOpen(m)}
                  />
                ))}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState
                compact
                icon={<NotebookPen size={24} strokeWidth={1.75} />}
                title="No mistakes here"
                body="Questions you get wrong in battles can be saved here from the review."
              />
            </Card>
          )}
        </>
      )}

      {/* Add menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Add">
        <Card className="overflow-hidden p-0">
          {[
            { icon: Library, title: 'Browse decks', sub: 'Ready-made high-yield decks', on: () => setCatalogOpen(true) },
            { icon: SquarePlus, title: 'New deck', sub: 'Start an empty deck', on: () => setCreateDeckOpen(true) },
            { icon: Plus, title: 'New card', sub: 'Add a card to any deck', on: () => setAddCardDeckId(libraryDecks[0]?.id ?? MISTAKE_DECK_ID) },
            { icon: ArrowDownUp, title: 'Import or export', sub: 'Anki-compatible files', on: () => setImportExportOpen(true) },
          ].map((a, i, all) => (
            <ListRow
              key={a.title}
              icon={<a.icon size={18} strokeWidth={1.75} />}
              title={a.title}
              subtitle={a.sub}
              chevron
              divider={i < all.length - 1}
              onClick={() => {
                setMenuOpen(false)
                a.on()
              }}
            />
          ))}
        </Card>
      </Sheet>

      {/* Deck actions */}
      <Sheet
        open={deckSheet !== null}
        onClose={() => setDeckSheet(null)}
        title={deckSheet?.title}
        footer={
          deckSheet && (
            <>
              <Button
                size="lg"
                fullWidth
                onClick={() => {
                  const d = deckSheet
                  setDeckSheet(null)
                  studyDeck(d)
                }}
              >
                Study
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const d = deckSheet
                  setDeckSheet(null)
                  setAddCardDeckId(d.id)
                }}
              >
                Add card
              </Button>
              {!deckSheet.isOfficial && (
                <Button
                  variant="ghost"
                  fullWidth
                  className="text-on-incorrect"
                  onClick={() => {
                    if (window.confirm(`Delete “${deckSheet.title}” and its cards?`)) {
                      deleteDeck(deckSheet.id)
                      setDeckSheet(null)
                    }
                  }}
                >
                  <Trash2 size={16} strokeWidth={1.75} /> Delete deck
                </Button>
              )}
            </>
          )
        }
      >
        {deckSheet && (
          <p className="text-[15px] text-fg-3">
            {deckSheet.description || subjectName(deckSheet.subject)} ·{' '}
            <span className="num">{cards.filter((c) => c.deckId === deckSheet.id).length}</span> cards ·{' '}
            <span className="num">{getDueCards(deckSheet.id).length}</span> due
          </p>
        )}
      </Sheet>

      {/* Mistake detail */}
      <Sheet open={mistakeOpen !== null} onClose={() => setMistakeOpen(null)} title="Mistake">
        {mistakeOpen && (
          <div className="flex flex-col gap-3 pb-2">
            <p className="text-[17px] leading-[27px] text-fg">{mistakeOpen.front}</p>
            <div className="rounded-2xl border border-correct-line bg-correct px-4 py-3 text-[15px] text-fg">{mistakeOpen.back}</div>
            {mistakeOpen.explanation && <p className="text-[15px] leading-6 text-fg-2">{mistakeOpen.explanation}</p>}
          </div>
        )}
      </Sheet>

      <CreateDeckModal open={createDeckOpen} onClose={() => setCreateDeckOpen(false)} />
      <AddCardModal open={addCardDeckId !== null} defaultDeckId={addCardDeckId || undefined} onClose={() => setAddCardDeckId(null)} />
      <DeckCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <ImportExportModal open={importExportOpen} onClose={() => setImportExportOpen(false)} />

      {studying && <StudyArena deckTitle={studying.title} cards={studying.cards} onClose={() => setStudying(null)} />}
    </PageContainer>
  )
}

export default function FlashcardsPage() {
  return (
    <Suspense>
      <FlashcardsScreen />
    </Suspense>
  )
}
