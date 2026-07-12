/**
 * Battle game modes. Rules per product spec — change here only; never hardcode
 * counts/timers elsewhere.
 */

export type BattleModeKey = 'rapid' | 'blitz' | 'marathon'

export interface BattleModeConfig {
  key: BattleModeKey
  label: string
  /** Number of questions, or 'unlimited' for time-boxed modes. */
  questionCount: number | 'unlimited'
  /** Seconds allowed per question, or null when there is no per-question timer. */
  perQuestionSeconds: number | null
  /** Total match duration in seconds, or null when the mode ends after N questions. */
  totalSeconds: number | null
  tagline: string
  description: string
}

export const BATTLE_MODES: Record<BattleModeKey, BattleModeConfig> = {
  rapid: {
    key: 'rapid',
    label: 'Rapid Fire',
    questionCount: 'unlimited',
    perQuestionSeconds: null,
    totalSeconds: 5 * 60,
    tagline: '5 min · unlimited',
    description: 'Answer as many as you can in 5 minutes. Most correct wins.',
  },
  blitz: {
    key: 'blitz',
    label: 'Blitz',
    questionCount: 15,
    perQuestionSeconds: 20,
    totalSeconds: null,
    tagline: '15 questions · 20s each',
    description: '15 questions, 20 seconds each. No pausing, no going back.',
  },
  marathon: {
    key: 'marathon',
    label: 'Marathon',
    questionCount: 30,
    perQuestionSeconds: null,
    totalSeconds: null,
    tagline: '30 questions · no timer',
    description: '30 questions at your own pace. No going back once answered.',
  },
}

export const BATTLE_MODE_LIST: BattleModeConfig[] = [
  BATTLE_MODES.rapid,
  BATTLE_MODES.blitz,
  BATTLE_MODES.marathon,
]
