'use client'

import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const NOT_CONFIGURED = 'Authentication will be available once Mantis is connected to Supabase.'

export async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    toast.info(NOT_CONFIGURED)
    return
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) toast.error(error.message)
}

export { NOT_CONFIGURED }
