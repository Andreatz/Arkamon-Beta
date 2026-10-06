import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '@store/gameStore'

vi.hoisted(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
})

describe('scelta starter persistente', () => {
  beforeEach(() => useGameStore.getState().reset())

  it('assegna due starter distinti e riserva il terzo al rivale', () => {
    expect(useGameStore.getState().scegliStarter(1)).toBe(true)
    expect(useGameStore.getState().giocatoreAttivo).toBe(2)
    expect(useGameStore.getState().scegliStarter(5)).toBe(true)
    const state = useGameStore.getState()
    expect(state.giocatore1.squadra.map((pokemon) => pokemon.specieId)).toEqual([1])
    expect(state.giocatore2.squadra.map((pokemon) => pokemon.specieId)).toEqual([5])
    expect(state.rivaleStarterId).toBe(9)
    expect(state.giocatoreAttivo).toBe(state.turnoOverworld.giocatoreAttivo)
  })

  it('blocca click duplicati e scelte successive al completamento', () => {
    const scegli = useGameStore.getState().scegliStarter
    expect(scegli(42)).toBe(false)
    expect(scegli(1)).toBe(true)
    expect(scegli(1)).toBe(false)
    expect(scegli(5)).toBe(true)
    expect(scegli(9)).toBe(false)
    expect(useGameStore.getState().giocatore1.squadra).toHaveLength(1)
    expect(useGameStore.getState().giocatore2.squadra).toHaveLength(1)
  })

  it('riprende la seconda scelta dallo stato salvato anche se il giocatore attivo è incoerente', () => {
    useGameStore.getState().scegliStarter(5)
    useGameStore.setState({ giocatoreAttivo: 1 })
    expect(useGameStore.getState().scegliStarter(5)).toBe(false)
    expect(useGameStore.getState().scegliStarter(9)).toBe(true)
    expect(useGameStore.getState().giocatore1.squadra[0].specieId).toBe(5)
    expect(useGameStore.getState().giocatore2.squadra[0].specieId).toBe(9)
    expect(useGameStore.getState().rivaleStarterId).toBe(1)
  })
})

describe('caricamento salvataggi parziali', () => {
  beforeEach(() => useGameStore.getState().reset())

  it('recupera i campi esistenti senza perdere il secondo giocatore e i nuovi valori predefiniti', () => {
    const merge = useGameStore.persist.getOptions().merge!
    const state = merge({
      giocatore1: { nome: 'Andrea', squadra: [], cespugliVisitati: ['Percorso_1:A'] },
    }, useGameStore.getState())
    expect(state.giocatore1.nome).toBe('Andrea')
    expect(state.giocatore1.cespugliVisitati).toEqual(new Set(['Percorso_1:A']))
    expect(state.giocatore1.caselleConsumate).toEqual(new Set())
    expect(state.giocatore1.inventario).toEqual({ masterball: 1 })
    expect(state.giocatore2.nome).toBe('Giocatore 2')
    expect(state.giocatore2.squadra).toEqual([])
    expect(state.scegliStarter).toBe(useGameStore.getState().scegliStarter)
  })

  it('mantiene lo stato iniziale se manca il contenuto persistito', () => {
    const merge = useGameStore.persist.getOptions().merge!
    expect(merge(undefined, useGameStore.getState()).giocatore1.nome).toBe('Giocatore 1')
    expect(merge(null, useGameStore.getState()).giocatore2.squadra).toEqual([])
  })
})
