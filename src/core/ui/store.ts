import { create } from 'zustand'

/** État d'interface éphémère (non persisté). */
interface UIState {
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
}

export const useUI = create<UIState>()((set) => ({
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
}))
