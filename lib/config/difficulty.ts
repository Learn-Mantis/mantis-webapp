import type { Difficulty } from '@/types/database'

/**
 * Rating-based difficulty mix for question selection. Higher rating → harder
 * questions. Configurable here; consumed by the question provider when a battle
 * requests questions.
 */

export type DifficultyDistribution = Record<Difficulty, number>

interface RatingBand {
  /** Applies to ratings strictly below this value. */
  maxRating: number
  distribution: DifficultyDistribution
}

export const DIFFICULTY_BANDS: RatingBand[] = [
  { maxRating: 1000, distribution: { easy: 0.6, medium: 0.3, hard: 0.1 } },
  { maxRating: 1300, distribution: { easy: 0.45, medium: 0.4, hard: 0.15 } },
  { maxRating: 1600, distribution: { easy: 0.3, medium: 0.45, hard: 0.25 } },
  { maxRating: 1900, distribution: { easy: 0.2, medium: 0.45, hard: 0.35 } },
  { maxRating: Infinity, distribution: { easy: 0.1, medium: 0.45, hard: 0.45 } },
]

export function distributionForRating(rating: number): DifficultyDistribution {
  return (DIFFICULTY_BANDS.find((b) => rating < b.maxRating) ?? DIFFICULTY_BANDS[DIFFICULTY_BANDS.length - 1])
    .distribution
}

/** Splits a total question count into per-difficulty counts for a rating. */
export function difficultyCounts(rating: number, total: number): DifficultyDistribution {
  const dist = distributionForRating(rating)
  const easy = Math.round(total * dist.easy)
  const medium = Math.round(total * dist.medium)
  const hard = Math.max(0, total - easy - medium)
  return { easy, medium, hard }
}
