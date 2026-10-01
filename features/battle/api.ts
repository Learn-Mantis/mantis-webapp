import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Difficulty, CorrectOption } from '@/types/database'
import type { BattleModeKey } from '@/lib/config/battle-modes'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Typed wrappers over the server-authoritative battle functions in
 * `supabase/migrations/0003_battles_v2.sql`. The server owns question
 * selection, answer checking, timing and ratings; the client only renders.
 */

export type BattleKind = 'live' | 'bot' | 'challenge'
export type Outcome = 'win' | 'loss' | 'draw'
export type Option = CorrectOption

export interface PlayerIdentity {
  username: string
  avatar_key: string
  rating: number
  is_guest: boolean
  is_bot: boolean
  bot_id?: string
}

export interface BattlePlayer extends PlayerIdentity {
  me: boolean
  role: 'host' | 'opponent' | 'challenger'
  rating_before: number
  rating_delta: number | null
  host_delta: number | null
  score: number
  answered: number
  total_ms: number
  started: boolean
  finished: boolean
  outcome: Outcome | null
}

export interface ServedQuestion {
  index: number
  question: string
  options: Record<Option, string>
  subject: string
  difficulty: Difficulty
  served_at: string
  /** Bot battles only: when the bot "locks in" on this question. */
  bot_ms: number | null
}

export interface BattleState {
  battle_id: string
  kind: BattleKind
  rated: boolean
  mode: BattleModeKey
  category_id: string
  status: 'active' | 'finished'
  /** Null for Rapid (served from a pool until time runs out). */
  total_questions: number | null
  per_q_sec: number | null
  limit_sec: number
  /** When the caller's run ends; null when there is no overall clock. */
  ends_at: string | null
  link_expires_at: string | null
  server_now: string
  me: {
    role: BattlePlayer['role']
    score: number
    answered: number
    index: number
    started: boolean
    finished: boolean
    outcome: Outcome | null
    rating_before: number
    rating_delta: number | null
  }
  players: BattlePlayer[]
  bot: (PlayerIdentity & { score: number; answered: number }) | null
  question: ServedQuestion | null
}

export interface AnswerResult {
  accepted: boolean
  selected?: Option | null
  correct?: boolean
  correct_option?: Option
  response_ms?: number
  reveal_ms?: number
  bot?: { selected: Option; correct: boolean; response_ms: number } | null
  state: BattleState
}

export interface ReviewAnswer {
  selected: Option | null
  correct: boolean
  response_ms: number
}

export interface ReviewItem {
  index: number
  question: string
  options: Record<Option, string>
  correct_option: Option
  explanation: string | null
  subject: string
  difficulty: Difficulty
  mine: ReviewAnswer | null
  theirs: ReviewAnswer | null
}

export interface BattleProfile {
  username: string
  avatar_key: string
  rating: number
  highest_rating: number
  games: number
  wins: number
  losses: number
  current_streak: number
  rank_key: string
  is_guest: boolean
  merge_secret: string | null
}

export interface Bot {
  id: string
  name: string
  rank_key: string
  rating: number
  blurb: string
  sort: number
}

export interface ChallengePeek {
  status: 'open' | 'used' | 'expired' | 'not_found' | 'yours' | 'own_challenge'
  battle_id?: string | null
  host?: PlayerIdentity
  host_score?: number
  host_answered?: number
  mode?: BattleModeKey
  category_id?: string
  rated?: boolean
  question_count?: number | null
  expires_at?: string | null
}

export interface ChallengeLink {
  token: string
  created_at: string
  claimed: boolean
  player: PlayerIdentity | null
  finished: boolean
  score: number | null
  outcome: Outcome | null
}

export interface BattleLogItem {
  battle_id: string
  kind: BattleKind
  rated: boolean
  mode: BattleModeKey
  category_id: string
  role: BattlePlayer['role']
  score: number
  answered: number
  finished: boolean
  outcome: Outcome | null
  rating_delta: number | null
  played_at: string
  opponent: (PlayerIdentity & { score: number }) | null
  challengers: number | null
}

