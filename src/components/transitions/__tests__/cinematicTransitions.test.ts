import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SFX_IDS } from '@/audio/sfxIds'
import { chooseCinematic, CINEMATIC_KINDS, travelDirection } from '../cinematicTransitions'
import { getSceneTransitionProfile } from '../sceneTransitionProfiles'

const map = { scena: 'mappa-principale' } as const
const city = (luogo: string) => ({ scena: 'citta', payload: { luogo } }) as const
const route = (luogo: string) => ({ scena: 'percorso', payload: { luogo } }) as const

describe('transizioni cinematografiche', () => {
  it('sceglie una regia per ogni coppia di scene', () => {
    expect(chooseCinematic(city('Venezia'), map)?.kind).toBe('sky-dive')
    expect(chooseCinematic(map, city('Venezia'))?.kind).toBe('sky-rise')
    expect(chooseCinematic(route('Percorso_1'), city('Venezia'))?.kind).toBe('whip')
    expect(chooseCinematic({ scena: 'battaglia' }, route('Percorso_1'))).toMatchObject({ kind: 'encounter', handoff: 'overlay' })
    expect(chooseCinematic({ scena: 'evoluzione' }, { scena: 'battaglia' })).toMatchObject({ kind: 'radiance', handoff: 'overlay' })
    expect(chooseCinematic(route('Percorso_1'), { scena: 'battaglia' })?.kind).toBe('radiance')
    expect(chooseCinematic({ scena: 'lega' }, map)?.kind).toBe('radiance')
    expect(chooseCinematic({ scena: 'titolo' }, map)?.kind).toBe('curtain')
    expect(chooseCinematic(map, { scena: 'titolo' })?.kind).toBe('gold-burst')
    expect(chooseCinematic(map, { scena: 'laboratorio' })?.kind).toBe('golden-iris')
    expect(chooseCinematic({ scena: 'laboratorio' }, { scena: 'titolo' })?.kind).toBe('gold-burst')
  })

  it('lascia le transizioni classiche dove servono', () => {
    // Primo caricamento, stessa scena, stesso luogo, elemento condiviso del Deposito.
    expect(chooseCinematic(map, undefined)).toBeNull()
    expect(chooseCinematic(map, map)).toBeNull()
    expect(chooseCinematic(city('Venezia'), city('Venezia'))).toBeNull()
    expect(chooseCinematic({ scena: 'deposito' }, map)).toBeNull()
    expect(chooseCinematic(map, { scena: 'deposito' })).toBeNull()
    expect(getSceneTransitionProfile({ scena: 'deposito' }, map).mode).toBe('shared')
  })

  it('porta la regia nel profilo, con il punto di fuga sul logo del titolo', () => {
    const profile = getSceneTransitionProfile(map, { scena: 'titolo' })
    expect(profile.cinematic?.kind).toBe('gold-burst')
    expect(profile.anchor).toEqual({ name: 'title-logo', scene: 'outgoing' })
    expect(getSceneTransitionProfile(city('Venezia'), map).anchor).toEqual({ name: 'Venezia', scene: 'outgoing' })
    expect(getSceneTransitionProfile(map, city('Venezia')).anchor).toEqual({ name: 'Venezia', scene: 'incoming' })
  })

  it('segue la direzione del viaggio sulla mappa', () => {
    const east = travelDirection('Venezia', 'Percorso_1')
    expect(Math.hypot(east.x, east.y)).toBeCloseTo(1, 2)
    const back = travelDirection('Percorso_1', 'Venezia')
    expect(back.x).toBeCloseTo(-east.x, 2)
    expect(back.y).toBeCloseTo(-east.y, 2)
    expect(travelDirection('Torino', 'Palermo').y).toBeGreaterThan(0.5)
    expect(travelDirection(undefined, 'Roma')).toEqual({ x: 1, y: 0 })
    expect(travelDirection('Roma', 'Roma')).toEqual({ x: 1, y: 0 })
  })

  it('ha un suono, uno stile e le nuvole per ogni regia', () => {
    const css = readFileSync(resolve('src/components/transitions/cinematicTransitions.css'), 'utf8')
    for (const kind of CINEMATIC_KINDS) {
      expect(css, kind).toContain(`[data-scene-motion='cx-${kind}']`)
      if (kind !== 'encounter') expect(css, kind).toContain(`html[data-arka-tx='${kind}']::view-transition-new(root)`)
    }
    const sounds = new Set<string>(SFX_IDS)
    for (const destination of [city('Venezia'), map, route('Percorso_1'), { scena: 'battaglia' } as const, { scena: 'titolo' } as const]) {
      for (const origin of [map, city('Venezia'), { scena: 'battaglia' } as const, { scena: 'titolo' } as const, { scena: 'laboratorio' } as const]) {
        const cinematic = chooseCinematic(destination, origin)
        if (cinematic) expect(sounds.has(cinematic.sound), cinematic.sound).toBe(true)
      }
    }
    for (const index of [1, 2, 3]) expect(existsSync(resolve(`public/ui/transitions/cloud-${index}.webp`))).toBe(true)
  })
})
