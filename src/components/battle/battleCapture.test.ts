import { describe, expect, it } from 'vitest'
import { captureBagArt, captureMaxTotal, planDiceCapture, planMasterCapture } from './battleCapture'

describe('cattura in scena', () => {
  it('usa la parte intera della soglia, perché i dadi sono interi', () => {
    expect(captureMaxTotal(10)).toBe(10)
    expect(captureMaxTotal(12.5)).toBe(12)
    expect(captureMaxTotal(13.333333)).toBe(13)
    expect(captureMaxTotal(Number.NaN)).toBe(0)
  })

  it('una cattura riuscita resiste a tutte e tre le oscillazioni', () => {
    const plan = planDiceCapture({ tiri: [2, 3, 4], soglia: 10, riuscita: true })
    expect(plan.caught).toBe(true)
    expect(plan.steps).toEqual([
      { die: 2, total: 2, holds: true },
      { die: 3, total: 5, holds: true },
      { die: 4, total: 9, holds: true },
    ])
    expect(plan.maxTotal).toBe(10)
  })

  it('la sfera si apre al primo dado che supera la soglia, senza rivelare i successivi', () => {
    const plan = planDiceCapture({ tiri: [6, 6, 1], soglia: 10, riuscita: false })
    expect(plan.caught).toBe(false)
    expect(plan.steps).toEqual([
      { die: 6, total: 6, holds: true },
      { die: 6, total: 12, holds: false },
    ])
  })

  it('una fuga decisa dall’ultimo dado mostra tutte e tre le oscillazioni', () => {
    const plan = planDiceCapture({ tiri: [3, 3, 5], soglia: 10, riuscita: false })
    expect(plan.steps.map((step) => step.holds)).toEqual([true, true, false])
    expect(plan.steps[2].total).toBe(11)
  })

  it('la soglia decimale vale per la sua parte intera', () => {
    expect(planDiceCapture({ tiri: [4, 4, 4], soglia: 12.5, riuscita: true }).steps.every((step) => step.holds)).toBe(true)
    const plan = planDiceCapture({ tiri: [5, 4, 4], soglia: 12.5, riuscita: false })
    expect(plan.steps[2]).toEqual({ die: 4, total: 13, holds: false })
  })

  it('l’esito finale resta sempre quello del motore', () => {
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) {
      for (const soglia of [6, 9.5, 10, 12.5, 15]) {
        const riuscita = a + b + c <= soglia
        const plan = planDiceCapture({ tiri: [a, b, c], soglia, riuscita })
        expect(plan.caught).toBe(riuscita)
        expect(plan.steps[plan.steps.length - 1].holds).toBe(riuscita)
        // Ogni oscillazione prima dell'ultima ha resistito.
        expect(plan.steps.slice(0, -1).every((step) => step.holds)).toBe(true)
      }
    }
  })

  it('la Masterball oscilla tre volte senza dadi e riesce sempre', () => {
    const plan = planMasterCapture()
    expect(plan).toMatchObject({ kind: 'master', caught: true, maxTotal: null })
    expect(plan.steps).toHaveLength(3)
    expect(plan.steps.every((step) => step.die === null && step.holds)).toBe(true)
  })

  it('sceglie l’illustrazione del Sacchettino lanciato, con il Supremo per la cattura garantita', () => {
    expect(captureBagArt('sacchettino', 'dice')).toBe('item-sacchettino')
    expect(captureBagArt('mega-sacchettino', 'dice')).toBe('item-mega-sacchettino')
    expect(captureBagArt('ultra-sacchettino', 'dice')).toBe('item-ultra-sacchettino')
    expect(captureBagArt('masterball', 'master')).toBe('item-sacchettino-supremo')
    expect(captureBagArt(undefined, 'master')).toBe('item-sacchettino-supremo')
    expect(captureBagArt(undefined, 'dice')).toBe('item-sacchettino')
  })
})
