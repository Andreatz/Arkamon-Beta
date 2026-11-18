import { describe, expect, it } from 'vitest'
import type { NavigazioneScena, SceneId } from '@/types'
import {
  getSceneTransitionProfile,
  TRANSITION_VIDEO_PATH,
  TRANSITION_VIDEO_SEGMENT_SECONDS,
  TRANSITION_VIDEO_START_SECONDS,
} from '../sceneTransitionProfiles'

const scenes: SceneId[] = [
  'titolo', 'laboratorio', 'mappa-principale', 'percorso',
  'citta', 'palestra', 'centro-pokemon', 'battaglia', 'deposito', 'squadra', 'evoluzione',
]

describe('scene transition profiles', () => {
  it('apre le battaglie con la scheda VS dal vivo, più breve del vecchio video', () => {
    const battle = getSceneTransitionProfile({ scena: 'battaglia' })
    expect(battle.mode).toBe('battle-vs')
    expect(battle.durationMs).toBe(2600)
    expect(battle.coverMs).toBe(160)
    expect(battle.blendMs).toBe(420)
    expect(battle.filter).toBe('none')
    expect(battle.coverMs + battle.durationMs).toBeLessThan(3180)
  })

  it('conserva i parametri del video, ancora supportato dalla modalità battle-video', () => {
    expect(TRANSITION_VIDEO_PATH).toBe('/assets/Transizione Battaglia.mp4')
    expect(TRANSITION_VIDEO_START_SECONDS).toBe(5)
    expect(TRANSITION_VIDEO_START_SECONDS + TRANSITION_VIDEO_SEGMENT_SECONDS).toBe(8)
  })

  it('keeps routine consultation below 200 ms instead of replaying the D6', () => {
    const general = getSceneTransitionProfile({ scena: 'deposito' })
    expect(general.mode).toBe('fade')
    expect(general.durationMs + general.coverMs).toBeLessThanOrEqual(200)
    expect(general.filter).toBe('none')
    const travel = getSceneTransitionProfile({ scena: 'citta', payload: { luogo: 'Venezia' } })
    expect(travel.mode).toBe('fade')
    expect(travel.durationMs + travel.coverMs).toBeLessThanOrEqual(650)
  })

  it('lets the same crimson D6 linger slightly longer for evolution', () => {
    const general = getSceneTransitionProfile({ scena: 'deposito' })
    const evolution = getSceneTransitionProfile({ scena: 'evoluzione' })
    const battle = getSceneTransitionProfile({ scena: 'battaglia' })
    expect(evolution.mode).toBe('arkamon-dice')
    expect(evolution.durationMs).toBeGreaterThan(general.durationMs)
    expect(evolution.durationMs).toBeLessThan(battle.durationMs)
    expect(evolution.filter).not.toContain('hue-rotate(')
    expect((evolution.durationMs + evolution.coverMs) * 0.71)
      .toBeLessThan(evolution.coverMs + evolution.durationMs - evolution.blendMs)
  })

  it('riserva la scheda VS alle battaglie e non usa più il video', () => {
    expect(scenes.filter((scena) => getSceneTransitionProfile({ scena }).mode === 'battle-vs')).toEqual(['battaglia'])
    expect(scenes.filter((scena) => getSceneTransitionProfile({ scena }).mode === 'battle-video')).toEqual([])
  })

  it('guarantees bounded fallback and enough time to blend for every destination', () => {
    for (const scena of scenes) {
      const profile = getSceneTransitionProfile({ scena })
      expect(profile.durationMs).toBeGreaterThan(profile.blendMs)
      expect(profile.failSafeMs).toBeGreaterThan(profile.coverMs + profile.durationMs + profile.blendMs)
      expect(profile.failSafeMs).toBeLessThanOrEqual(8000)
      expect(profile.label.length).toBeGreaterThan(0)
    }
  })

  it('names the destination location in accessible Italian labels', () => {
    expect(getSceneTransitionProfile({ scena: 'citta', payload: { luogo: 'Roma' } }).label)
      .toBe('Ingresso a Roma')
    expect(getSceneTransitionProfile({ scena: 'percorso', payload: { luogo: 'Percorso_3' } }).label)
      .toBe('Ingresso in Percorso 3')
    expect(getSceneTransitionProfile({ scena: 'percorso' }).label).toBe('Ingresso in Percorso 1')
    expect(getSceneTransitionProfile({ scena: 'citta' }).label).toBe('Ingresso a Venezia')
  })

  it('returns an independent profile for each request without changing later requests', () => {
    const before = getSceneTransitionProfile({ scena: 'deposito' })
    getSceneTransitionProfile({ scena: 'battaglia' })
    getSceneTransitionProfile({ scena: 'evoluzione' })
    const after = getSceneTransitionProfile({ scena: 'deposito' })
    expect(after).not.toBe(before)
    expect(after).toEqual(before)
  })
})

