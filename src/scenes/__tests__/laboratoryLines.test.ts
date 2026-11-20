import { describe, expect, it } from 'vitest'
import { professorLine } from '../laboratoryLines'

describe('battute del Professore (audit fase 6)', () => {
  it('presenta la scelta, poi descrive la capsula indicata', () => {
    expect(professorLine({ kind: 'intro' })).toContain('Vyrath, Darklaw o Felyss')
    expect(professorLine({ kind: 'hover', name: 'Darklaw', type: 'Oscurità', taken: false })).toMatch(/Darklaw.*Oscurità.*Psico/)
    expect(professorLine({ kind: 'hover', name: 'Vyrath', type: 'Normale', taken: false })).toContain('non ha debolezze')
  })

  it('distingue una capsula già presa, la scelta appena fatta e la fine', () => {
    expect(professorLine({ kind: 'hover', name: 'Felyss', type: 'Psico', taken: true })).toContain('già un allenatore')
    expect(professorLine({ kind: 'chosen', player: 'Andrea', name: 'Darklaw' })).toBe('Ottima scelta, Andrea! Darklaw ti seguirà in tutta Italia.')
    expect(professorLine({ kind: 'done' })).toContain('Rivale')
  })
})
