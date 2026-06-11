import { create } from 'zustand'
import {
  isQualityProfile,
  resolveRenderBudget,
  type QualityProfile,
  type RenderBudget,
} from '../runtime/renderBudget'

export type ServiceWorkerStatus =
  | 'disabled'
  | 'unsupported'
  | 'installing'
  | 'ready'
  | 'updated'
  | 'error'

export type RuntimeLoad = 'idle' | 'ok' | 'busy' | 'overloaded'

export interface FrameStats {
  fps: number
  frameMs: number
  overBudgetFrames: number
  load: RuntimeLoad
  lastUpdated: number
}

export interface RuntimeState {
  isAnimationPaused: boolean
  isPowerSave: boolean
  qualityProfile: QualityProfile
  renderBudget: RenderBudget
  frameStats: FrameStats
  serviceWorkerStatus: ServiceWorkerStatus
  toggleAnimationPaused: () => void
  togglePowerSave: () => void
  setQualityProfile: (profile: QualityProfile) => void
  setFrameStats: (stats: FrameStats) => void
  setServiceWorkerStatus: (status: ServiceWorkerStatus) => void
}

const STORAGE_KEY = 'vector-field-lab-runtime'

type RuntimePreferences = Pick<RuntimeState, 'isAnimationPaused' | 'isPowerSave' | 'qualityProfile'>

function detectDefaultQuality(): QualityProfile {
  if (typeof navigator === 'undefined') return 'balanced'

  const device = navigator as Navigator & { deviceMemory?: number }
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = device.deviceMemory ?? 8

  return cores <= 4 || memory <= 4 ? 'safe' : 'balanced'
}

function readPreferences(): RuntimePreferences {
  const fallbackQuality = detectDefaultQuality()
  const fallback = {
    isAnimationPaused: false,
    isPowerSave: fallbackQuality === 'safe',
    qualityProfile: fallbackQuality,
  }

  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<RuntimePreferences>
    const storedQuality = isQualityProfile(parsed.qualityProfile)
      ? parsed.qualityProfile
      : fallbackQuality
    const isPowerSave = Boolean(parsed.isPowerSave)
    const qualityProfile = isPowerSave ? 'safe' : storedQuality

    return {
      isAnimationPaused: Boolean(parsed.isAnimationPaused),
      isPowerSave,
      qualityProfile,
    }
  } catch {
    return fallback
  }
}

function writePreferences(state: RuntimePreferences) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isAnimationPaused: state.isAnimationPaused,
        isPowerSave: state.isPowerSave,
        qualityProfile: state.qualityProfile,
      })
    )
  } catch {
    // Some mobile browsers disable localStorage in private mode.
  }
}

const preferences = readPreferences()

const initialFrameStats: FrameStats = {
  fps: 0,
  frameMs: 0,
  overBudgetFrames: 0,
  load: 'idle',
  lastUpdated: 0,
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  ...preferences,
  renderBudget: resolveRenderBudget(preferences.qualityProfile),
  frameStats: initialFrameStats,
  serviceWorkerStatus: 'disabled',

  toggleAnimationPaused: () =>
    set((state) => {
      const next = {
        ...state,
        isAnimationPaused: !state.isAnimationPaused,
      }
      writePreferences(next)
      return next
    }),

  togglePowerSave: () =>
    set((state) => {
      const isPowerSave = !state.isPowerSave
      const qualityProfile: QualityProfile = isPowerSave ? 'safe' : 'balanced'
      const next = {
        ...state,
        isPowerSave,
        qualityProfile,
        renderBudget: resolveRenderBudget(qualityProfile),
      }
      writePreferences(next)
      return next
    }),

  setQualityProfile: (qualityProfile) =>
    set((state) => {
      const next = {
        ...state,
        isPowerSave: qualityProfile === 'safe',
        qualityProfile,
        renderBudget: resolveRenderBudget(qualityProfile),
      }
      writePreferences(next)
      return next
    }),

  setFrameStats: (frameStats) => set({ frameStats }),

  setServiceWorkerStatus: (serviceWorkerStatus) => set({ serviceWorkerStatus }),
}))
