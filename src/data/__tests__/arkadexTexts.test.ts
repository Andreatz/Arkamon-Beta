import { describe, expect, it } from 'vitest'
import arkadexTexts from '../arkadexTexts.json'
import { POKEMON_BASE } from '../index'
import { getArkadexText } from '../arkadexTexts'

describe('testi dell’Arkadex', () => {
  it('hanno una voce per ogni specie, nello stesso ordine e con lo stesso nome', () => {
    expect(arkadexTexts.specie.map((entry) => [entry.id, entry.nome])).toEqual(POKEMON_BASE.map((specie) => [specie.id, specie.nome]))
  })

  it('un testo vuoto o di soli spazi non viene mostrato', () => {
    const empty = arkadexTexts.specie.find((entry) => entry.testo.trim() === '')
    if (empty) expect(getArkadexText(empty.id)).toBeUndefined()
    expect(getArkadexText(9999)).toBeUndefined()
  })
})
