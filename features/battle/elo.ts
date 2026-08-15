import { RATING_FLOOR } from '@/lib/config/ranks'

/**
 * Diagnostic Elo Rating System. Rating floor enforced at 750; start rating 1000 (see
 * `lib/config/ranks.ts`). Kept dependency-free and pure so it can run on the
 * server (match settlement) or client (projected deltas).
 */

export type Outcome = 'win' | 'loss' | 'draw'

const OUTCOME_SCORE: Record<Outcome, number> = { win: 1, draw: 0.5, loss: 0 }

/** Probability that a player of `rating` beats one of `opponentRating`. */
export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400))
}

/**
 * K-factor: provisional players (few games) move faster; high-rated players
 * move slower. Configurable thresholds.
 */
export function kFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < 30) return 40
  if (rating < 1600) return 24
  return 12
}

export interface RatingUpdate {
  rating: number
  delta: number
}

/**
 * Computes a single player's new rating after a game.
 * Never returns below {@link RATING_FLOOR}.
 */
export function applyResult(
  rating: number,
  opponentRating: number,
  outcome: Outcome,
  gamesPlayed: number,
): RatingUpdate {
  const expected = expectedScore(rating, opponentRating)
  const k = kFactor(rating, gamesPlayed)
  const raw = Math.round(k * (OUTCOME_SCORE[outcome] - expected))
  const next = Math.max(RATING_FLOOR, rating + raw)
  return { rating: next, delta: next - rating }
}

export interface MatchEloResult {
  winner: RatingUpdate
  loser: RatingUpdate
}

/** Convenience for settling a decisive match between two players. */
export function settleMatch(
  winnerRating: number,
  loserRating: number,
  winnerGames: number,
  loserGames: number,
): MatchEloResult {
  return {
    winner: applyResult(winnerRating, loserRating, 'win', winnerGames),
    loser: applyResult(loserRating, winnerRating, 'loss', loserGames),
  }
}
