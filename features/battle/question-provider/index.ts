import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { MedMcqaProvider } from './medmcqa-provider'
import type { QuestionProvider } from './types'

export type { BattleQuestion, QuestionProvider, QuestionQuery } from './types'

/**
 * Factory for the active question provider. Swap the implementation here to move
 * off MedMCQA (e.g. to an original question bank) without touching Battle logic.
 */
export function getQuestionProvider(client: SupabaseClient<Database>): QuestionProvider {
  return new MedMcqaProvider(client)
}
