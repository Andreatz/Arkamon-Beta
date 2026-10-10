import { describe, expect, it } from 'vitest'
import { DEFAULT_GAME_PREFERENCES, normalizeGamePreferences, useGamePreferences, getAnimationDuration } from './gamePreferences'
describe('game preferences', () => {
  it('recovers malformed saved settings and bounds the volumes', () => {
    expect(normalizeGamePreferences(null)).toEqual(DEFAULT_GAME_PREFERENCES)
    expect(normalizeGamePreferences({ musicVolume: -10, effectsVolume: 9, reducedMotion: 'invalid', animationSpeed: 'turbo' })).toEqual({ ...DEFAULT_GAME_PREFERENCES, musicVolume: 0, effectsVolume: 1 })
  })
  it('changes presentation duration without changing normal defaults', () => {
    useGamePreferences.getState().setPreferences({ animationSpeed: 'fast' })
    expect(getAnimationDuration(1200)).toBe(600)
    useGamePreferences.getState().resetPreferences()
    expect(getAnimationDuration(1200)).toBe(1200)
    expect(getAnimationDuration(-5)).toBe(0)
  })
})
