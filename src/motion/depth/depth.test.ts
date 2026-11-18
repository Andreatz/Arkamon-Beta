import { describe, expect, it } from 'vitest'
import manifest from '@/data/depthMaps.json'
import { backgroundStem, depthMapFor } from './depthMaps'
import { coverTransform } from './depthRenderer'
import { createParticles, seededRandom } from '../ambient/ambientParticleMath'

describe('mappe di profondità', () => {
  it('riconosce il nome dello sfondo anche con base, query e codifica', () => {
    expect(backgroundStem('/Arkamon-Beta/backgrounds/route_1.jpg?v=2')).toBe('route_1')
    expect(backgroundStem('/backgrounds/laboratory.png')).toBe('laboratory')
    expect(backgroundStem('/sprites/front_sprites/1.png')).toBeNull()
  })

  it('usa la mappa solo per gli sfondi elencati', () => {
    const available = new Set(['battle_forest'])
    expect(depthMapFor('/backgrounds/battle_forest.jpg', available)).toMatch(/\/backgrounds\/depth\/battle_forest\.webp$/)
    expect(depthMapFor('/backgrounds/venezia.png', available)).toBeNull()
  })

  it('il catalogo generato copre gli sfondi di battaglia, laboratorio ed evoluzione', () => {
    for (const name of ['battle_forest', 'laboratory', 'evolution', 'route_1', 'venezia']) expect(manifest.maps).toContain(name)
  })

  it('il ritaglio "cover" mantiene le proporzioni e lascia un margine per lo spostamento', () => {
    const [sx, sy, ox, oy] = coverTransform(1600, 900, 1600, 900)
    expect(sx).toBeCloseTo(sy)
    expect(sx).toBeLessThan(1)
    expect(ox).toBeCloseTo((1 - sx) / 2)
    expect(oy).toBeCloseTo((1 - sy) / 2)
    // Schermo più largo dell'immagine: si taglia in verticale.
    const wide = coverTransform(2000, 800, 1600, 900, 1)
    expect(wide[0]).toBe(1)
    expect(wide[1]).toBeLessThan(1)
  })
})

describe('particelle d’ambiente', () => {
  it('stesso seme, stesse particelle; semi diversi, particelle diverse', () => {
    expect(createParticles('motes', 10, 4)).toEqual(createParticles('motes', 10, 4))
    expect(createParticles('motes', 10, 4)).not.toEqual(createParticles('motes', 10, 5))
  })

  it('restano dentro lo schermo con durate, opacità e ritardi sensati', () => {
    for (const variant of ['motes', 'fireflies', 'sparkles', 'embers'] as const) {
      for (const particle of createParticles(variant, 40, 9)) {
        expect(particle.x).toBeGreaterThanOrEqual(0)
        expect(particle.x).toBeLessThanOrEqual(100)
        expect(particle.y).toBeGreaterThanOrEqual(20)
        expect(particle.y).toBeLessThanOrEqual(100)
        expect(particle.durationMs).toBeGreaterThan(3000)
        expect(particle.delayMs).toBeLessThanOrEqual(0)
        expect(-particle.delayMs).toBeLessThanOrEqual(particle.durationMs)
        expect(particle.opacity).toBeGreaterThan(0)
        expect(particle.opacity).toBeLessThanOrEqual(1)
        expect(particle.dy).toBeLessThan(0)
      }
    }
  })

  it('il generatore resta fra 0 e 1', () => {
    const random = seededRandom(123)
    for (let index = 0; index < 1000; index++) { const value = random(); expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThan(1) }
  })
})
