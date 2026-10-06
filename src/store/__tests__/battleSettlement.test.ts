import { beforeEach, describe, expect, it } from 'vitest'
import { ALLENATORI } from '@/data'
import { useGameStore } from '../gameStore'
import { settledBattleCheckpoint, restoreBattleCheckpoint } from '@/components/battle/battleCheckpoint'
import type { PokemonIstanza, StatoBattaglia } from '@/types'

const a: PokemonIstanza = { istanzaId: 'player', specieId: 1, nome: 'A', livello: 5, hp: 7, xp: 0 }
const b: PokemonIstanza = { istanzaId: 'wild', specieId: 13, nome: 'B', livello: 5, hp: 3, xp: 0 }
const checkpoint = settledBattleCheckpoint({
  initialPriority: 'A', actedThisRound: new Set(), turnA: true, pvp: false,
  chooseRivalMove: false, outcome: 'vittoria', openingComplete: true,
  evolutions: [], rivalMessages: [],
})
function setup() {
  const battle: StatoBattaglia = {
    tipo: 'Selvatico', pokemonA: a, pokemonB: b, hpMaxA: 12, hpMaxB: 12,
    turnoCorrente: 'A', luogoRitorno: 'Percorso_1', log: [], evoluzioneInAttesa: null,
  }
  useGameStore.setState((state) => ({
    battaglia: battle, giocatoreAttivo: 1,
    giocatore1: { ...state.giocatore1, squadra: [a], deposito: {}, inventario: { masterball: 1 } },
  }))
}
describe('atomic capture and reward settlement', () => {
  beforeEach(() => { useGameStore.getState().reset(); setup() })
  it('stores Masterball consumption, captured Pokémon and ended battle in one state update', () => {
    let updates = 0
    const unsubscribe = useGameStore.subscribe(() => { updates += 1 })
    expect(useGameStore.getState().concludiCattura(1, b, { checkpoint }, true)).toBe(true)
    unsubscribe()
    expect(updates).toBe(1)
    const state = useGameStore.getState()
    expect(state.giocatore1.squadra.map((pokemon) => pokemon.istanzaId)).toEqual(['player', 'wild'])
    expect(state.giocatore1.inventario.masterball).toBe(0)
    expect(restoreBattleCheckpoint(JSON.parse(JSON.stringify(state.battaglia))).phase).toBe('ended')
    expect(state.concludiCattura(1, b, { checkpoint })).toBe(false)
    expect(useGameStore.getState().giocatore1.squadra).toHaveLength(2)
  })
  it('keeps item, squad and battle intact when an unavailable Masterball is requested', () => {
    useGameStore.setState((state) => ({ giocatore1: { ...state.giocatore1, inventario: { masterball: 0 } } }))
    const original = useGameStore.getState()
    expect(original.concludiCattura(1, b, { checkpoint }, true)).toBe(false)
    expect(useGameStore.getState()).toBe(original)
  })
  it('settles NPC coins once, including after serializing and restoring the finished battle', () => {
    const npc = ALLENATORI.find((trainer) => trainer.tipo === 'NPC')!
    useGameStore.setState((state) => ({ battaglia: { ...state.battaglia!, tipo: 'NPC', allenatoreId: npc.id, checkpoint } }))
    const before = useGameStore.getState().giocatore1.monete
    useGameStore.getState().risolviBattagliaNPC('vittoria')
    expect(useGameStore.getState().giocatore1.monete).toBe(before + 200)
    useGameStore.setState({ battaglia: JSON.parse(JSON.stringify(useGameStore.getState().battaglia)) })
    useGameStore.getState().risolviBattagliaNPC('vittoria')
    expect(useGameStore.getState().giocatore1.monete).toBe(before + 200)
  })
})
