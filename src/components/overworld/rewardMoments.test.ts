import { describe, expect, it, vi } from 'vitest'
import { leadPokemon, shouldAnnounceTurn, TURN_BANNER_MS } from './TurnChangeBanner'
import { someoneHealed } from '@/components/audio/AudioEventBridge'
import { prefetchScene, registerScenePreparer, resetScenePrefetch } from '@/components/transitions/scenePrefetch'
import type { PokemonIstanza } from '@/types'

const mon = (id: string, hp: number) => ({ istanzaId: id, hp, nome: id }) as PokemonIstanza

describe('momenti di ricompensa (audit fase 6)', () => {
  it('annuncia il cambio di turno solo sulle mappe locali e solo per un vero passaggio', () => {
    expect(TURN_BANNER_MS).toBe(1200)
    expect(shouldAnnounceTurn(1, 2, 'citta')).toBe(true)
    expect(shouldAnnounceTurn(2, 1, 'percorso')).toBe(true)
    expect(shouldAnnounceTurn(null, 1, 'citta')).toBe(false)
    expect(shouldAnnounceTurn(1, 1, 'citta')).toBe(false)
    expect(shouldAnnounceTurn(1, 2, 'battaglia')).toBe(false)
    // La mappa principale ha la sua fascia legata alla cinepresa.
    expect(shouldAnnounceTurn(1, 2, 'mappa-principale')).toBe(false)
  })

  it('mostra nel banner il primo compagno ancora in piedi', () => {
    expect(leadPokemon([mon('a', 0), mon('b', 5)])?.istanzaId).toBe('b')
    expect(leadPokemon([mon('a', 0)])?.istanzaId).toBe('a')
    expect(leadPokemon([])).toBeNull()
  })

  it('riconosce una cura, non una cattura o un danno', () => {
    const before = new Map([['a', 3], ['b', 10]])
    expect(someoneHealed(before, new Map([['a', 12], ['b', 10]]))).toBe(true)
    expect(someoneHealed(before, new Map([['a', 3], ['b', 10], ['c', 20]]))).toBe(false)
    expect(someoneHealed(before, new Map([['a', 1], ['b', 10]]))).toBe(false)
  })

  it('precarica una scena una sola volta per destinazione', async () => {
    resetScenePrefetch()
    expect(prefetchScene({ scena: 'citta', payload: { luogo: 'Venezia' } })).toBeNull()
    const preparer = vi.fn(() => Promise.resolve())
    registerScenePreparer(preparer)
    await prefetchScene({ scena: 'citta', payload: { luogo: 'Venezia' } })
    await prefetchScene({ scena: 'citta', payload: { luogo: 'Venezia' } })
    await prefetchScene({ scena: 'percorso', payload: { luogo: 'Percorso_1' } })
    expect(preparer).toHaveBeenCalledTimes(2)
    resetScenePrefetch()
  })
})
