import { describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import { resolveMoveVfxProfile, resolveProfileAssetId } from '../moveVfxProfiles'

describe('move VFX semantic profiles', () => {
  it('classifies every configured move semantically instead of relying on type fallback', () => {
    const unresolved = MOSSE.filter(
      (move) => resolveMoveVfxProfile(move).source === 'type-fallback'
    )

    expect(
      unresolved.map((move) => `#${move.id} ${move.nome}`)
    ).toEqual([])
  })

  it('recognizes representative physical and elemental archetypes', () => {
    const byId = (id: number) => MOSSE.find((move) => move.id === id)!

    expect(resolveMoveVfxProfile(byId(30)).archetype).toBe('slash')
    expect(resolveMoveVfxProfile(byId(36)).archetype).toBe('fire')
    expect(resolveMoveVfxProfile(byId(107)).archetype).toBe('supreme')
    expect(resolveMoveVfxProfile(byId(146)).archetype).toBe('blunt')
    expect(resolveMoveVfxProfile(byId(174)).archetype).toBe('supreme')
    expect(resolveMoveVfxProfile(byId(203)).archetype).toBe('bite')
  })

  it('maps semantic profiles to deterministic assets', () => {
    for (const move of MOSSE) {
      expect(resolveProfileAssetId(move)).toBeTruthy()
    }
  })

  it('gives stronger feedback to heavy moves than light moves', () => {
    const light = resolveMoveVfxProfile(MOSSE.find((move) => move.id === 70)!)
    const heavy = resolveMoveVfxProfile(MOSSE.find((move) => move.id === 107)!)

    expect(heavy.feedback.targetShakePx).toBeGreaterThan(light.feedback.targetShakePx)
    expect(heavy.feedback.cameraShakePx).toBeGreaterThan(light.feedback.cameraShakePx)
    expect(heavy.feedback.hitStopMs).toBeGreaterThan(light.feedback.hitStopMs)
  })
})