describe('libreria di transizioni guidata da partenza e arrivo', () => {
  const map = { scena: 'mappa-principale' } as const
  const venice = { scena: 'citta', payload: { luogo: 'Venezia' } } as const
  const route = { scena: 'percorso', payload: { luogo: 'Percorso_2' } } as const

  it('entra nel nodo della mappa con uno zoom ancorato al luogo di arrivo', () => {
    const profile = getSceneTransitionProfile(venice, map)
    expect(profile.mode).toBe('zoom-in')
    expect(profile.anchor).toEqual({ name: 'Venezia', scene: 'outgoing' })
    expect(getSceneTransitionProfile(route, map).anchor).toEqual({ name: 'Percorso_2', scene: 'outgoing' })
  })

  it('al ritorno la mappa si allarga dal luogo appena lasciato', () => {
    const profile = getSceneTransitionProfile(map, route)
    expect(profile.mode).toBe('zoom-out')
    expect(profile.anchor).toEqual({ name: 'Percorso_2', scene: 'incoming' })
    expect(profile.label).toBe('Ritorno alla mappa principale')
  })

  it('usa il taglio diagonale fra due mappe locali e l’elemento condiviso per il deposito', () => {
    expect(getSceneTransitionProfile(route, venice).mode).toBe('diagonal')
    const deposit = getSceneTransitionProfile({ scena: 'deposito' }, map)
    expect(deposit.mode).toBe('shared')
    expect(deposit.sharedElement).toBe('deposito')
    expect(getSceneTransitionProfile(map, { scena: 'deposito' }).sharedElement).toBe('deposito')
    // Consultazione rapida: anche l'elemento condiviso resta sotto mezzo secondo.
    expect(deposit.coverMs + deposit.durationMs).toBeLessThan(500)
  })

  it('riserva bianco, pennellata e iride ai rispettivi passaggi', () => {
    expect(getSceneTransitionProfile(route, { scena: 'battaglia' }).mode).toBe('white')
    expect(getSceneTransitionProfile(map, { scena: 'evoluzione' }).mode).toBe('white')
    expect(getSceneTransitionProfile({ scena: 'lega' }, map).mode).toBe('white')
    expect(getSceneTransitionProfile({ scena: 'laboratorio' }, { scena: 'titolo' }).mode).toBe('brush')
    expect(getSceneTransitionProfile(map, { scena: 'laboratorio' }).mode).toBe('iris')
    expect(getSceneTransitionProfile({ scena: 'titolo' }, map).mode).toBe('fade')
  })

  it('le sequenze dedicate prevalgono su qualunque partenza', () => {
    expect(getSceneTransitionProfile({ scena: 'battaglia' }, route).mode).toBe('battle-vs')
    expect(getSceneTransitionProfile({ scena: 'evoluzione' }, { scena: 'battaglia' }).mode).toBe('arkamon-dice')
  })

  it('mantiene limiti di sicurezza e tempo di fusione per ogni coppia di scene', () => {
    const places: NavigazioneScena[] = [map, venice, route, ...scenes.map(scena => ({ scena }))]
    for (const to of places) for (const from of places) {
      const profile = getSceneTransitionProfile(to, from)
      expect(profile.durationMs).toBeGreaterThan(profile.blendMs)
      expect(profile.failSafeMs).toBeGreaterThan(profile.coverMs + profile.durationMs + profile.blendMs)
      expect(profile.failSafeMs).toBeLessThanOrEqual(8000)
      // Le transizioni ordinarie restano sotto 1,6 s: solo VS ed evoluzione durano di più.
      if (profile.mode !== 'battle-vs' && profile.mode !== 'arkamon-dice') {
        expect(profile.coverMs + profile.durationMs).toBeLessThan(1600)
      }
      if (profile.mode === 'zoom-in' || profile.mode === 'zoom-out') expect(profile.anchor).not.toBeNull()
      else expect(profile.anchor).toBeNull()
    }
  })
})
