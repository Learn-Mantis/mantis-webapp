import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { MedMcqaProvider } from './question-provider/medmcqa-provider'
import type { BattleQuestion, QuestionQuery } from './question-provider/types'
import { BATTLE_MODES, type BattleModeKey } from '@/lib/config/battle-modes'
import { BATTLE_CATEGORIES } from '@/lib/config/subjects'
import { generateBotProfile } from './bot'
import { applyResult, type RatingUpdate } from './elo'
import { getRank } from '@/lib/config/ranks'

export interface MatchPlayer {
  id: string
  name: string
  rating: number
  avatarKey: string
  college?: string | null
  isBot: boolean
}

export interface PlayerRoundRecord {
  questionIndex: number
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  correct: boolean
  responseMs: number
  scoreDelta: number
}

export interface MatchSummary {
  matchId: string
  mode: BattleModeKey
  categoryLabel: string
  user: MatchPlayer
  opponent: MatchPlayer
  questions: BattleQuestion[]
  userRecords: PlayerRoundRecord[]
  opponentRecords: PlayerRoundRecord[]
  userScore: number
  opponentScore: number
  winner: 'user' | 'opponent' | 'draw'
  userRatingUpdate: RatingUpdate
}

export async function createBattleMatch(
  modeKey: BattleModeKey,
  categoryId: string,
  userProfile: { id: string; name: string; rating: number; avatarKey: string; college?: string | null },
  specificBot?: { id: string; name: string; rating: number; avatarKey: string; college?: string | null; title?: string },
  isPractice: boolean = false,
): Promise<{
  matchId: string
  mode: BattleModeKey
  categoryLabel: string
  user: MatchPlayer
  opponent: MatchPlayer
  questions: BattleQuestion[]
  isPractice: boolean
}> {
  const modeConfig = BATTLE_MODES[modeKey] || BATTLE_MODES.blitz
  const categoryOption = BATTLE_CATEGORIES.find((c) => c.id === categoryId) ?? BATTLE_CATEGORIES[0]

  const supabase = createClient()
  const provider = new MedMcqaProvider(supabase)

  const questionCount = modeConfig.questionCount === 'unlimited' ? 80 : modeConfig.questionCount

  const query: QuestionQuery = {
    category: categoryOption.category,
    count: questionCount,
    rating: specificBot ? specificBot.rating : userProfile.rating,
  }

  const questions = await provider.getQuestions(query)
  const botOpponent = specificBot || generateBotProfile(userProfile.rating)

  const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  return {
    matchId,
    mode: modeKey,
    categoryLabel: categoryOption.label,
    user: {
      id: userProfile.id,
      name: userProfile.name,
      rating: userProfile.rating,
      avatarKey: userProfile.avatarKey,
      college: userProfile.college,
      isBot: false,
    },
    opponent: {
      id: botOpponent.id,
      name: botOpponent.name,
      rating: botOpponent.rating,
      avatarKey: botOpponent.avatarKey,
      college: botOpponent.college,
      isBot: true,
    },
    questions,
    isPractice,
  }
}

export async function settleBattleMatch(
  user: MatchPlayer,
  opponent: MatchPlayer,
  userScore: number,
  opponentScore: number,
  userGamesCount: number = 10,
  isPractice: boolean = false,
): Promise<RatingUpdate> {
  const outcome = userScore > opponentScore ? 'win' : userScore < opponentScore ? 'loss' : 'draw'

  if (isPractice) {
    return {
      rating: user.rating,
      delta: 0,
    }
  }

  const update = applyResult(user.rating, opponent.rating, outcome, userGamesCount)

  // If user is authenticated in Supabase, update their battle_profile
  try {
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (authData.user && authData.user.id === user.id) {
      const { data } = await supabase
        .from('battle_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const profile = data as Database['public']['Tables']['battle_profiles']['Row'] | null

      if (profile) {
        const newRating = update.rating
        const highestRating = Math.max(profile.highest_rating || 1000, newRating)
        const wins = profile.wins + (outcome === 'win' ? 1 : 0)
        const losses = profile.losses + (outcome === 'loss' ? 1 : 0)
        const streak = outcome === 'win' ? (profile.current_streak || 0) + 1 : 0
        const newRank = getRank(newRating).key

        await supabase
          .from('battle_profiles')
          .update({
            rating: newRating,
            highest_rating: highestRating,
            games: (profile.games || 0) + 1,
            wins,
            losses,
            current_streak: streak,
            rank_key: newRank,
          })
          .eq('user_id', user.id)
      }
    }
  } catch (err) {
    console.warn('Could not persist match stats to Supabase (guest or offline):', err)
  }

  return update
}
