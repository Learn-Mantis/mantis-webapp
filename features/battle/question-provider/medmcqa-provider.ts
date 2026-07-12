import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Difficulty } from '@/types/database'
import { difficultyCounts } from '@/lib/config/difficulty'
import type { BattleQuestion, QuestionProvider, QuestionQuery } from './types'

type QuestionRow = Database['public']['Tables']['questions']['Row']

function toBattleQuestion(row: QuestionRow): BattleQuestion {
  return {
    id: row.id,
    question: row.question,
    options: { A: row.option_a, B: row.option_b, C: row.option_c, D: row.option_d },
    correctOption: row.correct_option,
    explanation: row.explanation,
    subject: row.subject,
    difficulty: row.difficulty,
  }
}

/**
 * QuestionProvider backed by the `questions` table (rows ingested from MedMCQA).
 * Applies the rating-based difficulty mix and category filter.
 *
 * Note: deterministic shared ordering for live PvP is a Phase 2 concern — the
 * matchmaking service will pre-select and persist the set. Here we fetch a
 * difficulty-balanced sample.
 */
export class MedMcqaProvider implements QuestionProvider {
  readonly source = 'medmcqa'

  constructor(private readonly client: SupabaseClient<Database>) {}

  async getQuestions(query: QuestionQuery): Promise<BattleQuestion[]> {
    const counts = difficultyCounts(query.rating, query.count)
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

    const batches = await Promise.all(
      difficulties.map((difficulty) => this.fetchByDifficulty(query, difficulty, counts[difficulty])),
    )

    return batches.flat().slice(0, query.count)
  }

  private async fetchByDifficulty(
    query: QuestionQuery,
    difficulty: Difficulty,
    limit: number,
  ): Promise<BattleQuestion[]> {
    if (limit <= 0) return []

    let builder = this.client
      .from('questions')
      .select('*')
      .eq('source', 'medmcqa')
      .eq('is_active', true)
      .eq('difficulty', difficulty)
      .limit(limit)

    const { category } = query
    if (category.kind === 'subject') {
      builder = builder.eq('subject', category.code)
    } else if (category.kind === 'group') {
      builder = builder.eq('subject_group', category.group)
    }

    const { data, error } = await builder
    if (error) throw error
    return (data ?? []).map(toBattleQuestion)
  }
}
