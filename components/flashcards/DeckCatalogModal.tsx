'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Check, Sparkles, BookOpen, Star, Layers, Search } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { CATALOG_DECKS, CatalogDeckItem } from '@/features/flashcards/official-decks'
import { useFlashcardStore } from '@/stores/flashcards'
import { cn } from '@/lib/utils'

interface DeckCatalogModalProps {
  open: boolean
  onClose: () => void
  onDownloaded?: () => void
}

export function DeckCatalogModal({ open, onClose, onDownloaded }: DeckCatalogModalProps) {
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { decks, downloadCatalogDeck } = useFlashcardStore()

  const installedDeckIds = new Set(decks.map((d) => d.id))

  const filtered = CATALOG_DECKS.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      c.description?.toLowerCase().includes(q)
    )
  })

  function handleDownload(deckItem: CatalogDeckItem) {
    setDownloadingId(deckItem.id)
    setTimeout(() => {
      downloadCatalogDeck(deckItem.id)
      setDownloadingId(null)
      toast.success(`"${deckItem.title}" installed to your library!`)
      if (onDownloaded) onDownloaded()
    }, 400)
  }

  return (
    <Dialog open={open} onClose={onClose} showClose className="sm:max-w-2xl md:max-w-3xl">
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Anki Medical Repository
            </span>
          </div>
          <DialogTitle>Pre-Made High-Yield Deck Catalog</DialogTitle>
          <DialogDescription>
            Download curated, verified medical decks compiled by top rankers and faculty across India.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by subject, topic (e.g. ECG, OBGYN, Neuro)..."
            className="pl-9 h-10 text-xs"
          />
        </div>

        {/* Catalog List */}
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-xs">
              No decks found matching &quot;{search}&quot;.
            </div>
          ) : (
            filtered.map((item) => {
              const isInstalled = installedDeckIds.has(item.id)
              const isDownloading = downloadingId === item.id

              return (
                <Card
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] hover:border-brand-500/30 transition-all shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        {item.subject}
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1 font-semibold">
                        <Star size={12} className="text-amber-500 fill-amber-500" /> {item.ratingScore} ({item.downloadsCount.toLocaleString()} downloads)
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold font-[var(--font-display)]">{item.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="text-[11px] text-neutral-400 font-medium">By {item.authorName}</span>
                      <span className="text-neutral-300 dark:text-neutral-600">·</span>
                      <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                        {item.cardCount} High-Yield Cards
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end sm:justify-center">
                    {isInstalled ? (
                      <Button size="sm" variant="secondary" disabled className="gap-1.5 font-bold text-xs">
                        <Check size={14} className="text-emerald-500" /> Installed
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(item)}
                        disabled={isDownloading}
                        className="gap-1.5 font-bold text-xs shadow-md"
                      >
                        <Download size={14} />
                        {isDownloading ? 'Downloading…' : 'Download Deck'}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </Dialog>
  )
}
