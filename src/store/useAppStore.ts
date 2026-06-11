import { create } from 'zustand'
import type { ChapterKey } from '../config/chapters'

export interface AppState {
  currentChapter: ChapterKey
  isPanelOpen: boolean
  setChapter: (ch: ChapterKey) => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentChapter: 'index',
  isPanelOpen: true,

  setChapter: (ch) => set({ currentChapter: ch }),
  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
}))
