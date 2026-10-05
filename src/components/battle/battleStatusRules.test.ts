import { describe, it, expect } from 'vitest'
import { applicaStato, risolviStatoInizioTurno, determinaIniziativa } from '@/engine/battleEngine'
import type { PokemonIstanza } from '@/types'
const base: PokemonIstanza = { istanzaId: 'test', specieId: 1, nome: 'Test', livello: 5, hp: 100, xp: 0 }
describe('status rules with visible die results', () => {
  it('paralysis recovers on exactly two of the six faces and never prevents attacking', () => {
    for (let face = 1; face <= 6; face++) {
      const result = risolviStatoInizioTurno(applicaStato(base, 'Paralizzato'), 100, () => (face - 0.5) / 6)
      expect(result.tiroStato).toBe(face)
      expect(result.puoAgire).toBe(true)
      expect(Boolean(result.istanza.stato)).toBe(face < 5)
    }
  })
  it('sleep wakes on 4-6 and ends after at most three failed attempts', () => {
    for (let face = 1; face <= 6; face++) {
      const result = risolviStatoInizioTurno(applicaStato(base, 'Addormentato'), 100, () => (face - 0.5) / 6)
      expect(result.tiroStato).toBe(face)
      expect(result.puoAgire).toBe(face >= 4)
    }
    let current = applicaStato(base, 'Addormentato')
    for (let n = 0; n < 3; n++) { const result = risolviStatoInizioTurno(current, 100, () => 0); expect(result.puoAgire).toBe(false); current = result.istanza }
    expect(current.stato).toBeUndefined()
  })
  it('poison loses 10% max HP per turn, clamps at zero and has no recovery die', () => {
    const result = risolviStatoInizioTurno(applicaStato({ ...base, hp: 5 }, 'Avvelenato'), 100)
    expect(result.dannoSubito).toBe(10)
    expect(result.istanza.hp).toBe(0)
    expect(result.tiroStato).toBeUndefined()
  })
  it('paralysis takes initiative priority below level; equal levels have fair two-sided outcome', () => {
    expect(determinaIniziativa(20, 5, () => 0, 'Paralizzato')).toBe('B')
    expect(determinaIniziativa(5, 20, () => 1, undefined, 'Paralizzato')).toBe('A')
    expect(determinaIniziativa(5, 5, () => 0.49)).toBe('A')
    expect(determinaIniziativa(5, 5, () => 0.5)).toBe('B')
  })
})
