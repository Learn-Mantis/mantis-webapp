'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Label, Select, TextField } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useFlashcardStore } from '@/stores/flashcards'
import type { Deck } from '@/features/flashcards/types'
import { SUBJECTS } from '@/lib/config/subjects'

interface CreateDeckModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (deck: Deck) => void
}

export function CreateDeckModal({ open, onClose, onCreated }: CreateDeckModalProps) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0].code)
  const [description, setDescription] = useState('')
  const addDeck = useFlashcardStore((s) => s.addDeck)

  function create() {
    if (!title.trim()) return toast.error('Give the deck a name')
    const deck = addDeck(title.trim(), subject, description.trim() || undefined, 'brand')
    toast.success('Deck created')
    setTitle('')
    setDescription('')
    onClose()
    onCreated?.(deck)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New deck"
      footer={
        <Button size="lg" fullWidth onClick={create}>
          Create deck
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <TextField label="Name" placeholder="e.g. Antimicrobials — high-yield" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deck-subject">Subject</Label>
          <Select id="deck-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Sheet>
  )
}
