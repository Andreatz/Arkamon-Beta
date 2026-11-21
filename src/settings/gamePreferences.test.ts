import { describe, expect, it } from 'vitest'
import { DEFAULT_GAME_PREFERENCES, normalizeGamePreferences, useGamePreferences, getAnimationDuration, TEXT_SIZE_SCALE } from './gamePreferences'
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
  it('recovers automatic graphics memory for old saves and accepts explicit device budgets', () => {
    expect(normalizeGamePreferences({ graphicsMemory: 'invalid' }).graphicsMemory).toBe('auto')
    expect(normalizeGamePreferences({ graphicsMemory: 'low' }).graphicsMemory).toBe('low')
    useGamePreferences.getState().setPreferences({ graphicsMemory: 'full' })
    expect(useGamePreferences.getState().graphicsMemory).toBe('full')
    useGamePreferences.getState().resetPreferences()
    expect(useGamePreferences.getState().graphicsMemory).toBe('auto')
  })
})

describe('dimensione del testo (audit fase 3)', () => {
  it('accetta normale, grande e TV e ripiega su normale per valori sconosciuti', () => {
    expect(normalizeGamePreferences({ textSize: 'tv' }).textSize).toBe('tv')
    expect(normalizeGamePreferences({ textSize: 'large' }).textSize).toBe('large')
    expect(normalizeGamePreferences({ textSize: 'enorme' }).textSize).toBe('normal')
    expect(normalizeGamePreferences({}).textSize).toBe('normal')
    expect(TEXT_SIZE_SCALE).toEqual({ normal: 1, large: 1.15, tv: 1.3 })
  })
})
