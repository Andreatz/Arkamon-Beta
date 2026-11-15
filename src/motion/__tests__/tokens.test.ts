import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DURATION, EASE, cubicBezier, easing, motionScale, motionSpring, motionTransition, resolveDuration, resolveHold } from '../tokens'

describe('token di movimento', () => {
  it('scala le durate decorative con la velocità e le annulla con il movimento ridotto', () => {
    expect(resolveDuration('slow')).toBe(400)
    expect(resolveDuration('slow', { speed: 2, reducedMotion: false })).toBe(200)
    expect(resolveDuration(300, { speed: 1, reducedMotion: true })).toBe(0)
    expect(resolveDuration(-5)).toBe(0)
    expect(resolveDuration(Number.NaN)).toBe(0)
    expect(resolveDuration(300, { speed: 0, reducedMotion: false })).toBe(300)
  })

  it('conserva il tempo di lettura anche con il movimento ridotto', () => {
    expect(resolveHold(900, { speed: 1, reducedMotion: true })).toBe(900)
    expect(resolveHold(900, { speed: 2, reducedMotion: true })).toBe(450)
    expect(resolveHold(-1)).toBe(0)
  })

  it('espone il fattore per le variabili CSS', () => {
    expect(motionScale({ speed: 1, reducedMotion: false })).toBe(1)
    expect(motionScale({ speed: 2, reducedMotion: false })).toBe(0.5)
    expect(motionScale({ speed: 2, reducedMotion: true })).toBe(0)
  })

  it('produce transizioni e molle pronte per framer-motion', () => {
    expect(motionTransition('base', 'out', { speed: 2, reducedMotion: false })).toEqual({ duration: 0.12, ease: [0.16, 1, 0.3, 1] })
    expect(motionSpring('snappy', { speed: 1, reducedMotion: true })).toEqual({ duration: 0 })
    expect(motionSpring('soft', { speed: 2, reducedMotion: false })).toMatchObject({ type: 'spring', stiffness: 360, damping: 22 })
  })

  it('valuta le curve: estremi esatti, andamento monotono e coerenza con la definizione', () => {
    for (const token of Object.keys(EASE) as (keyof typeof EASE)[]) {
      const curve = easing(token)
      expect(curve(0)).toBe(0)
      expect(curve(1)).toBe(1)
      expect(curve(-2)).toBe(0)
      expect(curve(3)).toBe(1)
    }
    expect(easing('linear')(0.37)).toBeCloseTo(0.37, 6)
    // `out` è già oltre metà corsa a un quarto del tempo; `in` è ancora quasi fermo.
    expect(easing('out')(0.25)).toBeGreaterThan(0.6)
    expect(easing('in')(0.25)).toBeLessThan(0.1)
    const inOut = easing('inOut')
    expect(inOut(0.5)).toBeCloseTo(0.5, 3)
    let previous = 0
    for (let step = 1; step <= 50; step++) {
      const value = inOut(step / 50)
      expect(value).toBeGreaterThanOrEqual(previous - 1e-6)
      previous = value
    }
    // Confronto con il punto noto di ease-in-out standard (0.42, 0, 0.58, 1).
    expect(cubicBezier([0.42, 0, 0.58, 1])(0.25)).toBeCloseTo(0.1291, 3)
    expect(easing('back')(0.7)).toBeGreaterThan(1)
  })

  it('tiene allineate le variabili CSS ai token TypeScript', () => {
    const css = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8')
    for (const [name, milliseconds] of Object.entries(DURATION)) {
      expect(css).toContain(`--motion-${name}: calc(${milliseconds}ms * var(--motion-scale));`)
    }
    const cssName: Record<keyof typeof EASE, string> = { linear: 'linear', out: 'out', in: 'in', inOut: 'in-out', back: 'back' }
    for (const [name, points] of Object.entries(EASE)) {
      expect(css).toContain(`--ease-${cssName[name as keyof typeof EASE]}: cubic-bezier(${points.join(', ')});`)
    }
  })
})
