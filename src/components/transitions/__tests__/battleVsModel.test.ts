import { describe, expect, it } from 'vitest'
import type { AllenatoreDef, PokemonIstanza, StatoBattaglia } from '@/types'
import { battleVsModel } from '../battleVsModel'

const mon = (specieId: number, nome: string, livello: number) => ({ istanzaId: `${specieId}`, specieId, nome, livello, hp: 10 }) as PokemonIstanza
const battle = (patch: Partial<StatoBattaglia>): StatoBattaglia => ({
  tipo: 'NPC', pokemonA: mon(9, 'Felyss', 14), pokemonB: mon(22, 'Deephion', 10), hpMaxA: 20, hpMaxB: 17,
  turnoCorrente: 'A', luogoRitorno: 'Venezia', log: [], evoluzioneInAttesa: null, ...patch,
}) as StatoBattaglia
const trainers: Record<number, AllenatoreDef> = {
  3: { id: 3, nome: 'Marco il Marinaio', luogo: 'Venezia', tipo: 'Capopalestra', squadra: [] },
  4: { id: 4, nome: 'Gennaro', luogo: 'Napoli', tipo: 'NPC', squadra: [] },
}
const find = (id: number) => trainers[id]

describe('scheda VS', () => {
  it('senza battaglia non ha contenuto', () => {
    expect(battleVsModel(null, 'Melia', 'Giocatore 1', find)).toBeNull()
    expect(battleVsModel(undefined, 'Melia', 'Giocatore 1', find)).toBeNull()
  })

  it('mostra giocatore e Capopalestra con i rispettivi primi Arkamon', () => {
    const model = battleVsModel(battle({ allenatoreId: 3 }), 'Maggi', 'Giocatore 2', find)!
    expect(model.wild).toBe(false)
    expect(model.player).toEqual({ kicker: 'Giocatore 2', name: 'Maggi', speciesId: 9, pokemonName: 'Felyss', level: 14 })
    expect(model.opponent).toEqual({ kicker: 'Capopalestra', name: 'Marco il Marinaio', speciesId: 22, pokemonName: 'Deephion', level: 10 })
  })

  it('distingue allenatori, rivale e Lega', () => {
    expect(battleVsModel(battle({ allenatoreId: 4 }), 'Melia', 'Giocatore 1', find)!.opponent.kicker).toBe('Allenatore')
    expect(battleVsModel(battle({ tipo: 'PVP' }), 'Melia', 'Giocatore 1', find)!.opponent).toMatchObject({ kicker: 'Rivale', name: 'Rivale' })
    const league = battleVsModel(battle({ leagueOpponent: { id: 99, nome: 'Aurora', luogo: 'Roma', tipo: 'Superquattro', squadra: [] } }), 'Melia', 'Giocatore 1', find)!
    expect(league.opponent).toMatchObject({ kicker: 'Superquattro', name: 'Aurora' })
  })

  it('negli incontri selvatici il lato avversario è la specie', () => {
    const model = battleVsModel(battle({ tipo: 'Selvatico', pokemonB: mon(30, 'Wormaren', 5) }), 'Maggi', 'Giocatore 2', find)!
    expect(model.wild).toBe(true)
    expect(model.opponent).toEqual({ kicker: 'Arkamon selvatico', name: 'Wormaren', speciesId: 30, pokemonName: 'Wormaren', level: 5 })
  })

  it('senza nome del giocatore usa l’etichetta', () => {
    expect(battleVsModel(battle({}), '', 'Giocatore 1', find)!.player.name).toBe('Giocatore 1')
  })
})
