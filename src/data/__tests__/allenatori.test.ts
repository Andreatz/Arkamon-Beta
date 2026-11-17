import { describe, expect, it } from 'vitest'
import { ALLENATORI, getPokemon, squadraAllenatore } from '@data/index'

describe('allenatori del Database', () => {
  it('140 allenatori: 8 capipalestra, 8 squadre di Superquattro e 3 apparizioni del rivale', () => {
    expect(ALLENATORI).toHaveLength(140)
    expect(ALLENATORI.filter((a) => a.tipo === 'Capopalestra').map((a) => a.luogo))
      .toEqual(['Venezia', 'Milano', 'Torino', 'Grosseto', 'Cagliari', 'Palermo', 'Foggia', 'Napoli'])
    expect(ALLENATORI.filter((a) => a.tipo === 'Superquattro')).toHaveLength(8)
    expect(ALLENATORI.filter((a) => a.rivale).map((a) => a.id)).toEqual([256, 313, 340])
  })

  it('tutti gli slot squadra puntano a specie esistenti, rivale compreso', () => {
    for (const allenatore of ALLENATORI) {
      for (const slot of squadraAllenatore(allenatore, 5)) {
        expect(getPokemon(slot.pokemonId), `${allenatore.nome}: ${slot.pokemonId}`).toBeTruthy()
      }
    }
  })

  it('lo starter del rivale cresce con il livello della squadra', () => {
    const rival = ALLENATORI.find((a) => a.id === 313)!
    expect(squadraAllenatore(rival, 5)[0]).toEqual({ pokemonId: 8, livello: 70 })
    expect(squadraAllenatore(ALLENATORI.find((a) => a.id === 256)!, 9)[0]).toEqual({ pokemonId: 11, livello: 35 })
  })
})
