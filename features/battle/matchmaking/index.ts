import type { BattleModeKey } from '@/lib/config/battle-modes'
import type { BattleCategory } from '@/lib/config/subjects'

/**
 * Matchmaking abstraction (Phase 2). Defines the seam so a realtime PvP queue —
 * or a bot fallback — can be implemented without changing callers. Not wired yet.
 */

export interface MatchRequest {
  userId: string
  rating: number
  mode: BattleModeKey
  category: BattleCategory
}

export type MatchResult =
  | { kind: 'human'; matchId: string; opponentBattleProfileId: string }
  | { kind: 'bot'; matchId: string; botId: string }

export interface MatchmakingService {
  /** Join the queue; resolves when matched (with a human or a rating-appropriate bot). */
  enqueue(request: MatchRequest, signal?: AbortSignal): Promise<MatchResult>
  cancel(userId: string): Promise<void>
}