export type MatchSearch = { battle_id: string } | { searching: true; waited_sec: number; window: number }

/** Friendly messages for errors raised by the battle functions. */
const ERROR_MESSAGES: Record<string, string> = {
  not_configured: 'Battles will be available once Mantis is connected to its server.',
  guest_disabled: 'Guest play isn’t switched on yet. Please log in to battle.',
  not_authenticated: 'Please start a session first.',
  no_battle_profile: 'Your battle profile is not set up yet.',
  not_enough_questions: 'Not enough questions in this category yet. Try another.',
  invalid_category: 'That subject is not available.',
  not_a_player: 'You are not part of this battle.',
  not_found: 'This challenge link does not exist.',
  used: 'This link has already been used.',
  expired: 'This challenge has expired.',
  own_challenge: 'You can’t play your own challenge link.',
  already_played: 'You have already played this challenge.',
  finish_first: 'Finish your own run before sharing links.',
  too_many_links: 'A challenge can have at most 20 links.',
  sign_in_required: 'Sign in to keep your guest games.',
}

export class BattleApiError extends Error {
  constructor(public code: string) {
    super(ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.')
  }
}

function client(): SupabaseClient<Database> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new BattleApiError('not_configured')
  return supabase
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  // The function catalogue is not part of the hand-written Database type.
  const { data, error } = await (client().rpc as unknown as (
    f: string,
    a?: Record<string, unknown>,
  ) => Promise<{ data: T; error: { message: string } | null }>)(fn, args)
  if (error) {
    const code = Object.keys(ERROR_MESSAGES).find((k) => error.message.includes(k)) ?? error.message
    throw new BattleApiError(code)
  }
  return data
}

export const battleApi = {
  ensureProfile: () => call<BattleProfile>('ensure_battle_profile'),
  mergeGuest: (secret: string) => call<{ merged: boolean; rating_adopted?: boolean }>('merge_guest', { p_secret: secret }),

  createBot: (botId: string, mode: BattleModeKey, categoryId: string) =>
    call<string>('battle_create_bot', { p_bot: botId, p_mode: mode, p_category: categoryId }),
  createChallenge: (mode: BattleModeKey, categoryId: string, rated: boolean) =>
    call<string>('challenge_create', { p_mode: mode, p_category: categoryId, p_rated: rated }),

  play: (battleId: string) => call<BattleState>('battle_play', { p_battle: battleId }),
  answer: (battleId: string, index: number, option: Option | null) =>
    call<AnswerResult>('battle_answer', { p_battle: battleId, p_index: index, p_option: option }),
  finish: (battleId: string) => call<BattleState>('battle_finish', { p_battle: battleId }),
  state: (battleId: string) => call<BattleState>('battle_state', { p_battle: battleId }),
  review: (battleId: string) => call<ReviewItem[]>('battle_review', { p_battle: battleId }),

  createLinks: (battleId: string, count = 1) =>
    call<{ tokens: string[]; expires_at: string }>('challenge_links_create', { p_battle: battleId, p_count: count }),
  listLinks: (battleId: string) => call<ChallengeLink[]>('challenge_links_list', { p_battle: battleId }),
  peekChallenge: (token: string) => call<ChallengePeek>('challenge_peek', { p_token: token }),
  claimChallenge: (token: string) => call<string>('challenge_claim', { p_token: token }),

  matchSearch: (mode: BattleModeKey, categoryId: string, rated: boolean) =>
    call<MatchSearch>('mm_search', { p_mode: mode, p_category: categoryId, p_rated: rated }),
  matchCancel: () => call<{ battle_id: string | null }>('mm_cancel'),

  myBattles: (limit = 20) => call<BattleLogItem[]>('my_battles', { p_limit: limit }),

  bots: async (): Promise<Bot[]> => {
    const { data, error } = await client().from('bots' as never).select('*').order('sort')
    if (error) throw new BattleApiError(error.message)
    return (data ?? []) as unknown as Bot[]
  },
}

/** Shareable URL for a challenge token. */
export function challengeUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/c/${token}`
}
