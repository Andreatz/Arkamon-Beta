import { describe, expect, it } from 'vitest'
import { EVOLUTION_WHITE_AT, evolutionAlternation } from './evolutionChoreography'

describe('coreografia dell’evoluzione', () => {
  it('alterna le due forme con intervalli sempre più brevi', () => {
    const { times, oldOpacity, newOpacity } = evolutionAlternation()
    expect(times[0]).toBe(0)
    expect(times[times.length - 1]).toBe(1)
    expect(times).toHaveLength(oldOpacity.length)
    expect(times).toHaveLength(newOpacity.length)
    const gaps = times.slice(1, -1).map((time, index) => time - times[index])
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeLessThanOrEqual(gaps[i - 1] + 1e-4)
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1])
  })

  it('parte dalla forma vecchia e a ogni cambio ne mostra una sola', () => {
    const { oldOpacity, newOpacity } = evolutionAlternation(6)
    expect(oldOpacity[0]).toBe(1)
    expect(newOpacity[0]).toBe(0)
    for (let i = 0; i < oldOpacity.length - 1; i++) expect(oldOpacity[i] + newOpacity[i]).toBe(1)
    expect(oldOpacity[oldOpacity.length - 1]).toBe(1)
    expect(newOpacity[newOpacity.length - 1]).toBe(1)
  })

  it('l’alternanza termina prima del lampo bianco', () => {
    const { times } = evolutionAlternation()
    expect(times[times.length - 2]).toBeLessThan(EVOLUTION_WHITE_AT)
  })

  it('tollera parametri fuori scala', () => {
    expect(evolutionAlternation(0).times).toHaveLength(4)
    expect(evolutionAlternation(3.7).times).toHaveLength(5)
  })
})
