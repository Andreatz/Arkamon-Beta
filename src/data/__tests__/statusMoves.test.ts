import { describe, expect, it } from 'vitest'
import authoringSpecies from '../pokemon.json'
import { getMossa, getPokemon, MOSSE, POKEMON_BASE, mossaDisponibile } from '../index'

describe('mosse nel catalogo del gioco', () => {
  it('carica i 106 status con la stessa definizione usata dalle specie', () => {
    expect(MOSSE.filter(move => move.soloStato)).toHaveLength(106)
    expect(getMossa(225)).toMatchObject({ nome: 'Impatto Voltaico', effetto: 'PARALISI', precisione: 80 })
    expect(getMossa(467)).toMatchObject({ nome: 'Canto paralizzante', effetto: 'PARALISI', stadioMinimo: 2 })
    expect(getMossa(516)).toMatchObject({ nome: 'Raggio bloccante gamma', effetto: 'IMMUNITA_STATUS', livelloMinimo: 22, valoreEffetto: 5 })
    expect(POKEMON_BASE).toEqual(authoringSpecies)
    expect(POKEMON_BASE.every(species => species.mosse.every(id => id === 0 || getMossa(id) !== undefined))).toBe(true)
  })

  it('rispetta gli slot espliciti e i livelli minimi del foglio', () => {
    expect(getPokemon(43)?.mosse[2]).toBe(226)
    expect(getPokemon(44)?.mosse[2]).toBe(226)
    expect(mossaDisponibile(43, getMossa(226)!, 26)).toBe(true)
    expect(mossaDisponibile(44, getMossa(226)!, 26)).toBe(true)
    expect(mossaDisponibile(25, getMossa(227)!, 26)).toBe(true)
    expect(mossaDisponibile(24, getMossa(227)!, 26)).toBe(false)
    expect(getMossa(256)?.nome).toBe('Stasi Elettrica')
    expect(POKEMON_BASE.some(species => species.mosse.includes(256))).toBe(false)
    expect(mossaDisponibile(21, getMossa(230)!, 21)).toBe(false)
    expect(mossaDisponibile(21, getMossa(230)!, 22)).toBe(true)
    expect(mossaDisponibile(112, getMossa(467)!, 22)).toBe(true)
    expect(getPokemon(111)?.mosse[2]).toBe(0)
    expect(mossaDisponibile(111, getMossa(467)!, 22)).toBe(false)
  })

  it('mantiene gli ID storici delle quattro mosse leggendarie rimappate', () => {
    expect([107, 108, 109, 110].map(id => getMossa(id)?.nome)).toEqual([
      'Vortice divino', 'Fiamma celestiale', 'Sguardo glaciale', 'Ordine sovrano',
    ])
  })
})
