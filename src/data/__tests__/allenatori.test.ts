import { describe, expect, it } from 'vitest'
import { ALLENATORI, getAllenatore, getPokemon, squadraAllenatore, tipoBattagliaAllenatore } from '@data/index'
import sourceTrainers from '../allenatori.json'

const idsBattleRefresh = new Set([201, 203, 302, 303, 305, 306, 307, 309, 311])

describe('allenatori — Battle Refresh', () => {
  it('mantiene gli ID storici e carica le squadre dei Capipalestra del foglio', () => {
    const principali = ALLENATORI.filter((a) => idsBattleRefresh.has(a.id))

    expect(principali).toHaveLength(idsBattleRefresh.size)
    for (const allenatore of principali) {
      expect(allenatore.squadra.length).toBeGreaterThan(0)
      expect(allenatore.squadra.length).toBeLessThanOrEqual(6)
    }
    expect(getAllenatore(201)?.nome).toBe('Rivale')
    expect(getAllenatore(203)).toMatchObject({ idDatabase: 203, squadra: [{ pokemonId: 62, livello: 10 }, { pokemonId: 185, livello: 10 }] })
    expect(tipoBattagliaAllenatore(getAllenatore(203)!)).toBe('PVP')
    expect(getAllenatore(10201)).toMatchObject({ nome: 'Mascherato 1', luogo: 'Venezia', guadagno: 50, perdita: -25 })
    const imported = sourceTrainers.flatMap((trainer) => trainer.idDatabase ?? []).sort((a, b) => a - b)
    expect(imported).toEqual(Array.from({ length: 140 }, (_, index) => index + 201))
    expect(sourceTrainers.filter((trainer) => trainer.luogo === 'Nascondiglio')).toHaveLength(10)
    expect(ALLENATORI.some((trainer) => trainer.luogo === 'Nascondiglio')).toBe(false)
  })

  it('dà lo starter scartato solo al Rivale e applica i livelli del foglio', () => {
    const rival = getAllenatore(10313)!
    const team = squadraAllenatore(rival, 9)
    expect(team.map((member) => member.livello)).toEqual([70, 70, 70, 71, 71, 71])
    expect(team.map((member) => member.pokemonId)).toEqual([9, 32, 21, 13, 47, 56])
    expect(squadraAllenatore(getAllenatore(10218)!, 9)[0].pokemonId).toBe(34)
  })

  it('tutti gli slot squadra puntano a specie Pokemon esistenti', () => {
    for (const allenatore of ALLENATORI) {
      for (const slot of allenatore.squadra) {
        expect(getPokemon(slot.pokemonId), `${allenatore.nome}: ${slot.pokemonId}`).toBeTruthy()
      }
    }
  })
})
