import { describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import { resolveMoveVfx } from '@/components/MoveVfx'

describe('MoveVfx catalog', () => {
  it('resolves a seeded profile for every move', () => {
    const profiles = MOSSE.map(resolveMoveVfx)

    expect(profiles).toHaveLength(220)
    expect(new Set(profiles.map((profile) => profile.moveId)).size).toBe(MOSSE.length)
    expect(new Set(profiles.map((profile) => profile.seed)).size).toBe(MOSSE.length)

    for (const profile of profiles) {
      expect(profile.particleCount).toBeGreaterThanOrEqual(9)
      expect(profile.durationMs).toBeGreaterThan(0)
      expect(profile.primary).toMatch(/^hsl\(/)
    }
  })

  it('uses dedicated archetypes for special effects', () => {
    const byName = (name: string) => resolveMoveVfx(MOSSE.find((move) => move.nome === name)!)

    expect(byName('Assorbilinfa')).toMatchObject({ archetype: 'heal', selfTarget: true })
    expect(byName('Predigestione')).toMatchObject({ archetype: 'poison' })
    expect(byName('Canto del Crepuscolo')).toMatchObject({ archetype: 'sleep' })
    expect(byName('Jumpscare')).toMatchObject({ archetype: 'confusion' })
    expect(byName('Cannone Infernale')).toMatchObject({ archetype: 'supreme' })
  })

  it('recognizes visual families from move names before the fallback type', () => {
    const byName = (name: string) => resolveMoveVfx(MOSSE.find((move) => move.nome === name)!)

    expect(byName('Palla di fuoco')).toMatchObject({ archetype: 'fire' })
    expect(byName('Spruzzo')).toMatchObject({ archetype: 'water' })
    expect(byName('Foglia Quantica')).toMatchObject({ archetype: 'leaf' })
    expect(byName('Tormenta glaciale')).toMatchObject({ archetype: 'ice' })
    expect(byName('Alta tensione')).toMatchObject({ archetype: 'lightning' })
  })
})
