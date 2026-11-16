import { describe, expect, it } from 'vitest'
import { counterDurationMs, counterValueAt } from './counter'
import { tiltPose } from './tilt'
import { navigationDirection } from './navigationMotion'
import { typeColorVar } from './typeColors'

describe('contatori', () => {
  it('parte dal valore precedente, arriva esatto e non supera mai il traguardo', () => {
    expect(counterValueAt(100, 350, 0)).toBe(100)
    expect(counterValueAt(100, 350, 1)).toBe(350)
    let previous = 100
    for (let step = 1; step <= 20; step++) {
      const value = counterValueAt(100, 350, step / 20)
      expect(value).toBeGreaterThanOrEqual(previous)
      expect(value).toBeLessThanOrEqual(350)
      expect(Number.isInteger(value)).toBe(true)
      previous = value
    }
  })

  it('scende senza andare sotto il traguardo', () => {
    for (let step = 0; step <= 10; step++) expect(counterValueAt(500, 300, step / 10)).toBeGreaterThanOrEqual(300)
    expect(counterValueAt(500, 300, 0.5)).toBeLessThan(500)
  })

  it('la durata cresce con il salto ma resta fra 320 e 900 ms', () => {
    expect(counterDurationMs(10, 10)).toBe(0)
    expect(counterDurationMs(0, 1)).toBeGreaterThanOrEqual(320)
    expect(counterDurationMs(0, 200)).toBeGreaterThan(counterDurationMs(0, 5))
    expect(counterDurationMs(0, 10_000_000)).toBe(900)
  })
})

describe('inclinazione delle carte', () => {
  const card = { left: 100, top: 100, width: 200, height: 200 }

  it('al centro resta piatta con il riflesso al centro', () => {
    expect(tiltPose(card, 200, 200)).toMatchObject({ rx: 0, ry: 0, angle: 0, glareX: 50, glareY: 50, axisX: 1, axisY: 0 })
  })

  it('verso l’angolo in alto a destra ruota su entrambi gli assi entro il limite', () => {
    const pose = tiltPose(card, 300, 100)
    expect(pose.rx).toBeGreaterThan(0)
    expect(pose.ry).toBeGreaterThan(0)
    expect(Math.abs(pose.rx)).toBeLessThanOrEqual(7)
    expect(pose.angle).toBeCloseTo(Math.hypot(pose.rx, pose.ry), 1)
    expect(Math.hypot(pose.axisX, pose.axisY)).toBeCloseTo(1, 1)
    expect(pose).toMatchObject({ glareX: 100, glareY: 0 })
  })

  it('i pannelli grandi si inclinano meno delle tessere', () => {
    const small = tiltPose(card, 300, 200)
    const large = tiltPose({ left: 0, top: 0, width: 1200, height: 600 }, 1200, 300)
    expect(large.ry).toBeLessThan(small.ry)
  })

  it('un puntatore fuori dalla carta resta sul bordo', () => {
    expect(tiltPose(card, 900, -50)).toEqual(tiltPose(card, 300, 100))
  })
})

describe('direzione della navigazione nel Menù Partita', () => {
  const order = ['partita', 'squadra', 'deposito', 'arkadex', 'analisi', 'borsa']

  it('segue l’ordine della barra e ribalta al cambio giocatore', () => {
    expect(navigationDirection({ pane: 'partita', playerId: 1 }, { pane: 'arkadex', playerId: 1 }, order)).toBe('forward')
    expect(navigationDirection({ pane: 'borsa', playerId: 1 }, { pane: 'squadra', playerId: 1 }, order)).toBe('back')
    expect(navigationDirection({ pane: 'squadra', playerId: 1 }, { pane: 'squadra', playerId: 2 }, order)).toBe('flip')
    expect(navigationDirection({ pane: 'squadra', playerId: 2 }, { pane: 'squadra', playerId: 2 }, order)).toBeUndefined()
  })

  it('gli strumenti si aprono in avanti e si chiudono indietro', () => {
    expect(navigationDirection({ pane: 'partita', playerId: 1 }, { pane: 'settings', playerId: 1 }, order)).toBe('forward')
    expect(navigationDirection({ pane: 'settings', playerId: 1 }, { pane: 'partita', playerId: 1 }, order)).toBe('back')
  })
})

it('i colori dei tipi passano per le variabili CSS', () => {
  expect(typeColorVar('Oscurità')).toBe('var(--arka-type-oscurita)')
  expect(typeColorVar('Fuoco')).toBe('var(--arka-type-fuoco)')
})
