import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Deck, Flashcard, CardReview, SRSRating, StudySessionStats } from '@/features/flashcards/types'
import { calculateNextReview, isCardDue } from '@/features/flashcards/srs'
import { OFFICIAL_DECKS, CATALOG_DECKS } from '@/features/flashcards/official-decks'

// Special Mistake Notebook Deck ID
export const MISTAKE_DECK_ID = 'deck-mistake-notebook'

export const INITIAL_MISTAKE_DECK: Deck = {
  id: MISTAKE_DECK_ID,
  title: '⚡ Mistake Notebook',
  description: 'Auto-generated high-yield review cards from questions you missed during 1v1 Battles & QBank practice.',
  subject: 'Integrated Clinical',
  isOfficial: false,
  isMistakeNotebook: true,
  colorTone: 'rose',
  cardCount: 0,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
}

interface FlashcardState {
  decks: Deck[]
  cards: Flashcard[]
  reviews: Record<string, CardReview>
  studyStatsHistory: StudySessionStats[]

  // Actions - Decks
  addDeck: (title: string, subject: string, description?: string, colorTone?: Deck['colorTone']) => Deck
  updateDeck: (id: string, updates: Partial<Deck>) => void
  deleteDeck: (id: string) => void
  downloadCatalogDeck: (catalogDeckId: string) => boolean

  // Actions - Cards
  addCard: (
    deckId: string,
    front: string,
    back: string,
    opts?: { clinicalPearl?: string; mnemonic?: string; explanation?: string; subject?: string },
  ) => Flashcard
  updateCard: (id: string, updates: Partial<Flashcard>) => void
  deleteCard: (id: string) => void

  // Actions - Battle & QBank Mistake Capture
  addFromMistake: (params: {
    question: string
    correctAnswer: string
    explanation?: string
    clinicalPearl?: string
    subject?: string
  }) => Flashcard

  // Actions - SRS Review
  recordReview: (cardId: string, rating: SRSRating) => CardReview
  recordSessionStats: (stats: StudySessionStats) => void

  // Queries
  getDueCards: (deckId?: string) => Flashcard[]
  getDeckCards: (deckId: string) => Flashcard[]
  getRetentionRate: () => number
  getTotalDueCount: () => number
}

