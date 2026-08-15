'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { Upload, Download, FileText, Check, AlertCircle, Sparkles } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Field'
import { useFlashcardStore } from '@/stores/flashcards'
import { Deck } from '@/features/flashcards/types'

interface ImportExportModalProps {
  open: boolean
  onClose: () => void
}

export function ImportExportModal({ open, onClose }: ImportExportModalProps) {
  const [tab, setTab] = useState<'import' | 'export'>('import')
  const [deckTitle, setDeckTitle] = useState('')
  const [subject, setSubject] = useState('General Medicine')
  const [pastedText, setPastedText] = useState('')
  const [selectedExportDeckId, setSelectedExportDeckId] = useState('')
  const [parsing, setParsing] = useState(false)

  const { decks, cards, addDeck, addCard } = useFlashcardStore()

  // Parse text / CSV / TSV lines
  function parseTextCards(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    const parsed: { front: string; back: string; pearl?: string }[] = []

    for (const line of lines) {
      // Check tab separator first (standard Anki text export)
      let parts = line.split('\t')
      if (parts.length < 2) {
        // Fallback to semicolon or comma
        parts = line.split(';')
        if (parts.length < 2) {
          parts = line.split(',')
        }
      }

      if (parts.length >= 2) {
        parsed.push({
          front: parts[0].trim().replace(/^["']|["']$/g, ''),
          back: parts[1].trim().replace(/^["']|["']$/g, ''),
          pearl: parts[2] ? parts[2].trim().replace(/^["']|["']$/g, '') : undefined,
        })
      }
    }
    return parsed
  }

  // Handle .apkg or .csv file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setParsing(true)
    try {
      if (file.name.endsWith('.apkg')) {
        // Parse .apkg with JSZip
        const zip = await JSZip.loadAsync(file)
        const collection = zip.file('collection.anki2') || zip.file('collection.anki21')

        if (collection) {
          // If SQLite binary, extract text strings from binary stream
          const buffer = await collection.async('uint8array')
          const textDecoder = new TextDecoder('utf-8', { fatal: false })
          const decoded = textDecoder.decode(buffer)

          // Split notes using unit separator / null characters
          const rawNotes = decoded.match(/[\x1f\x00][^\x00\x1f]{4,300}\x1f[^\x00\x1f]{2,300}/g) || []
          const extracted: { front: string; back: string }[] = []

          for (const note of rawNotes.slice(0, 100)) {
            const parts = note.split('\x1f').filter(Boolean)
            if (parts.length >= 2) {
              const cleanFront = parts[0].replace(/<[^>]*>/g, '').trim()
              const cleanBack = parts[1].replace(/<[^>]*>/g, '').trim()
              if (cleanFront && cleanBack && cleanFront.length > 2) {
                extracted.push({ front: cleanFront, back: cleanBack })
              }
            }
          }

          if (extracted.length > 0) {
            setPastedText(extracted.map((c) => `${c.front}\t${c.back}`).join('\n'))
            setDeckTitle(file.name.replace('.apkg', ''))
            toast.success(`Extracted ${extracted.length} flashcards from ${file.name}!`)
          } else {
            toast.error('Could not extract text notes from this .apkg file. Try exporting Anki notes as .txt / .csv!')
          }
        }
      } else {
        // Text / CSV file
        const text = await file.text()
        setPastedText(text)
        setDeckTitle(file.name.replace(/\.[^/.]+$/, ''))
        toast.success(`Loaded file: ${file.name}`)
      }
    } catch (err: any) {
      toast.error(`Error reading file: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  // Submit Import
  function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deckTitle.trim()) {
      toast.error('Please enter a title for the new deck')
      return
    }

    const parsedCards = parseTextCards(pastedText)
    if (parsedCards.length === 0) {
      toast.error('No valid cards found. Ensure each line has a Question and Answer separated by Tab, Semicolon, or Comma.')
      return
    }

    const newDeck = addDeck(deckTitle, subject, `Imported deck with ${parsedCards.length} cards`, 'info')
    parsedCards.forEach((c) => {
      addCard(newDeck.id, c.front, c.back, {
        clinicalPearl: c.pearl,
        subject,
      })
    })

    toast.success(`Deck "${newDeck.title}" created with ${parsedCards.length} cards!`)
    setPastedText('')
    setDeckTitle('')
    onClose()
  }

  // Handle Export to CSV
  function handleExport() {
    const targetDeckId = selectedExportDeckId || decks[0]?.id
    const targetDeck = decks.find((d) => d.id === targetDeckId)
    if (!targetDeck) {
      toast.error('Please select a deck to export')
      return
    }

    const deckCards = cards.filter((c) => c.deckId === targetDeck.id)
    if (deckCards.length === 0) {
      toast.error('Selected deck has no cards to export')
      return
    }

    const csvContent = deckCards
      .map((c) => `"${c.front.replace(/"/g, '""')}"\t"${c.back.replace(/"/g, '""')}"\t"${(c.clinicalPearl || '').replace(/"/g, '""')}"`)
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${targetDeck.title.replace(/\s+/g, '_')}_Anki_Deck.tsv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${deckCards.length} cards! Ready to import into Anki Desktop.`)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} showClose className="sm:max-w-xl">
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Upload size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Anki & CSV Bridge
            </span>
          </div>
          <DialogTitle>Import & Export Decks</DialogTitle>
          <DialogDescription>
            Import Anki (.apkg / .tsv) and CSV cards or export your Mantis decks for Anki Desktop.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] p-1 border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)]">
          <button
            onClick={() => setTab('import')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'import' ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'
            }`}
          >
            Import Anki / CSV
          </button>
          <button
            onClick={() => setTab('export')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'export' ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'
            }`}
          >
            Export to Anki
          </button>
        </div>

        {tab === 'import' ? (
          <form onSubmit={handleImportSubmit} className="flex flex-col gap-3.5 py-1">
            {/* File Upload Box */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] flex flex-col items-center justify-center text-center gap-2 hover:border-brand-500/40 transition-colors">
              <Upload size={22} className="text-neutral-400" />
              <div>
                <p className="text-xs font-bold">Upload Anki (.apkg) or .csv / .tsv file</p>
                <p className="text-[11px] text-neutral-400">Drag & drop or click to browse</p>
              </div>
              <input
                type="file"
                accept=".apkg,.csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-500/10 file:text-brand-600 dark:file:text-brand-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Deck Name</Label>
                <Input
                  required
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder="e.g. Zanki Pharmacology"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Pharmacology"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label>Or Paste Cards Text Directly</Label>
                <span className="text-[10px] text-neutral-400">Question [Tab] Answer</span>
              </div>
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="What is the antidote for Heparin?	Protamine Sulfate&#10;What is the antidote for Warfarin?	Vitamin K1 + 4F-PCC"
                className="w-full font-mono text-xs rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-transparent p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={parsing || !deckTitle.trim()} className="font-bold">
                {parsing ? 'Parsing File…' : 'Import Flashcards'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Label>Select Deck to Export</Label>
              <Select value={selectedExportDeckId} onChange={(e) => setSelectedExportDeckId(e.target.value)}>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.cardCount} cards)
                  </option>
                ))}
              </Select>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Exports a tab-separated TSV file formatted specifically for <strong>Anki Desktop</strong> and <strong>Quizlet</strong> import with question front, verified answer, and clinical pearls.
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleExport} className="font-bold gap-1.5">
                <Download size={16} /> Download Anki TSV
              </Button>
            </DialogFooter>
          </div>
        )}
      </div>
    </Dialog>
  )
}
