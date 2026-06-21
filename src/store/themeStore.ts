import { create } from 'zustand'

type Mode = 'dark' | 'light'

interface ThemeState {
  mode: Mode
  cosmetic: string
  setMode: (mode: Mode) => void
  toggleMode: () => void
  setCosmetic: (cosmetic: string) => void
}

function applyToDocument(mode: Mode, cosmetic: string) {
  const root = document.documentElement
  root.classList.toggle('light', mode === 'light')
  root.classList.toggle('dark', mode === 'dark')
  root.dataset.cosmetic = cosmetic
}

const storedMode = (localStorage.getItem('gamly-mode') as Mode | null) ?? 'dark'
const storedCosmetic = localStorage.getItem('gamly-cosmetic') ?? 'default'
applyToDocument(storedMode, storedCosmetic)

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: storedMode,
  cosmetic: storedCosmetic,
  setMode: (mode) => {
    localStorage.setItem('gamly-mode', mode)
    applyToDocument(mode, get().cosmetic)
    set({ mode })
  },
  toggleMode: () => {
    const next: Mode = get().mode === 'dark' ? 'light' : 'dark'
    get().setMode(next)
  },
  setCosmetic: (cosmetic) => {
    localStorage.setItem('gamly-cosmetic', cosmetic)
    applyToDocument(get().mode, cosmetic)
    set({ cosmetic })
  },
}))
