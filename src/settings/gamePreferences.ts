import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useReducedMotion } from 'framer-motion'

export type MotionPreference = 'system' | 'on' | 'off'
export interface GamePreferences {
  musicVolume: number
  effectsVolume: number
  animationSpeed: 'normal' | 'fast'
  reducedMotion: MotionPreference
}
export const DEFAULT_GAME_PREFERENCES: GamePreferences = {
  musicVolume: 1, effectsVolume: 1, animationSpeed: 'normal', reducedMotion: 'system',
}
const volume = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value)
  ? Math.max(0, Math.min(1, value)) : fallback
export function normalizeGamePreferences(value: unknown): GamePreferences {
  const data = value && typeof value === 'object' ? value as Partial<GamePreferences> : {}
  return {
    musicVolume: volume(data.musicVolume, 1), effectsVolume: volume(data.effectsVolume, 1),
    animationSpeed: data.animationSpeed === 'fast' ? 'fast' : 'normal',
    reducedMotion: data.reducedMotion === 'on' || data.reducedMotion === 'off' ? data.reducedMotion : 'system',
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
  partialize: ({ musicVolume, effectsVolume, animationSpeed, reducedMotion }) => ({ musicVolume, effectsVolume, animationSpeed, reducedMotion }),
  merge: (saved, current) => ({ ...current, ...normalizeGamePreferences(saved) }),
}))

/** Presentation duration only: neither dice nor game rules depend on this value. */
export function getAnimationDuration(milliseconds: number): number {
  return Math.max(0, milliseconds) / (useGamePreferences.getState().animationSpeed === 'fast' ? 2 : 1)
}
export function useGameMotionPreferences(): { reducedMotion: boolean; speed: number } {
  const system = useReducedMotion()
  const preference = useGamePreferences((state) => state.reducedMotion)
  const speed = useGamePreferences((state) => state.animationSpeed === 'fast' ? 2 : 1)
  return { reducedMotion: preference === 'system' ? Boolean(system) : preference === 'on', speed }
}
