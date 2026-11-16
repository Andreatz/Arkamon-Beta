import { describe, expect, it } from 'vitest'
import { MOSSE } from '@/data/index'
import { battleMoveFacts, battleStatusDescription } from './battleMoveFacts'

describe('battle move facts', () => {
  it('shows healing, not offensive dice, for every healing move', () => {
    const healing = MOSSE.filter((move) => move.effetto === 'CURA_PCT' || move.effetto === 'CURA')
    expect(healing.length).toBeGreaterThan(0)
    for (const move of healing) {
      const facts = battleMoveFacts(move, 20, 'Fuoco')
      expect(facts.kind).toBe('heal')
      expect(facts.label).toContain(String(move.valoreEffetto))
      expect(facts.detail).toContain('Rimuove veleno e paralisi')
      expect(facts.detail).not.toMatch(/\dd6|Efficacia/)
    }
  })
  it('uses the actual Arkamon type matrix and does not add STAB', () => {
    const electric = MOSSE.find((move) => move.tipo === 'Elettro' && !move.effetto && !move.soloStato)!
    expect(battleMoveFacts(electric, 20, 'Acqua').detail).toContain('×2')
    expect(battleMoveFacts(electric, 20, 'Terra').detail).toContain('×0.5')
    expect(battleMoveFacts(electric, 20).detail).not.toContain('Efficacia')
  })
  it('keeps status moves separate from offensive moves and Suprema', () => {
    const status = MOSSE.find((move) => move.soloStato)!
    expect(battleMoveFacts(status, 100).kind).toBe('status')
    expect(battleMoveFacts(status, 100).label).toBe('Paralisi · 80%')
    expect(battleMoveFacts(status, 100).detail).toContain('La Suprema è riservata alle mosse offensive con dadi.')
  })
  it('describes the active status rule for both imported moves and recovered saves', () => {
    const poison = { tipo: 'Avvelenato' as const, turniRimanenti: -1, turniTrascorsi: 2 }
    expect(battleStatusDescription(poison)).toContain('30% degli HP massimi')
    expect(battleStatusDescription({ ...poison, regola: 'database' })).toContain('12,5% degli HP massimi')
    expect(battleStatusDescription({ tipo: 'Addormentato', turniRimanenti: 2, regola: 'database' })).toContain('al terzo al 75%')
  })
})
