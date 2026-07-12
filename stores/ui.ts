import { create } from 'zustand'

interface UIState {
  authGateOpen: boolean
  authGateReason?: string
  openAuthGate: (reason?: string) => void
  closeAuthGate: () => void
}

/** Lightweight global UI state (auth-gate sheet visibility). */
export const useUIStore = create<UIState>((set) => ({
  authGateOpen: false,
  authGateReason: undefined,
  openAuthGate: (reason) => set({ authGateOpen: true, authGateReason: reason }),
  closeAuthGate: () => set({ authGateOpen: false, authGateReason: undefined }),
}))
