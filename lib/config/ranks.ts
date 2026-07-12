/**
 * Battle rank tiers + rating constants. Thresholds are configurable here and
 * consumed via helpers — never hardcode a threshold elsewhere. Medical-career
 * themed to stay professional (not gamey).
 */

export interface RankTier {
  key: string
  name: string
  minRating: number
  /** Badge accent color (hex). */
  color: string
}

export const STARTING_RATING = 1000
export const RATING_FLOOR = 750

export const RANK_TIERS: RankTier[] = [
  { key: 'intern', name: 'Intern', minRating: 750, color: '#B08D57' },
  { key: 'resident', name: 'Resident', minRating: 1000, color: '#9CA3AF' },
  { key: 'registrar', name: 'Registrar', minRating: 1250, color: '#22c55e' },
  { key: 'specialist', name: 'Specialist', minRating: 1500, color: '#3b7dfb' },
  { key: 'consultant', name: 'Consultant', minRating: 1800, color: '#f5b301' },
]

/** Returns the highest tier whose threshold the rating meets. */
export function getRank(rating: number): RankTier {
  let current = RANK_TIERS[0]
  for (const tier of RANK_TIERS) {
    if (rating >= tier.minRating) current = tier
  }
  return current
}

export function getRankByKey(key: string): RankTier | undefined {
  return RANK_TIERS.find((t) => t.key === key)
}

/** The next tier above the current rating, or null at the top. */
export function getNextRank(rating: number): RankTier | null {
  const idx = RANK_TIERS.findIndex((t) => t.key === getRank(rating).key)
  return RANK_TIERS[idx + 1] ?? null
}

/** Progress (0–100) from the current tier toward the next. 100 at max tier. */
export function rankProgress(rating: number): number {
  const current = getRank(rating)
  const next = getNextRank(rating)
  if (!next) return 100
  const span = next.minRating - current.minRating
  return Math.round(((rating - current.minRating) / span) * 100)
}
