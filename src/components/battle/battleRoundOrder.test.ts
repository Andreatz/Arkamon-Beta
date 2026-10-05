import { describe, expect, it } from 'vitest'
import { nextBattleSide } from './battleRoundOrder'
import type { Lato } from '@/types'
describe('round initiative', () => {
  it('new paralysis changes the next round, with one action per side in the current round', () => {
    const acted = new Set<Lato>()
    expect(nextBattleSide(acted, 'A', 'A')).toBe('B')
    expect(nextBattleSide(acted, 'B', 'A', 'Paralizzato')).toBe('B')
    expect(nextBattleSide(acted, 'B', 'A', 'Paralizzato')).toBe('A')
    expect(nextBattleSide(acted, 'A', 'A', 'Paralizzato')).toBe('B')
  })
  it('recovery restores the initial priority after both actions, not mid-round', () => {
    const acted = new Set<Lato>()
    expect(nextBattleSide(acted, 'B', 'A', 'Paralizzato')).toBe('A')
    expect(nextBattleSide(acted, 'A', 'A')).toBe('A')
    expect(nextBattleSide(acted, 'A', 'A')).toBe('B')
  })
})
