import type { Difficulty } from '@/types/database'
import { expectedScore } from '../elo'

export interface BotRosterItem {
  id: string
  name: string
  title: string
  rating: number
  rankKey: 'intern' | 'resident' | 'registrar' | 'specialist' | 'consultant'
  rankName: string
  avatarKey: string
  college: string
  speedLabel: string
  accuracyPct: number
  avgResponseSec: number
  quote: string
  personality: string
}

export interface BotProfile {
  id: string
  name: string
  rating: number
  avatarKey: string
  college?: string | null
  rankName?: string
  title?: string
  isPracticeBot?: boolean
}

export interface BotAnswerContext {
  difficulty: Difficulty
  perQuestionSeconds: number | null
}

export interface BotAnswer {
  correct: boolean
  responseMs: number
  selectedOption: 'A' | 'B' | 'C' | 'D'
}

export interface BotStrategy {
  readonly key: string
  answer(bot: BotProfile, ctx: BotAnswerContext, correctOption: 'A' | 'B' | 'C' | 'D', rng?: () => number): BotAnswer
}

/** Pre-configured AI doctor bots across all rank tiers */
export const BOT_ROSTER: BotRosterItem[] = [
  // Tier 1: Intern (750 - 999 Elo)
  {
    id: 'bot-maya-lin',
    name: 'Dr. Maya Lin',
    title: '1st Year Intern',
    rating: 800,
    rankKey: 'intern',
    rankName: 'Intern Tier',
    avatarKey: '🩺',
    college: 'KMC Manipal',
    speedLabel: 'Deliberate (8.5s)',
    accuracyPct: 52,
    avgResponseSec: 8.5,
    quote: 'Just started my first rotation in Internal Medicine! Trying not to confuse the EKGs.',
    personality: 'Takes time on long clinical stems and occasionally falls for high-yield distractor traps.',
  },
  {
    id: 'bot-arjun-rao',
    name: 'Dr. Arjun Rao',
    title: 'Post-Intern Aspirant',
    rating: 900,
    rankKey: 'intern',
    rankName: 'Intern Tier',
    avatarKey: '🦉',
    college: 'Osmania Medical College',
    speedLabel: 'Moderate (7.8s)',
    accuracyPct: 58,
    avgResponseSec: 7.8,
    quote: 'Studying 12 hours a day for INI-CET. Still getting tripped up by acid-base disorders.',
    personality: 'Solid on anatomy basics, but struggles under rapid time constraints.',
  },

  // Tier 2: Resident (1000 - 1249 Elo)
  {
    id: 'bot-priya-nair',
    name: 'Dr. Priya Nair',
    title: 'Junior Resident (JR-1)',
    rating: 1100,
    rankKey: 'resident',
    rankName: 'Resident Tier',
    avatarKey: '🧠',
    college: 'AIIMS New Delhi',
    speedLabel: 'Steady (6.2s)',
    accuracyPct: 72,
    avgResponseSec: 6.2,
    quote: '1st year resident at AIIMS. Quick on antibiotics, sepsis protocols, and emergency guidelines.',
    personality: 'Confident on high-frequency questions, steady diagnostic pacing.',
  },
  {
    id: 'bot-vikram-sethi',
    name: 'Dr. Vikram Sethi',
    title: 'Junior Resident (JR-2)',
    rating: 1200,
    rankKey: 'resident',
    rankName: 'Resident Tier',
    avatarKey: '⚡',
    college: 'KGMU Lucknow',
    speedLabel: 'Fast (5.4s)',
    accuracyPct: 76,
    avgResponseSec: 5.4,
    quote: 'Handling casualty night shifts. Let’s see your diagnostic speed under pressure.',
    personality: 'Aggressive pacing with quick eliminations on acute surgical conditions.',
  },

  // Tier 3: Registrar (1250 - 1499 Elo)
  {
    id: 'bot-ananya-roy',
    name: 'Dr. Ananya Roy',
    title: 'Senior Registrar (SR-1)',
    rating: 1400,
    rankKey: 'registrar',
    rankName: 'Registrar Tier',
    avatarKey: '🧬',
    college: 'CMC Vellore',
    speedLabel: 'Very Fast (4.4s)',
    accuracyPct: 84,
    avgResponseSec: 4.4,
    quote: 'Critical care fellow. I don’t hesitate on multi-system organ failure vignettes.',
    personality: 'High-precision diagnostic pattern matching, rarely misses pharma interactions.',
  },
  {
    id: 'bot-kabir-mehta',
    name: 'Dr. Kabir Mehta',
    title: 'Senior Registrar (SR-2)',
    rating: 1500,
    rankKey: 'registrar',
    rankName: 'Registrar Tier',
    avatarKey: '🔬',
    college: 'JIPMER Puducherry',
    speedLabel: 'Very Fast (3.8s)',
    accuracyPct: 87,
    avgResponseSec: 3.8,
    quote: 'Ranked top 50 in INI-CET. Speed is just as crucial as accuracy in clinical battles.',
    personality: 'Lightning-fast on pathology images and pediatric milestones.',
  },

  // Tier 4: Specialist (1500 - 1799 Elo)
  {
    id: 'bot-devendra-sen',
    name: 'Dr. Devendra Sen',
    title: 'Cardiology Specialist',
    rating: 1650,
    rankKey: 'specialist',
    rankName: 'Specialist Tier',
    avatarKey: '🫀',
    college: 'PGIMER Chandigarh',
    speedLabel: 'Rapid (3.1s)',
    accuracyPct: 91,
    avgResponseSec: 3.1,
    quote: 'Over 5,000 cases reviewed. Spot diagnosis of murmurs and coronary syndromes is reflex.',
    personality: 'Nearly instant recognition of cardiology and hemodynamics vignettes.',
  },
  {
    id: 'bot-ritu-kapoor',
    name: 'Dr. Ritu Kapoor',
    title: 'Neuro-Surgical Specialist',
    rating: 1750,
    rankKey: 'specialist',
    rankName: 'Specialist Tier',
    avatarKey: '🩻',
    college: 'NIMHANS Bengaluru',
    speedLabel: 'Rapid (2.6s)',
    accuracyPct: 93,
    avgResponseSec: 2.6,
    quote: 'In the operating room, every millisecond counts. Let’s test your surgical reflexes.',
    personality: 'Formidable precision with rapid elimination of plausible distractors.',
  },

  // Tier 5: Consultant / Grandmaster (1800+ Elo)
  {
    id: 'bot-ramanathan',
    name: 'Prof. V. Ramanathan',
    title: 'Chief Professor of Medicine',
    rating: 2000,
    rankKey: 'consultant',
    rankName: 'Consultant Tier',
    avatarKey: '⚕️',
    college: 'AIIMS New Delhi',
    speedLabel: 'Master (2.0s)',
    accuracyPct: 97,
    avgResponseSec: 2.0,
    quote: 'Former NEET-PG Rank #1. Let’s see if modern medical students can outpace classic diagnostics.',
    personality: 'Grandmaster-level recall, answers in ~2 seconds with 97%+ accuracy.',
  },
  {
    id: 'bot-alistair-vance',
    name: 'Chief Dr. Alistair Vance',
    title: 'AI Medical Director (Grandmaster)',
    rating: 2200,
    rankKey: 'consultant',
    rankName: 'Grandmaster Tier',
    avatarKey: '🏆',
    college: 'Oxford / AIIMS Global Fellow',
    speedLabel: 'Supreme (1.7s)',
    accuracyPct: 99,
    avgResponseSec: 1.7,
    quote: 'Trained on 500,000 peer-reviewed clinical trials. Can you achieve a perfect score against me?',
    personality: 'Near-flawless accuracy with superhuman speed across all 19 medical subjects.',
  },
]

