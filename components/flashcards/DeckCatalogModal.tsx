'use client'

import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { CATALOG_DECKS } from '@/features/flashcards/official-decks'
import { useFlashcardStore } from '@/stores/flashcards'
import { subjectName } from '@/lib/config/subjects'

interface DeckCatalogModalProps {
  open: boolean
  onClose: () => void
  onDownloaded?: () => void
}

/** Ready-made decks the student can add to their library. */
export function DeckCatalogModal({ open, onClose, onDownloaded }: DeckCatalogModalProps) {
  const [search, setSearch] = useState('')
  const decks = useFlashcardStore((s) => s.decks)
  const downloadCatalogDeck = useFlashcardStore((s) => s.downloadCatalogDeck)
  const installed = new Set(decks.map((d) => d.id))

  const q = search.trim().toLowerCase()
  const list = CATALOG_DECKS.filter(
    (c) =>
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)),
  )

  function add(id: string, title: string) {
    downloadCatalogDeck(id)
    toast.success(`Added “${title}”`)
    onDownloaded?.()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Browse decks">
      <div className="flex flex-col gap-3 pt-1">
        <TextField
          label="Search"
          placeholder="Subject or topic"
          leading={<Search size={18} strokeWidth={1.75} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {list.length === 0 ? (
          <EmptyState compact icon={<Search size={24} strokeWidth={1.75} />} title="No decks found" body="Try another subject or topic." />
        ) : (
          list.map((d) => (
            <Card key={d.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-fg">{d.title}</p>
                <p className="mt-0.5 text-[13px] text-fg-3">
                  {subjectName(d.subject)} · <span className="num">{d.cardCount}</span> cards
                </p>
                {d.description && <p className="mt-1.5 text-[13px] leading-[19px] text-fg-2">{d.description}</p>}
              </div>
              {installed.has(d.id) ? (
                <span className="flex shrink-0 items-center gap-1 pt-1 text-[13px] text-on-correct">
                  <Check size={14} strokeWidth={2.5} /> Added
                </span>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => add(d.id, d.title)}>
                  Add
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </Sheet>
  )
}
