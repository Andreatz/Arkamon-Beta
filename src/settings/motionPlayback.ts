import { createContext } from 'react'

/** A public renderer follows the console without changing the viewer's saved preferences. */
/** `speed` divide le durate: 1 normale, 2 veloce; il laboratorio usa anche il rallentatore (meno di 1). */
export interface MotionPlayback { speed: number; reducedMotion: boolean }
export const MotionPlaybackContext = createContext<MotionPlayback | null>(null)
export function normalizeMotionPlayback(value: unknown): MotionPlayback {
  const input = value && typeof value === 'object' ? value as Partial<MotionPlayback> : {}
  return { speed: input.speed === 2 ? 2 : 1, reducedMotion: input.reducedMotion === true }
}
