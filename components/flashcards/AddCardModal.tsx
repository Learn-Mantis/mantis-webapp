'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Sparkles, Lightbulb } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Field'
import { useFlashcardStore } from '@/stores/flashcards'

interface AddCardModalProps {
  open: boolean
  defaultDeckId?: string
  onClose: () => void
}

export function AddCardModal({ open, defaultDeckId, onClose }: AddCardModalProps) {
  const { decks, addCard } = useFlashcardStore()
  const [selectedDeckId, setSelectedDeckId] = useState(defaultDeckId || decks[0]?.id || '')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [clinicalPearl, setClinicalPearl] = useState('')
  const [mnemonic, setMnemonic] = useState('')

  const activeDeckId = defaultDeckId || selectedDeckId

  function handleSave(andAddAnother: boolean = false) {
    if (!front.trim() || !back.trim()) {
      toast.error('Please fill in both the Question (Front) and Answer (Back)')
      return
    }

    const targetDeck = decks.find((d) => d.id === activeDeckId) || decks[0]
    if (!targetDeck) {
      toast.error('No deck selected')
      return
    }

    addCard(targetDeck.id, front, back, {
      clinicalPearl: clinicalPearl.trim() || undefined,
      mnemonic: mnemonic.trim() || undefined,
      subject: targetDeck.subject,
    })

    toast.success(`Card added to "${targetDeck.title}"!`)
    setFront('')
    setBack('')
    setClinicalPearl('')
    setMnemonic('')

    if (!andAddAnother) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} showClose className="sm:max-w-lg">
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Sparkles size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Card Editor
            </span>
          </div>
          <DialogTitle>Add Clinical Flashcard</DialogTitle>
          <DialogDescription>
            Add a high-yield question, verified answer, and clinical pearls for spaced repetition.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 py-1 max-h-[60vh] overflow-y-auto pr-1">
          {/* Deck Select */}
          {!defaultDeckId && (
            <div className="flex flex-col gap-1">
              <Label>Target Deck</Label>
              <Select value={selectedDeckId} onChange={(e) => setSelectedDeckId(e.target.value)}>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.cardCount} cards)
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Front */}
          <div className="flex flex-col gap-1">
            <Label>Question / Front Prompt</Label>
            <textarea
              rows={3}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. What is the classic triad of Normal Pressure Hydrocephalus (NPH)?"
              className="w-full rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-transparent px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>

          {/* Back */}
          <div className="flex flex-col gap-1">
            <Label>Answer / Back</Label>
            <textarea
              rows={3}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. Gait Apraxia (Magnetic gait) + Urinary Incontinence + Dementia"
              className="w-full rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-transparent px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              required
            />
          </div>

          {/* Clinical Pearl (Optional) */}
          <div className="flex flex-col gap-1">
            <Label className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Lightbulb size={14} /> Clinical Pearl (Optional)
            </Label>
            <Input
              value={clinicalPearl}
              onChange={(e) => setClinicalPearl(e.target.value)}
              placeholder="e.g. Gait disturbance is the first symptom to appear and respond to VP shunt."
            />
          </div>

          {/* Mnemonic (Optional) */}
          <div className="flex flex-col gap-1">
            <Label className="text-purple-600 dark:text-purple-400">Mnemonic (Optional)</Label>
            <Input
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder='e.g. "Wet, Wobbly, and Weird"'
            />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => handleSave(true)} className="w-full sm:w-auto">
            Save & Add Another
          </Button>
          <Button type="button" onClick={() => handleSave(false)} className="w-full sm:w-auto font-bold">
            <Plus size={16} /> Save Card
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
