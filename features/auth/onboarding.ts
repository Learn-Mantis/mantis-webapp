const KEY = 'mantis-onboarded'

/** Whether the 3-slide onboarding has been shown on this device. */
export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // ignore (private mode / storage disabled)
  }
}
