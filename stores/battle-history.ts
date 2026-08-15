import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BattleModeKey } from '@/lib/config/battle-modes'

export interface BattleHistoryItem {
  id: string
  mode: BattleModeKey
  categoryLabel: string
  opponent: {
    name: string
    avatarKey: string
    rating: number
    college?: string | null
    isBot: boolean
  }
  userScore: number
  opponentScore: number
  totalQuestions: number
  winner: 'user' | 'opponent' | 'draw'
  ratingDelta: number
  isPractice: boolean
  playedAt: number
}

interface BattleHistoryState {
  history: BattleHistoryItem[]
  addMatch: (match: Omit<BattleHistoryItem, 'id' | 'playedAt'>) => void
  clearHistory: () => void
}

export const useBattleHistoryStore = create<BattleHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addMatch: (match) =>
        set((state) => ({
          history: [
            {
              ...match,
              id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              playedAt: Date.now(),
            },
            ...state.history.slice(0, 29), // keep last 30 matches
          ],
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'mantis_battle_history',
    },
  ),
)
