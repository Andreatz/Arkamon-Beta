import { describe, expect, it } from 'vitest'
import authoringMoves from '../mosse.json'
import authoringSpecies from '../pokemon.json'
import authoringTrainers from '../allenatori.json'
import authoringEncounters from '../incontri.json'
import { BASE_RUNTIME_MOVES, RUNTIME_ENCOUNTERS, RUNTIME_SPECIES, RUNTIME_TRAINERS } from '../runtimeGameData'

describe('compact startup game catalog', () => {
  it('reproduces all authored definitions and every value at every level', () => {
    expect(BASE_RUNTIME_MOVES).toEqual(authoringMoves)
    expect(BASE_RUNTIME_MOVES).toHaveLength(516)
  })

  it('does not share mutable level tables between definitions', () => {
    const tables = BASE_RUNTIME_MOVES.flatMap(move => [move.dadiPerLivello, move.incrementoPerLivello])
    expect(new Set(tables).size).toBe(tables.length)
  })

  it('preserves all species, trainer teams, rival flags and encounter rows from the Database', () => {
    expect(RUNTIME_SPECIES).toEqual(authoringSpecies)
    expect(RUNTIME_TRAINERS).toEqual(authoringTrainers)
    expect(RUNTIME_ENCOUNTERS).toEqual(authoringEncounters)
  })
})
