/**
 * Test per le action overworld dello store: turni, mappa principale e reset.
 * La vecchia mappa a griglia è stata rimossa il 18 novembre 2026.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@store/gameStore'
import { MAIN_MAP_START_NODE, getAdjacentMainMapNodes } from '@data/mainMapRoads'
import type { PosizioneAvatar } from '@/types'

const posIn = (x: number, y: number): PosizioneAvatar => ({
  mappaId: 'Percorso_1',
  x,
  y,
  direzione: 'S',
})

describe('store overworld — scena', () => {
  it('dimentica la prenotazione fallback quando si esce dalla scena', () => {
    useGameStore.setState({
      fallbackLocationActivity: { playerId: 1, location: 'Pescara' },
      scenaCorrente: { scena: 'citta', payload: { luogo: 'Pescara' } },
      scenaPrecedente: null,
    })
    useGameStore.getState().vaiAScena('mappa-principale')
    expect(useGameStore.getState().fallbackLocationActivity).toBeNull()
  })
})

describe('store overworld — passaTurnoOverworld', () => {
  it('da giocatore 1 swappa a 2 con 2 azioni', () => {
    useGameStore.setState({
      turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 1 },
    })
    useGameStore.getState().passaTurnoOverworld()
    expect(useGameStore.getState().turnoOverworld).toEqual({
      giocatoreAttivo: 2,
      azioniRimaste: 2,
    })
  })
})

describe('store overworld — mappa principale', () => {
  beforeEach(() => {
    useGameStore.setState({
      posizione1: {
        mappaId: 'mappa-principale',
        x: 0,
        y: 0,
        direzione: 'S',
        luogo: 'Venezia',
      },
      posizione2: {
        mappaId: 'mappa-principale',
        x: 0,
        y: 0,
        direzione: 'S',
        luogo: 'Venezia',
      },
      giocatoreAttivo: 1,
      turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
    })
  })

  it('muove il giocatore attivo solo verso un nodo collegato da strada', () => {
    const ok = useGameStore.getState().muoviAvatarMappaPrincipale(1, 'Percorso_1')

    expect(ok).toBe(true)
    expect(useGameStore.getState().posizione1).toMatchObject({
      mappaId: 'mappa-principale',
      luogo: 'Percorso_1',
    })
    expect(useGameStore.getState().turnoOverworld).toEqual({
      giocatoreAttivo: 1,
      azioniRimaste: 1,
    })
  })

  it('consente due movimenti e blocca il terzo nello stesso turno sulla mappa principale', () => {
    useGameStore.getState().muoviAvatarMappaPrincipale(1, 'Percorso_1')

    const ok = useGameStore.getState().muoviAvatarMappaPrincipale(1, 'Piacenza')

    expect(ok).toBe(true)
    expect(useGameStore.getState().posizione1.luogo).toBe('Piacenza')
    expect(useGameStore.getState().turnoOverworld).toEqual({ giocatoreAttivo: 1, azioniRimaste: 0 })
    expect(useGameStore.getState().muoviAvatarMappaPrincipale(1, 'Percorso_2')).toBe(false)
    expect(useGameStore.getState().interagisciLuogoMappaPrincipale(1)).toEqual({ tipo: 'no-op' })
  })

  it('rifiuta movimento verso un nodo non collegato', () => {
    const ok = useGameStore.getState().muoviAvatarMappaPrincipale(1, 'Roma')

    expect(ok).toBe(false)
    expect(useGameStore.getState().posizione1.luogo).toBe('Venezia')
  })

  it('usa Pordenone come nodo iniziale collegato a Venezia', () => {
    expect(MAIN_MAP_START_NODE).toBe('Pordenone')
    expect(getAdjacentMainMapNodes('Pordenone')).toEqual(['Venezia'])
  })

  it('supporta diramazioni con piu strade in uscita dallo stesso nodo', () => {
    useGameStore.setState({
      posizione1: {
        mappaId: 'mappa-principale',
        x: 0,
        y: 0,
        direzione: 'S',
        luogo: 'Percorso_15',
      },
      turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
    })

    const ok = useGameStore.getState().muoviAvatarMappaPrincipale(1, 'Percorso_1')

    expect(ok).toBe(true)
    expect(useGameStore.getState().posizione1.luogo).toBe('Percorso_1')
  })

  it('modella le diramazioni principali senza percorso lineare unico', () => {
    expect(getAdjacentMainMapNodes('Percorso_3')).toEqual(['Milano'])
    expect(getAdjacentMainMapNodes('Percorso_11')).toEqual(['Foggia'])
    // Rinomina del 18 novembre 2026: la strada Pescara–Roma è il Percorso 15 (Via Vittoria).
    expect(new Set(getAdjacentMainMapNodes('Percorso_15'))).toEqual(
      new Set(['Percorso_1', 'Grosseto', 'Pescara', 'Roma'])
    )
    expect(new Set(getAdjacentMainMapNodes('Percorso_13'))).toEqual(new Set(['Percorso_12', 'Percorso_14']))
    expect(new Set(getAdjacentMainMapNodes('Percorso_14'))).toEqual(new Set(['Percorso_13', 'Pescara']))
    expect(getAdjacentMainMapNodes('Molisnt')).toEqual([])
    expect(new Set(getAdjacentMainMapNodes('Percorso_4'))).toEqual(
      new Set(['Percorso_2', 'Percorso_5'])
    )
    expect(new Set(getAdjacentMainMapNodes('Percorso_12'))).toEqual(
      new Set(['Foggia', 'Napoli', 'Percorso_13'])
    )
  })

  it('interagisce col luogo corrente e passa il turno mantenendo il giocatore attivo di scena', () => {
    const result = useGameStore.getState().interagisciLuogoMappaPrincipale(1)

    expect(result).toEqual({ tipo: 'luogo', luogo: 'Venezia' })
    expect(useGameStore.getState().giocatoreAttivo).toBe(1)
    expect(useGameStore.getState().turnoOverworld).toEqual({
      giocatoreAttivo: 2,
      azioniRimaste: 2,
    })
  })

  it('prenota una sola attività nei luoghi fallback senza mappa locale', () => {
    useGameStore.setState({
      posizione1: { mappaId: 'mappa-principale', x: 0, y: 0, direzione: 'S', luogo: 'Pescara' },
      giocatoreAttivo: 1,
      turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 },
      fallbackLocationActivity: null,
      scenaCorrente: { scena: 'citta', payload: { luogo: 'Pescara' } },
    })
    expect(useGameStore.getState().interagisciLuogoMappaPrincipale(1)).toEqual({ tipo: 'luogo', luogo: 'Pescara' })
    expect(useGameStore.getState().fallbackLocationActivity).toEqual({ playerId: 1, location: 'Pescara' })
    expect(useGameStore.getState().consumaInterazioneMappaLocale(1, 'Pescara')).toBe(true)
    expect(useGameStore.getState().fallbackLocationActivity).toBeNull()
    expect(useGameStore.getState().consumaInterazioneMappaLocale(1, 'Pescara')).toBe(false)
  })
})

describe('store overworld — reset', () => {
  it("ripristina posizioni e turnoOverworld al default", () => {
    useGameStore.setState({
      posizione1: posIn(2, 2),
      posizione2: posIn(3, 1),
      turnoOverworld: { giocatoreAttivo: 2, azioniRimaste: 1 },
    })
    useGameStore.getState().reset()
    const s = useGameStore.getState()
    expect(s.posizione1).toEqual({
      mappaId: 'mappa-principale',
      x: 0,
      y: 0,
      direzione: 'S',
      luogo: MAIN_MAP_START_NODE,
    })
    expect(s.posizione2).toEqual({
      mappaId: 'mappa-principale',
      x: 0,
      y: 0,
      direzione: 'S',
      luogo: MAIN_MAP_START_NODE,
    })
    expect(s.turnoOverworld).toEqual({ giocatoreAttivo: 1, azioniRimaste: 2 })
  })
})
