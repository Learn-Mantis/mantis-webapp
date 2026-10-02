'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Label, Select, TextAreaField, TextField } from '@/components/ui/Field'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Sheet } from '@/components/ui/Sheet'
import { useFlashcardStore } from '@/stores/flashcards'
import { SUBJECTS } from '@/lib/config/subjects'

const PASTE_EXAMPLE = 'Antidote for heparin?\tProtamine sulfate\nAntidote for warfarin?\tVitamin K1 + 4F-PCC'

interface ImportExportModalProps {
  open: boolean
  onClose: () => void
}

export function ImportExportModal({ open, onClose }: ImportExportModalProps) {
  const [tab, setTab] = useState<'import' | 'export'>('import')
  const [deckTitle, setDeckTitle] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0].code)
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
    } catch (err) {
      toast.error(`Couldn’t read that file: ${err instanceof Error ? err.message : 'unknown error'}`)
    } finally {
      setParsing(false)
    }
  }

  // Submit Import
  function handleImportSubmit() {
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
    <Sheet
      open={open}
      onClose={onClose}
      title="Import or export"
      footer={
        tab === 'import' ? (
          <Button size="lg" fullWidth loading={parsing} disabled={!deckTitle.trim()} onClick={() => handleImportSubmit()}>
            Import cards
          </Button>
        ) : (
          <Button size="lg" fullWidth onClick={handleExport}>
            <Download size={20} strokeWidth={1.75} /> Download for Anki
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'import', label: 'Import' },
            { value: 'export', label: 'Export' },
          ]}
        />

        {tab === 'import' ? (
          <>
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-dashed border-line-3 px-4 py-5 text-center hover:bg-hover">
              <Upload size={22} strokeWidth={1.75} className="text-fg-3" />
              <span className="text-sm font-medium text-fg">Choose a file</span>
              <span className="text-[13px] text-fg-3">Anki .apkg, or .csv / .tsv / .txt</span>
              <input type="file" accept=".apkg,.csv,.tsv,.txt" onChange={handleFileUpload} className="sr-only" />
            </label>
            <TextField label="Deck name" placeholder="e.g. Pharmacology — antidotes" value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-subject">Subject</Label>
              <Select id="import-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <TextAreaField
              label="Or paste cards"
              hint="One card per line: question, then a tab (or ; or ,), then the answer."
              rows={5}
              className="[&_textarea]:font-mono [&_textarea]:text-[13px]"
              placeholder={PASTE_EXAMPLE}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="export-deck">Deck</Label>
              <Select id="export-deck" value={selectedExportDeckId || decks[0]?.id} onChange={(e) => setSelectedExportDeckId(e.target.value)}>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-sm text-fg-3">
              Downloads a tab-separated file with question, answer and clinical pearl. Anki Desktop and Quizlet can import it.
            </p>
          </>
        )}
      </div>
    </Sheet>
  )
}
