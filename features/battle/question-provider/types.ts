import type { Difficulty } from '@/types/database'
import type { BattleCategory } from '@/lib/config/subjects'

/** Normalized question shape consumed by the Battle engine (source-agnostic). */
export interface BattleQuestion {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  correctOption: 'A' | 'B' | 'C' | 'D'
  explanation: string | null
  subject: string
  difficulty: Difficulty
}

export interface QuestionQuery {
  category: BattleCategory
  /** Total number of questions to return. */
  count: number
  /** Player rating, used to pick the difficulty mix. */
  rating: number
  /**
   * Optional seed for deterministic ordering. Phase 2 matchmaking pre-selects a
   * shared set so both players receive identical questions in identical order.
   */
  seed?: string
}

/**
 * Abstraction over any question bank (MedMCQA today; original bank / PYQs later).
 * Swapping the source must not require touching Battle logic.
 */
export interface QuestionProvider {
  readonly source: string
  getQuestions(query: QuestionQuery): Promise<BattleQuestion[]>
}
