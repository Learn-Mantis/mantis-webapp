'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Label, Select, TextAreaField, TextField } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { useFlashcardStore } from '@/stores/flashcards'

interface AddCardModalProps {
  open: boolean
  defaultDeckId?: string
  onClose: () => void
}

export function AddCardModal({ open, defaultDeckId, onClose }: AddCardModalProps) {
  const decks = useFlashcardStore((s) => s.decks)
  const addCard = useFlashcardStore((s) => s.addCard)
  const [pickedDeckId, setPickedDeckId] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [pearl, setPearl] = useState('')
  const [mnemonic, setMnemonic] = useState('')

  const deckId = pickedDeckId || defaultDeckId || decks[0]?.id || ''

  function save(another: boolean) {
    if (!front.trim() || !back.trim()) return toast.error('Fill in the question and the answer')
    const deck = decks.find((d) => d.id === deckId)
    if (!deck) return toast.error('Choose a deck')
    addCard(deck.id, front.trim(), back.trim(), {
      clinicalPearl: pearl.trim() || undefined,
      mnemonic: mnemonic.trim() || undefined,
      subject: deck.subject,
    })
    toast.success('Card added')
    setFront('')
    setBack('')
    setPearl('')
    setMnemonic('')
    if (!another) {
      setPickedDeckId('')
      onClose()
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New card"
      footer={
        <>
          <Button size="lg" fullWidth onClick={() => save(false)}>
            Save card
          </Button>
          <Button variant="ghost" fullWidth onClick={() => save(true)}>
            Save and add another
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="card-deck">Deck</Label>
          <Select id="card-deck" value={deckId} onChange={(e) => setPickedDeckId(e.target.value)}>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </Select>
        </div>
        <TextAreaField label="Question" placeholder="e.g. Classic triad of normal pressure hydrocephalus?" value={front} onChange={(e) => setFront(e.target.value)} />
        <TextAreaField label="Answer" placeholder="e.g. Gait apraxia, urinary incontinence, dementia" value={back} onChange={(e) => setBack(e.target.value)} />
        <TextField label="Clinical pearl (optional)" value={pearl} onChange={(e) => setPearl(e.target.value)} />
        <TextField label="Mnemonic (optional)" value={mnemonic} onChange={(e) => setMnemonic(e.target.value)} />
      </div>
    </Sheet>
  )
}