// Initial state builder
const initialOfficialDecks = [INITIAL_MISTAKE_DECK, ...OFFICIAL_DECKS.map((o) => o.deck)]
const initialOfficialCards = OFFICIAL_DECKS.flatMap((o) => o.cards)

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: initialOfficialDecks,
      cards: initialOfficialCards,
      reviews: {},
      studyStatsHistory: [],

      addDeck: (title, subject, description, colorTone = 'brand') => {
        const newDeck: Deck = {
          id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: title.trim(),
          subject: subject.trim(),
          description: description?.trim() || '',
          isOfficial: false,
          colorTone,
          cardCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ decks: [newDeck, ...state.decks] }))
        return newDeck
      },

      updateDeck: (id, updates) => {
        set((state) => ({
          decks: state.decks.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)),
        }))
      },

      deleteDeck: (id) => {
        if (id === MISTAKE_DECK_ID) return // Protect mistake notebook
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
          cards: state.cards.filter((c) => c.deckId !== id),
        }))
      },

      downloadCatalogDeck: (catalogDeckId) => {
        const catalogItem = CATALOG_DECKS.find((c) => c.id === catalogDeckId)
        if (!catalogItem) return false
        const existing = get().decks.find((d) => d.id === catalogDeckId)
        if (existing) return true // Already downloaded

        const newDeck: Deck = {
          id: catalogItem.id,
          title: catalogItem.title,
          subject: catalogItem.subject,
          description: catalogItem.description,
          isOfficial: true,
          isCatalog: true,
          colorTone: catalogItem.colorTone,
          cardCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Generate high yield starter cards for the downloaded catalog deck
        const starterCards: Flashcard[] = [
          {
            id: `card-${catalogItem.id}-1`,
            deckId: catalogItem.id,
            front: `Core High-Yield Principle in ${catalogItem.subject}: Diagnostic Criteria & Key Presentation?`,
            back: `Identify primary hallmark finding on history/exam; confirm with definitive gold-standard diagnostic modality.`,
            clinicalPearl: `Rapid diagnostic recall in ${catalogItem.subject} increases accuracy under battle pressure.`,
            subject: catalogItem.subject,
            position: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: `card-${catalogItem.id}-2`,
            deckId: catalogItem.id,
            front: `First-Line Guideline Management Protocol in ${catalogItem.subject}?`,
            back: `Hemodynamic stabilization followed by targeted etiology-specific therapy.`,
            clinicalPearl: `Review guideline updates and contraindications frequently.`,
            subject: catalogItem.subject,
            position: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: `card-${catalogItem.id}-3`,
            deckId: catalogItem.id,
            front: `Classic Board Exam Pitfall / Trap in ${catalogItem.subject}?`,
            back: `Beware of lookalike presentations; verify presence of pathognomonic negative findings.`,
            subject: catalogItem.subject,
            position: 2,
            createdAt: new Date().toISOString(),
          },
        ]

        newDeck.cardCount = starterCards.length

        set((state) => ({
          decks: [...state.decks, newDeck],
          cards: [...state.cards, ...starterCards],
        }))
        return true
      },

      addCard: (deckId, front, back, opts) => {
        const newCard: Flashcard = {
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          deckId,
          front: front.trim(),
          back: back.trim(),
          clinicalPearl: opts?.clinicalPearl?.trim(),
          mnemonic: opts?.mnemonic?.trim(),
          explanation: opts?.explanation?.trim(),
          subject: opts?.subject?.trim(),
          position: get().cards.filter((c) => c.deckId === deckId).length,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          cards: [...state.cards, newCard],
          decks: state.decks.map((d) => (d.id === deckId ? { ...d, cardCount: d.cardCount + 1 } : d)),
        }))
        return newCard
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))
      },

      deleteCard: (id) => {
        const target = get().cards.find((c) => c.id === id)
        if (!target) return
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
          decks: state.decks.map((d) => (d.id === target.deckId ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d)),
        }))
      },

      addFromMistake: ({ question, correctAnswer, explanation, clinicalPearl, subject }) => {
        // Ensure Mistake Deck exists
        let mistakeDeck = get().decks.find((d) => d.id === MISTAKE_DECK_ID)
        if (!mistakeDeck) {
          set((state) => ({ decks: [INITIAL_MISTAKE_DECK, ...state.decks] }))
        }

        const newCard: Flashcard = {
          id: `card-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          deckId: MISTAKE_DECK_ID,
          front: question.trim(),
          back: correctAnswer.trim(),
          explanation: explanation?.trim(),
          clinicalPearl: clinicalPearl?.trim(),
          subject: subject || 'Battle Review',
          position: get().cards.filter((c) => c.deckId === MISTAKE_DECK_ID).length,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          cards: [newCard, ...state.cards],
          decks: state.decks.map((d) => (d.id === MISTAKE_DECK_ID ? { ...d, cardCount: d.cardCount + 1 } : d)),
        }))
        return newCard
      },

      recordReview: (cardId, rating) => {
        const currentReview = get().reviews[cardId]
        const nextReview = calculateNextReview(currentReview, rating)
        nextReview.cardId = cardId

        set((state) => ({
          reviews: {
            ...state.reviews,
            [cardId]: nextReview,
          },
        }))
        return nextReview
      },

      recordSessionStats: (stats) => {
        set((state) => ({
          studyStatsHistory: [stats, ...state.studyStatsHistory].slice(0, 50),
        }))
      },

      getDueCards: (deckId) => {
        const { cards, reviews } = get()
        const now = new Date()
        const targetCards = deckId ? cards.filter((c) => c.deckId === deckId) : cards
        return targetCards.filter((card) => isCardDue(reviews[card.id], now))
      },

      getDeckCards: (deckId) => {
        return get().cards.filter((c) => c.deckId === deckId)
      },

      getRetentionRate: () => {
        const reviews = Object.values(get().reviews)
        if (reviews.length === 0) return 88 // Default benchmark
        let goodOrEasyCount = 0
        let totalReviewsCount = 0
        reviews.forEach((r) => {
          r.history?.forEach((h) => {
            totalReviewsCount++
            if (h.rating === 'good' || h.rating === 'easy') {
              goodOrEasyCount++
            }
          })
        })
        if (totalReviewsCount === 0) return 88
        return Math.round((goodOrEasyCount / totalReviewsCount) * 100)
      },

      getTotalDueCount: () => {
        const { cards, reviews } = get()
        const now = new Date()
        return cards.filter((c) => isCardDue(reviews[c.id], now)).length
      },
    }),
    {
      name: 'mantis-flashcards-store-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