/** Effective "rating" of a question by difficulty */
const DIFFICULTY_RATING: Record<Difficulty, number> = {
  easy: 900,
  medium: 1300,
  hard: 1750,
}

const ALL_OPTIONS: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']

export function generateBotProfile(userRating: number = 1000): BotProfile {
  // Find a bot from the roster nearest to the user's rating with minor variance
  const targetRating = userRating + (Math.random() - 0.45) * 180
  const sorted = [...BOT_ROSTER].sort(
    (a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating),
  )
  const chosen = sorted[0] || BOT_ROSTER[2]

  return {
    id: chosen.id,
    name: chosen.name,
    rating: chosen.rating,
    avatarKey: chosen.avatarKey,
    college: chosen.college,
    rankName: chosen.rankName,
    title: chosen.title,
    isPracticeBot: false,
  }
}

export class RatingBasedBotStrategy implements BotStrategy {
  readonly key = 'rating-based'

  answer(
    bot: BotProfile,
    ctx: BotAnswerContext,
    correctOption: 'A' | 'B' | 'C' | 'D',
    rng: () => number = Math.random,
  ): BotAnswer {
    const questionDifficulty = ctx.difficulty || 'medium'
    const qRating = DIFFICULTY_RATING[questionDifficulty]

    // Calculate probability of answering correctly based on Elo formula
    const p = expectedScore(bot.rating, qRating)
    const correct = rng() < p

    const ceiling = (ctx.perQuestionSeconds ?? 15) * 1000

    // Calibrate response speed based on bot rating:
    // 2200 Elo bot -> ~1,800ms
    // 2000 Elo bot -> ~2,200ms
    // 1600 Elo bot -> ~3,200ms
    // 1100 Elo bot -> ~5,800ms
    // 800 Elo bot  -> ~9,200ms
    const ratingSpeedFactor = Math.max(0.15, Math.min(1.0, (2300 - bot.rating) / 1600))
    const baseMs = 1700 + ratingSpeedFactor * 7500

    // Add thinking jitter
    const jitter = (rng() - 0.5) * (baseMs * 0.35)
    // If bot misses, simulate lingering on distractor longer
    const missPenalty = !correct ? 800 + rng() * 1200 : 0

    const responseMs = Math.min(
      ceiling - 800,
      Math.max(1400, Math.round(baseMs + jitter + missPenalty)),
    )

    let selectedOption = correctOption
    if (!correct) {
      const distractors = ALL_OPTIONS.filter((o) => o !== correctOption)
      selectedOption = distractors[Math.floor(rng() * distractors.length)]
    }

    return { correct, responseMs, selectedOption }
  }
}

export const defaultBotStrategy = new RatingBasedBotStrategy()

