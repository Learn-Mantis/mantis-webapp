import type { Difficulty } from '@/types/database'
import { expectedScore } from '../elo'

/**
 * AI bot abstraction. Bots have ratings and perform statistically according to
 * them. IMPORTANT: bot games never affect a human's Elo (enforced by the match
 * settlement layer, Phase 2). Kept reusable and pure.
 */

export interface BotProfile {
  id: string
  name: string
  rating: number
  avatarKey: string
}

export interface BotAnswerContext {
  difficulty: Difficulty
  perQuestionSeconds: number | null
}

export interface BotAnswer {
  correct: boolean
  responseMs: number
}

export interface BotStrategy {
  readonly key: string
  answer(bot: BotProfile, ctx: BotAnswerContext, rng?: () => number): BotAnswer
}

/** Effective "rating" of a question by difficulty — configurable. */
const DIFFICULTY_RATING: Record<Difficulty, number> = {
  easy: 900,
  medium: 1300,
  hard: 1700,
}

/**
 * Default strategy: probability of a correct answer follows the Elo expected
 * score of the bot's rating vs. the question's difficulty rating. Response time
 * is faster when the bot is more confident.
 */
export class RatingBasedBotStrategy implements BotStrategy {
  readonly key = 'rating-based'

  answer(bot: BotProfile, ctx: BotAnswerContext, rng: () => number = Math.random): BotAnswer {
    const p = expectedScore(bot.rating, DIFFICULTY_RATING[ctx.difficulty])
    const correct = rng() < p

    const ceiling = (ctx.perQuestionSeconds ?? 30) * 1000
    const base = ceiling * (0.35 + (1 - p) * 0.4)
    const jitter = base * 0.3 * (rng() - 0.5)
    const responseMs = Math.min(ceiling, Math.max(1200, Math.round(base + jitter)))

    return { correct, responseMs }
  }
}

export const defaultBotStrategy = new RatingBasedBotStrategy()
