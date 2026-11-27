import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SFX_IDS } from '@/audio/sfxIds'
import { chooseCinematic, CINEMATIC_KINDS } from '../cinematicTransitions'
import { getSceneTransitionProfile } from '../sceneTransitionProfiles'
import { TRANSITION_CLIPS } from '../TransitionClip'

const map = { scena: 'mappa-principale' } as const
const city = (luogo: string) => ({ scena: 'citta', payload: { luogo } }) as const
const route = (luogo: string) => ({ scena: 'percorso', payload: { luogo } }) as const

describe('regie delle transizioni', () => {
  it('entra in battaglia con la Carta VS e ne esce con la clip della luce', () => {
    expect(chooseCinematic({ scena: 'battaglia' }, route('Percorso_1'))).toBeNull()
    expect(getSceneTransitionProfile({ scena: 'battaglia' }, map).mode).toBe('battle-vs')
    expect(chooseCinematic(route('Percorso_1'), { scena: 'battaglia' })).toMatchObject({ kind: 'radiance', clip: 'luce', handoff: 'clip' })
    expect(chooseCinematic({ scena: 'lega' }, { scena: 'battaglia' })).toMatchObject({ kind: 'radiance', handoff: 'clip' })
    // Verso l'evoluzione il bianco della luce lascia il posto al dado.
    expect(chooseCinematic({ scena: 'evoluzione' }, { scena: 'battaglia' })).toMatchObject({ kind: 'radiance', handoff: 'overlay' })
  })

  it('usa il fumo nel viaggio fra mappa e luoghi e il vortice d\'oro dal titolo', () => {
    for (const [to, from] of [[city('Venezia'), map], [route('Percorso_1'), map], [map, city('Venezia')], [map, route('Percorso_2')]] as const) {
      expect(chooseCinematic(to, from)).toMatchObject({ kind: 'smoke', clip: 'fumo', handoff: 'clip' })
    }
    expect(chooseCinematic(map, { scena: 'titolo' })).toMatchObject({ kind: 'title', clip: 'titolo', handoff: 'clip' })
    expect(chooseCinematic({ scena: 'laboratorio' }, { scena: 'titolo' })).toMatchObject({ kind: 'title' })
  })

  it('tutto il resto è una dissolvenza semplice', () => {
    for (const [to, from] of [[route('Percorso_1'), city('Venezia')],
      [{ scena: 'lega' }, map], [{ scena: 'titolo' }, map], [map, { scena: 'laboratorio' }], [map, { scena: 'evoluzione' }]] as const) {
      expect(chooseCinematic(to, from)).toMatchObject({ kind: 'dissolve', clip: null, handoff: 'snapshot' })
    }
  })

  it('lascia le transizioni dell\'overlay dove servono', () => {
    expect(chooseCinematic(map, undefined)).toBeNull()
    expect(chooseCinematic(map, map)).toBeNull()
    expect(chooseCinematic(city('Venezia'), city('Venezia'))).toBeNull()
    expect(chooseCinematic({ scena: 'deposito' }, map)).toBeNull()
    expect(chooseCinematic(map, { scena: 'deposito' })).toBeNull()
    expect(chooseCinematic({ scena: 'evoluzione' }, map)).toBeNull()
    expect(getSceneTransitionProfile({ scena: 'deposito' }, map).mode).toBe('shared')
  })

  it('ha suono, stile e clip per ogni regia', () => {
    const css = readFileSync(resolve('src/components/transitions/cinematicTransitions.css'), 'utf8')
    expect(css).toContain("html[data-arka-tx='dissolve']::view-transition-old(root)")
    expect(CINEMATIC_KINDS).toEqual(['radiance', 'title', 'smoke', 'dissolve'])
    const sounds = new Set<string>(SFX_IDS)
    for (const destination of [city('Venezia'), map, { scena: 'battaglia' } as const, { scena: 'evoluzione' } as const]) {
      for (const origin of [map, city('Venezia'), { scena: 'battaglia' } as const, { scena: 'titolo' } as const]) {
        const cinematic = chooseCinematic(destination, origin)
        if (cinematic) expect(sounds.has(cinematic.sound), cinematic.sound).toBe(true)
      }
    }
    for (const clip of Object.values(TRANSITION_CLIPS)) {
      expect(existsSync(resolve('public', clip.src)), clip.src).toBe(true)
      expect(clip.coverAtS).toBeGreaterThan(0)
      expect(clip.coverAtS).toBeLessThan(clip.durationS)
    }
  })
})
