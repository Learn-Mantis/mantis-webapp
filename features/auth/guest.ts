'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { battleApi, BattleApiError, type BattleProfile } from '@/features/battle/api'

/**
 * Guests play battles under a Supabase anonymous session with a pseudonymous
 * "Guest-…" battle profile, so their results count (including Elo). The server
 * hands back a merge secret; after the person signs up or logs in we redeem it
 * to move their games (and, for a fresh account, their rating) across.
 */

const MERGE_SECRET_KEY = 'mantis_guest_merge'

function readSecret(): string | null {
  try {
    return localStorage.getItem(MERGE_SECRET_KEY)
  } catch {
    return null
  }
}

function writeSecret(secret: string | null) {
  try {
    if (secret) localStorage.setItem(MERGE_SECRET_KEY, secret)
    else localStorage.removeItem(MERGE_SECRET_KEY)
  } catch {
    // storage unavailable (private mode) — the guest's games just won't merge
  }
}

/**
 * Makes sure there is a session (account or guest) with a battle profile.
 * Starts a guest session when nobody is signed in.
 */
export async function ensurePlayer(): Promise<BattleProfile> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new BattleApiError('not_configured')

  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw new BattleApiError('guest_disabled')
  }

  const profile = await battleApi.ensureProfile()
  if (profile.is_guest && profile.merge_secret) writeSecret(profile.merge_secret)
  return profile
}

/** Redeems a stored guest secret for the signed-in account. Safe to call often. */
export async function mergeStoredGuest(): Promise<{ merged: boolean; ratingAdopted: boolean }> {
  const secret = readSecret()
  if (!secret) return { merged: false, ratingAdopted: false }
  try {
    const res = await battleApi.mergeGuest(secret)
    writeSecret(null)
    return { merged: res.merged, ratingAdopted: Boolean(res.rating_adopted) }
  } catch {
    // Keep the secret for a later attempt (e.g. offline).
    return { merged: false, ratingAdopted: false }
  }
}
