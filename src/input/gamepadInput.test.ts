import { describe, expect, it } from 'vitest'
import { heldActions, INITIAL_PAD_STATE, nearestInDirection, REPEAT_DELAY_MS, REPEAT_INTERVAL_MS, stepPad, type PadSnapshot } from './gamepadInput'

const pad = (pressed: number[] = [], axes: number[] = [0, 0]): PadSnapshot => ({
  buttons: Array.from({ length: 17 }, (_, index) => pressed.includes(index)), axes,
})

describe('mappatura standard del gamepad', () => {
  it('riconosce pulsanti, croce e levetta oltre la zona morta', () => {
    expect([...heldActions([pad([0, 9, 12])])].sort()).toEqual(['confirm', 'menu', 'up'])
    expect([...heldActions([pad([], [0.8, -0.9])])].sort()).toEqual(['right', 'up'])
    expect(heldActions([pad([], [0.3, -0.2])]).size).toBe(0)
    expect([...heldActions([pad([4]), pad([1, 5])])].sort()).toEqual(['back', 'next-tab', 'prev-tab'])
  })
})

describe('pressione e ripetizione', () => {
  it('scatta una volta alla pressione e non ripete conferma o indietro', () => {
    let state = INITIAL_PAD_STATE
    const first = stepPad(state, new Set(['confirm']), 0)
    expect(first.fired).toEqual(['confirm'])
    state = first.state
    expect(stepPad(state, new Set(['confirm']), 5000).fired).toEqual([])
  })

  it('ripete una direzione tenuta dopo il ritardo, a intervalli regolari', () => {
    let state = INITIAL_PAD_STATE
    const fired: number[] = []
    for (let now = 0; now <= REPEAT_DELAY_MS + REPEAT_INTERVAL_MS * 3; now += 16) {
      const step = stepPad(state, new Set(['down']), now)
      state = step.state
      if (step.fired.length) fired.push(now)
    }
    expect(fired[0]).toBe(0)
    expect(fired[1]).toBeGreaterThanOrEqual(REPEAT_DELAY_MS)
    expect(fired.length).toBeGreaterThanOrEqual(3)
    for (let index = 2; index < fired.length; index++) expect(fired[index] - fired[index - 1]).toBeGreaterThanOrEqual(REPEAT_INTERVAL_MS)
  })

  it('rilasciare e ripremere scatta di nuovo subito', () => {
    let state = stepPad(INITIAL_PAD_STATE, new Set(['left']), 0).state
    state = stepPad(state, new Set(), 16).state
    expect(stepPad(state, new Set(['left']), 32).fired).toEqual(['left'])
  })
})

describe('fuoco geometrico', () => {
  const at = (left: number, top: number) => ({ left, top, width: 40, height: 20 })
  const from = at(100, 100)

  it('sceglie il vicino nella direzione restando in riga', () => {
    const candidates = [at(200, 100), at(160, 220), at(100, 40), at(20, 100)]
    expect(nearestInDirection(from, candidates, 'right')).toBe(0)
    expect(nearestInDirection(from, candidates, 'down')).toBe(1)
    expect(nearestInDirection(from, candidates, 'up')).toBe(2)
    expect(nearestInDirection(from, candidates, 'left')).toBe(3)
  })

  it('preferisce l’allineato al più vicino in diagonale', () => {
    expect(nearestInDirection(from, [at(160, 170), at(100, 220)], 'down')).toBe(1)
  })

  it('restituisce -1 se nella direzione non c’è nulla', () => {
    expect(nearestInDirection(from, [at(20, 100)], 'right')).toBe(-1)
  })
})
