import { describe, expect, it } from 'vitest'
import authoringMoves from '../mosse.json'
import { BASE_RUNTIME_MOVES } from '../runtimeGameData'

describe('compact startup game catalog', () => {
  it('reproduces all authored definitions and every value at every level', () => {
    expect(BASE_RUNTIME_MOVES).toEqual(authoringMoves)
    expect(BASE_RUNTIME_MOVES).toHaveLength(516)
  })

  it('does not share mutable level tables between definitions', () => {
    const tables = BASE_RUNTIME_MOVES.flatMap(move => [move.dadiPerLivello, move.incrementoPerLivello])
    expect(new Set(tables).size).toBe(tables.length)
  })
})
