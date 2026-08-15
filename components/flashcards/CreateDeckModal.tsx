'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Layers, Sparkles } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Field'
import { useFlashcardStore } from '@/stores/flashcards'
import { Deck } from '@/features/flashcards/types'

const SUBJECT_OPTIONS = [
  'General Medicine',
  'Pharmacology',
  'Pathology',
  'Microbiology',
  'Surgery',
  'Cardiology',
  'Neurology',
  'Obstetrics & Gynaecology',
  'Pediatrics',
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Forensic Medicine',
  'PSM / Community Medicine',
  'Ophthalmology',
  'ENT',
  'Dermatology',
  'Radiology',
  'Psychiatry',
  'Orthopedics',
  'Anesthesia',
]

const COLOR_TONES: { key: Deck['colorTone']; label: string; class: string }[] = [
  { key: 'brand', label: 'Emerald', class: 'bg-emerald-500 text-white' },
  { key: 'info', label: 'Sky Blue', class: 'bg-sky-500 text-white' },
  { key: 'gold', label: 'Amber Gold', class: 'bg-amber-500 text-white' },
  { key: 'purple', label: 'Violet', class: 'bg-purple-500 text-white' },
  { key: 'rose', label: 'Rose Pink', class: 'bg-rose-500 text-white' },
]

interface CreateDeckModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (deck: Deck) => void
}

export function CreateDeckModal({ open, onClose, onCreated }: CreateDeckModalProps) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0])
  const [description, setDescription] = useState('')
  const [colorTone, setColorTone] = useState<Deck['colorTone']>('brand')

  const { addDeck } = useFlashcardStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a deck title')
      return
    }

    const created = addDeck(title, subject, description, colorTone)
    toast.success(`Deck "${created.title}" created!`)
    setTitle('')
    setDescription('')
    onClose()
    if (onCreated) onCreated(created)
  }

  return (
    <Dialog open={open} onClose={onClose} showClose className="sm:max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Layers size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Custom Deck
            </span>
          </div>
          <DialogTitle>Create Flashcard Deck</DialogTitle>
          <DialogDescription>
            Organize high-yield clinical facts into a spaced-repetition deck.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 py-1">
          <div className="flex flex-col gap-1">
            <Label>Deck Title</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. High-Yield Antimicrobial Pearls"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Subject</Label>
            <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Focus on mechanism of action & adverse effects"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cover Color Accent</Label>
            <div className="flex gap-2">
              {COLOR_TONES.map((tone) => (
                <button
                  key={tone.key}
                  type="button"
                  onClick={() => setColorTone(tone.key)}
                  className={`h-8 w-8 rounded-full transition-transform flex items-center justify-center ${tone.class} ${
                    colorTone === tone.key ? 'scale-110 ring-2 ring-offset-2 ring-brand-500 ring-offset-background' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={tone.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="gap-1.5 font-bold">
            <Plus size={16} /> Create Deck
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
