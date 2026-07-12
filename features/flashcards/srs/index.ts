/**
 * Spaced-repetition abstraction. Default is an SM-2 variant; swap the exported
 * `srs` to change algorithms without touching the study UI (Phase 3).
 */

export type ReviewGrade = 'remembered' | 'forgot'

export interface SrsState {
  ease: number
  intervalDays: number
  repetitions: number
  dueAt: string
}

export interface SrsAlgorithm {
  readonly key: string
  /** Initial state for a brand-new card. */
  init(now?: Date): SrsState
  /** Next state after grading a review. */
  review(state: SrsState, grade: ReviewGrade, now?: Date): SrsState
}

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_EASE = 1.3

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString()
}

/** SM-2 inspired, simplified to a binary remembered/forgot grade. */
export class Sm2Algorithm implements SrsAlgorithm {
  readonly key = 'sm2'

  init(now: Date = new Date()): SrsState {
    return { ease: 2.5, intervalDays: 0, repetitions: 0, dueAt: now.toISOString() }
  }

  review(state: SrsState, grade: ReviewGrade, now: Date = new Date()): SrsState {
    if (grade === 'forgot') {
      return { ease: Math.max(MIN_EASE, state.ease - 0.2), intervalDays: 1, repetitions: 0, dueAt: addDays(now, 1) }
    }

    const repetitions = state.repetitions + 1
    let intervalDays: number
    if (repetitions === 1) intervalDays = 1
    else if (repetitions === 2) intervalDays = 6
    else intervalDays = Math.round(state.intervalDays * state.ease)

    const ease = Math.max(MIN_EASE, state.ease + 0.1)
    return { ease, intervalDays, repetitions, dueAt: addDays(now, intervalDays) }
  }
}

export const srs: SrsAlgorithm = new Sm2Algorithm()
