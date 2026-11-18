import { describe, it, expect } from 'vitest'
import { consumaAzione, nuovoTurno } from '@engine/turnoOverworld'
import type { StatoTurnoOverworld } from '@/types'

describe('consumaAzione', () => {
  const base: StatoTurnoOverworld = { giocatoreAttivo: 1, azioniRimaste: 2 }
  it('movimento decrementa di 1', () => {
    expect(consumaAzione(base, 'movimento')).toEqual({
      giocatoreAttivo: 1,
      azioniRimaste: 1,
    })
  })
  it('movimento → movimento → 0', () => {
    const dopo1 = consumaAzione(base, 'movimento')
    const dopo2 = consumaAzione(dopo1, 'movimento')
    expect(dopo2.azioniRimaste).toBe(0)
  })
  it('interazione azzera il turno (chiude anche se aveva 2 azioni)', () => {
    expect(consumaAzione(base, 'interazione').azioniRimaste).toBe(0)
  })
  it('interazione con 1 azione rimasta → 0 (non va negativo)', () => {
    const stato: StatoTurnoOverworld = { giocatoreAttivo: 2, azioniRimaste: 1 }
    expect(consumaAzione(stato, 'interazione').azioniRimaste).toBe(0)
  })
  it('movimento con 0 azioni resta a 0 (clamp)', () => {
    const stato: StatoTurnoOverworld = { giocatoreAttivo: 1, azioniRimaste: 0 }
    expect(consumaAzione(stato, 'movimento').azioniRimaste).toBe(0)
  })
  it('non muta lo stato di input (immutabilità)', () => {
    consumaAzione(base, 'movimento')
    expect(base.azioniRimaste).toBe(2)
  })
})

describe('nuovoTurno', () => {
  it('da giocatore 1 passa a 2 con 2 azioni', () => {
    expect(nuovoTurno(1)).toEqual({ giocatoreAttivo: 2, azioniRimaste: 2 })
  })
  it('da giocatore 2 passa a 1 con 2 azioni', () => {
    expect(nuovoTurno(2)).toEqual({ giocatoreAttivo: 1, azioniRimaste: 2 })
  })
})
