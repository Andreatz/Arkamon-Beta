import { describe, expect, it } from 'vitest'
import { MOSSE, POKEMON_BASE, getMossa } from '..'
import rules from '../statusMoveRules.json'
import { resolveStatusMove } from '../statusMoves'
import type { MossaDef } from '@/types'

describe('mosse Status del Database', () => {
  const status = MOSSE.filter(move => move.soloStato)

  it('sono 106 e hanno tutte una regola esistente', () => {
    expect(status).toHaveLength(106)
    for (const move of status) {
      expect(rules.regole, `${move.id} ${move.nome}`).toHaveProperty(move.regolaStato!)
      expect(move.effetto).toBe(rules.regole[move.regolaStato as keyof typeof rules.regole].effetto)
    }
  })

  it('prendono effetto e valore dalla regola, senza dadi', () => {
    const fixed = status.find(move => move.regolaStato === 'danno-fisso')!
    expect(fixed).toMatchObject({ effetto: 'DANNO_FISSO', valoreEffetto: 10 })
    expect(status.find(move => move.regolaStato === 'ripristina-hp')).toMatchObject({ effetto: 'CURA_PCT', valoreEffetto: 50 })
    expect(status.find(move => move.regolaStato === 'cura-veleno-hp')).toMatchObject({ effetto: 'CURA_PCT', valoreEffetto: 25 })
    expect(status.every(move => move.dadiPerLivello['5'] === 0)).toBe(true)
  })

  it('una regola sconosciuta lascia la mossa invariata', () => {
    const move = { id: 1, nome: 'X', tipo: 'Normale', effetto: null, valoreEffetto: null, soloStato: true, regolaStato: 'boh', dadiPerLivello: {}, incrementoPerLivello: {} } as MossaDef
    expect(resolveStatusMove(move)).toBe(move)
  })

  it('il terzo slot degli stadi successivi punta a una mossa Status', () => {
    expect(getMossa(POKEMON_BASE.find(p => p.id === 3)!.mosse[2])).toMatchObject({ id: 221, effetto: 'PARALISI', soloStato: true })
    expect(getMossa(230)).toMatchObject({ livelloMinimo: 22 })
  })

  it('ogni mossa assegnata a una specie esiste', () => {
    for (const species of POKEMON_BASE) for (const id of species.mosse) if (id) expect(getMossa(id), `${species.id}`).toBeDefined()
  })
})
