import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Leaderboard scopes. Ranking is by Battle rating and only ever exposes battle
 * identity (username/avatar) + geo grouping — never real names. `global` is
 * future-proofed but not surfaced yet.
 */

export type LeaderboardScope =
  | { kind: 'college'; college: string }
  | { kind: 'state'; state: string }
  | { kind: 'national'; country: string }
  | { kind: 'global' }

export type LeaderboardRow = Database['public']['Views']['leaderboard_battle']['Row']

/** Queries the privacy-safe `leaderboard_battle` view for a given scope. */
export async function fetchLeaderboard(
  client: SupabaseClient<Database>,
  scope: LeaderboardScope,
  limit = 50,
): Promise<LeaderboardRow[]> {
  let builder = client.from('leaderboard_battle').select('*').order('rating', { ascending: false }).limit(limit)

  if (scope.kind === 'college') builder = builder.eq('college', scope.college)
  else if (scope.kind === 'state') builder = builder.eq('state', scope.state)
  else if (scope.kind === 'national') builder = builder.eq('country', scope.country)

  const { data, error } = await builder
  if (error) throw error
  return data ?? []
}
