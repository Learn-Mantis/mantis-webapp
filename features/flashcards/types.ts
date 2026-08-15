export type SRSRating = 'again' | 'hard' | 'good' | 'easy'

export interface Flashcard {
  id: string
  deckId: string
  front: string
  back: string
  explanation?: string
  clinicalPearl?: string
  mnemonic?: string
  subject?: string
  tags?: string[]
  position: number
  createdAt: string
}

export interface CardReview {
  cardId: string
  ease: number          // Default 2.5, min 1.3
  intervalDays: number  // Current interval in days
  repetitions: number   // Number of consecutive successful recalls
  dueAt: string         // ISO string of next due date
  lastReviewedAt: string // ISO string of last review
  history?: {
    date: string
    rating: SRSRating
    intervalDays: number
  }[]
}

export interface Deck {
  id: string
  title: string
  description?: string
  subject: string
  isOfficial?: boolean
  isCatalog?: boolean
  isMistakeNotebook?: boolean
  colorTone?: 'brand' | 'info' | 'gold' | 'purple' | 'rose'
  cardCount: number
  cards?: Flashcard[]
  createdAt: string
  updatedAt: string
}

export interface StudySessionStats {
  deckTitle: string
  totalReviewed: number
  againCount: number
  hardCount: number
  goodCount: number
  easyCount: number
  startTime: number
  endTime: number
  xpEarned: number
}
