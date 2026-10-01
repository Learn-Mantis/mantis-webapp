'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { battleApi, BattleApiError, type AnswerResult, type BattleState, type Option, type ServedQuestion } from './api'

export type RunPhase = 'loading' | 'question' | 'revealing' | 'finished' | 'error'

export interface Verdict {
  selected: Option | null
  correct: boolean
  correctOption: Option
  bot: AnswerResult['bot']
}

/**
 * Drives one player's run through a server-authoritative battle. Presentation
 * components read from this and call `answer` / `leave`; all timing is
 * anchored to server timestamps so reloads and slow devices can't stretch the
 * clock.
 */
export function useBattleRun(battleId: string) {
  const [phase, setPhaseState] = useState<RunPhase>('loading')
  const [state, setState] = useState<BattleState | null>(null)
  const [question, setQuestionState] = useState<ServedQuestion | null>(null)
  const [selected, setSelected] = useState<Option | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(0)
  const [offset, setOffset] = useState(0) // server time − local time
  const [answeredAt, setAnsweredAt] = useState(0) // freezes the question clock during the reveal

  const offsetRef = useRef(0)
  const phaseRef = useRef<RunPhase>('loading')
  const questionRef = useRef<ServedQuestion | null>(null)
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishingRef = useRef(false)

  // Refs mirror state for use inside async callbacks.
  const setPhase = useCallback((p: RunPhase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])
  const setQuestion = useCallback((q: ServedQuestion | null) => {
    questionRef.current = q
    setQuestionState(q)
  }, [])

  const serverNow = useCallback(() => Date.now() + offsetRef.current, [])

  const absorb = useCallback((s: BattleState) => {
    const o = Date.parse(s.server_now) - Date.now()
    offsetRef.current = o
    setOffset(o)
    setNow(Date.now())
    setState(s)
  }, [])

  const showStateQuestion = useCallback(
    (s: BattleState) => {
      if (s.me.finished || !s.question) {
        setQuestion(null)
        setPhase('finished')
        return
      }
      const q = s.question
      const wait = Date.parse(q.served_at) - (Date.now() + offsetRef.current)
      const show = () => {
        setQuestion(q)
        setSelected(null)
        setVerdict(null)
        setPhase('question')
      }
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current)
      if (wait > 30) nextTimerRef.current = setTimeout(show, wait)
      else show()
    },
    [setPhase, setQuestion],
  )

  // Start / resume.
  useEffect(() => {
    let cancelled = false
    battleApi
      .play(battleId)
      .then((s) => {
        if (cancelled) return
        absorb(s)
        showStateQuestion(s)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof BattleApiError ? e.message : 'Could not load this battle.')
        setPhase('error')
      })
    return () => {
      cancelled = true
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current)
    }
  }, [battleId, absorb, showStateQuestion, setPhase])

  const answer = useCallback(
    async (option: Option | null) => {
      const q = questionRef.current
      if (phaseRef.current !== 'question' || !q) return
      setSelected(option)
      setAnsweredAt(Date.now())
      setPhase('revealing')
      try {
        const res = await battleApi.answer(battleId, q.index, option)
        absorb(res.state)
        if (!res.accepted) {
          showStateQuestion(res.state)
          return
        }
        setVerdict({
          selected: res.selected ?? null,
          correct: Boolean(res.correct),
          correctOption: res.correct_option as Option,
          bot: res.bot ?? null,
        })
        if (res.state.me.finished) {
          // Let the last verdict sit for the same reveal pause.
          nextTimerRef.current = setTimeout(() => setPhase('finished'), res.reveal_ms ?? 1500)
        } else {
          showStateQuestion(res.state)
        }
      } catch (e) {
        setError(e instanceof BattleApiError ? e.message : 'Connection problem — retrying…')
        // Resync from the server rather than guessing.
        try {
          const s = await battleApi.state(battleId)
          absorb(s)
          showStateQuestion(s)
        } catch {
          setPhase('error')
        }
      }
    },
    [battleId, absorb, showStateQuestion, setPhase],
  )

  const finishNow = useCallback(async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    try {
      const s = await battleApi.finish(battleId)
      absorb(s)
    } finally {
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current)
      setQuestion(null)
      setPhase('finished')
    }
  }, [battleId, absorb, setPhase, setQuestion])

  // Clock tick while a question is on screen.
  useEffect(() => {
    if (phase !== 'question' && phase !== 'revealing') return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [phase])

  const questionClock = phase === 'revealing' && answeredAt ? answeredAt : now
  const perQuestionLeft =
    state?.per_q_sec && question && questionClock
      ? Math.max(0, state.per_q_sec * 1000 - (questionClock + offset - Date.parse(question.served_at)))
      : null
  const overallLeft = state?.ends_at && now ? Math.max(0, Date.parse(state.ends_at) - (now + offset)) : null

  // Per-question timeout (Blitz) → submit "no answer".
  useEffect(() => {
    if (phase === 'question' && perQuestionLeft === 0) answer(null)
  }, [phase, perQuestionLeft, answer])

  // Overall clock (Rapid, live caps) → end the run.
  useEffect(() => {
    if ((phase === 'question' || phase === 'revealing') && overallLeft === 0) finishNow()
  }, [phase, overallLeft, finishNow])

  // Live battles: follow the opponent (and the final settlement) by polling.
  const opponentPending =
    state?.kind === 'live' && (state.status !== 'finished' || state.players.some((p) => !p.finished))
  useEffect(() => {
    if (!opponentPending || phase === 'loading' || phase === 'error') return
    const id = setInterval(() => {
      battleApi.state(battleId).then(absorb).catch(() => {})
    }, 2500)
    return () => clearInterval(id)
  }, [opponentPending, phase, battleId, absorb])

  // When the bot "locks in" on the current question (display only).
  const botLockedIn =
    question?.bot_ms != null && now ? now + offset >= Date.parse(question.served_at) + question.bot_ms : false

  return {
    phase,
    state,
    question,
    selected,
    verdict,
    error,
    perQuestionLeft,
    overallLeft,
    botLockedIn,
    serverNow,
    answer,
    leave: finishNow,
    refresh: useCallback(() => battleApi.state(battleId).then(absorb), [battleId, absorb]),
  }
}
