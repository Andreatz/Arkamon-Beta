import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useReducedMotion } from 'framer-motion'
import { useContext } from 'react'
import { MotionPlaybackContext } from './motionPlayback'
import { isUiStudioPreview, uiPreviewCampaignStorage } from '@/ui-studio/previewMode'

export type MotionPreference = 'system' | 'on' | 'off'
export interface GamePreferences {
  musicVolume: number
  effectsVolume: number
  animationSpeed: 'normal' | 'fast'
  reducedMotion: MotionPreference
  graphicsMemory: 'auto' | 'full' | 'low'
  /** Audit fase 3: dimensione del testo; «tv» per la diretta o lo schermo lontano. */
  textSize: 'normal' | 'large' | 'tv'
  /** Audit fase 8: l'avversario controllato dal gioco agisce da solo, senza premere «AVVERSARIO». */
  autoOpponent: boolean
  /** Audit fase 8: il tutorial del primo turno è stato completato o saltato su questo dispositivo. */
  tutorialDone: boolean
}
export const DEFAULT_GAME_PREFERENCES: GamePreferences = {
  musicVolume: 1, effectsVolume: 1, animationSpeed: 'normal', reducedMotion: 'system', graphicsMemory: 'auto', textSize: 'normal', autoOpponent: false, tutorialDone: false,
}
const volume = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value)
  ? Math.max(0, Math.min(1, value)) : fallback
export function normalizeGamePreferences(value: unknown): GamePreferences {
  const data = value && typeof value === 'object' ? value as Partial<GamePreferences> : {}
  return {
    musicVolume: volume(data.musicVolume, 1), effectsVolume: volume(data.effectsVolume, 1),
    animationSpeed: data.animationSpeed === 'fast' ? 'fast' : 'normal',
    reducedMotion: data.reducedMotion === 'on' || data.reducedMotion === 'off' ? data.reducedMotion : 'system',
    graphicsMemory: data.graphicsMemory === 'full' || data.graphicsMemory === 'low' ? data.graphicsMemory : 'auto',
    textSize: data.textSize === 'large' || data.textSize === 'tv' ? data.textSize : 'normal',
    autoOpponent: data.autoOpponent === true,
    tutorialDone: data.tutorialDone === true,
  }
}
interface PreferencesStore extends GamePreferences {
  setPreferences: (patch: Partial<GamePreferences>) => void
  resetPreferences: () => void
}
export const useGamePreferences = create<PreferencesStore>()(persist((set, get) => ({
  ...DEFAULT_GAME_PREFERENCES,
  setPreferences: (patch) => set(normalizeGamePreferences({ ...get(), ...patch })),
  resetPreferences: () => set({ ...DEFAULT_GAME_PREFERENCES }),
}), {
  name: 'arkamon-preferences-v1', version: 1,
  storage: createJSONStorage(() => isUiStudioPreview() ? uiPreviewCampaignStorage : localStorage),
  partialize: ({ musicVolume, effectsVolume, animationSpeed, reducedMotion, graphicsMemory, textSize, autoOpponent, tutorialDone }) => ({ musicVolume, effectsVolume, animationSpeed, reducedMotion, graphicsMemory, textSize, autoOpponent, tutorialDone }),
  merge: (saved, current) => ({ ...current, ...normalizeGamePreferences(saved) }),
}))

/** Presentation duration only: neither dice nor game rules depend on this value. */
export function getAnimationDuration(milliseconds: number): number {
  return Math.max(0, milliseconds) / (useGamePreferences.getState().animationSpeed === 'fast' ? 2 : 1)
}
export function useGameMotionPreferences(): { reducedMotion: boolean; speed: number } {
  const playback = useContext(MotionPlaybackContext)
  const system = useReducedMotion()
  const preference = useGamePreferences((state) => state.reducedMotion)
  const speed = useGamePreferences((state) => state.animationSpeed === 'fast' ? 2 : 1)
  return playback ?? { reducedMotion: preference === 'system' ? Boolean(system) : preference === 'on', speed }
}

/** Fattore applicato ai token tipografici (`--arka-user-text-scale`). */
export const TEXT_SIZE_SCALE: Record<GamePreferences['textSize'], number> = { normal: 1, large: 1.15, tv: 1.3 }
