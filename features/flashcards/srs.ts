import { CardReview, SRSRating } from './types'

export const DEFAULT_EASE = 2.5
export const MIN_EASE = 1.3

/**
 * Calculates the next SRS state for a flashcard using the SuperMemo-2 (SM-2) algorithm.
 */
export function calculateNextReview(
  prevReview: CardReview | undefined,
  rating: SRSRating,
  now: Date = new Date(),
): CardReview {
  const ease = prevReview?.ease ?? DEFAULT_EASE
  const repetitions = prevReview?.repetitions ?? 0
  const intervalDays = prevReview?.intervalDays ?? 0

  let nextEase = ease
  let nextRepetitions = repetitions
  let nextIntervalDays = 0

  switch (rating) {
    case 'again': {
      // Failed card: reset repetitions, review immediately/today
      nextRepetitions = 0
      nextIntervalDays = 0
      nextEase = Math.max(MIN_EASE, ease - 0.2)
      break
    }
    case 'hard': {
      // Recalled with effort: small interval bump, slight ease decrease
      nextRepetitions = Math.max(1, repetitions)
      nextIntervalDays = intervalDays === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2))
      nextEase = Math.max(MIN_EASE, ease - 0.15)
      break
    }
    case 'good': {
      // Normal recall: standard SM-2 expansion
      nextRepetitions = repetitions + 1
      if (nextRepetitions === 1) {
        nextIntervalDays = 1
      } else if (nextRepetitions === 2) {
        nextIntervalDays = 3
      } else {
        nextIntervalDays = Math.max(1, Math.round(intervalDays * ease))
      }
      nextEase = Math.max(MIN_EASE, ease + 0.0) // Maintain or slight adjustment
      break
    }
    case 'easy': {
      // Perfect instant recall: accelerated interval growth, ease increase
      nextRepetitions = repetitions + 1
      if (nextRepetitions === 1) {
        nextIntervalDays = 3
      } else if (nextRepetitions === 2) {
        nextIntervalDays = 6
      } else {
        nextIntervalDays = Math.max(1, Math.round(intervalDays * ease * 1.35))
      }
      nextEase = Math.min(3.2, ease + 0.15)
      break
    }
  }

  // Calculate next due timestamp
  const dueAt = new Date(now.getTime())
  if (nextIntervalDays === 0) {
    // Due in 1 minute (for same-session review)
    dueAt.setMinutes(dueAt.getMinutes() + 1)
  } else {
    dueAt.setDate(dueAt.getDate() + nextIntervalDays)
    // Set to start of day morning (6:00 AM)
    dueAt.setHours(6, 0, 0, 0)
  }

  return {
    cardId: prevReview?.cardId ?? '',
    ease: Number(nextEase.toFixed(2)),
    intervalDays: nextIntervalDays,
    repetitions: nextRepetitions,
    dueAt: dueAt.toISOString(),
    lastReviewedAt: now.toISOString(),
    history: [
      ...(prevReview?.history ?? []),
      {
        date: now.toISOString(),
        rating,
        intervalDays: nextIntervalDays,
      },
    ],
  }
}

/**
 * Returns human-friendly interval previews for the 4 grading buttons.
 */
export function getIntervalPreview(prevReview: CardReview | undefined, rating: SRSRating): string {
  const ease = prevReview?.ease ?? DEFAULT_EASE
  const repetitions = prevReview?.repetitions ?? 0
  const intervalDays = prevReview?.intervalDays ?? 0

  switch (rating) {
    case 'again':
      return '< 1m'
    case 'hard':
      return intervalDays === 0 ? '12h' : `${Math.max(1, Math.round(intervalDays * 1.2))}d`
    case 'good': {
      if (repetitions === 0) return '1d'
      if (repetitions === 1) return '3d'
      return `${Math.max(1, Math.round(intervalDays * ease))}d`
    }
    case 'easy': {
      if (repetitions === 0) return '3d'
      if (repetitions === 1) return '6d'
      return `${Math.max(1, Math.round(intervalDays * ease * 1.35))}d`
    }
  }
}

/**
 * Checks if a card is currently due for review.
 */
export function isCardDue(review: CardReview | undefined, now: Date = new Date()): boolean {
  if (!review) return true // Unreviewed cards are always due
  return new Date(review.dueAt) <= now
}
