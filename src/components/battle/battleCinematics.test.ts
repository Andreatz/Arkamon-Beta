import { describe, expect, it } from 'vitest'
import { poseForTarget } from '@/motion/camera'
import { attackerShot, damageTrauma, diceCellWidth, efficacyTone, focusOf, knockoutShot, opponentOf, outcomeShot, targetShot } from './battleCinematics'

describe('regia della battaglia', () => {
  it('associa i lati ai punti di interesse della cinepresa', () => {
    expect(focusOf('A')).toBe('player')
    expect(focusOf('B')).toBe('enemy')
    expect(opponentOf('A')).toBe('B')
    expect(opponentOf('B')).toBe('A')
  })

  it('classifica l’efficacia dal moltiplicatore del motore', () => {
    expect(efficacyTone(1.5)).toBe('super')
    expect(efficacyTone(0.5)).toBe('weak')
    expect(efficacyTone(1)).toBe('normal')
    expect(efficacyTone(Number.NaN)).toBe('normal')
  })

  it('dosa la scossa sulla quota di HP tolta', () => {
    expect(damageTrauma(0, 40)).toBe(0)
    expect(damageTrauma(5, 0)).toBe(0)
    expect(damageTrauma(-3, 40)).toBe(0)
    const light = damageTrauma(2, 40)
    const medium = damageTrauma(10, 40)
    const heavy = damageTrauma(30, 40)
    expect(light).toBeGreaterThan(0.3)
    expect(light).toBeLessThan(medium)
    expect(medium).toBeLessThan(heavy)
    expect(damageTrauma(40, 40)).toBe(1)
    expect(damageTrauma(400, 40)).toBe(1)
  })

  it('un KO scuote sempre con forza, anche con poco danno residuo', () => {
    expect(damageTrauma(1, 60, true)).toBe(0.8)
    expect(damageTrauma(55, 60, true)).toBeGreaterThan(0.9)
    expect(damageTrauma(1, 60, false)).toBeLessThan(0.4)
  })

  it('stringe e inclina l’inquadratura per la Suprema, in direzioni opposte per i due lati', () => {
    const normal = attackerShot('A', false)
    const supremeA = attackerShot('A', true)
    const supremeB = attackerShot('B', true)
    expect(normal).toMatchObject({ focus: 'player', rotate: 0 })
    expect(supremeA.zoom!).toBeGreaterThan(normal.zoom!)
    expect(supremeA.rotate).toBe(-supremeB.rotate!)
    expect(supremeB.focus).toBe('enemy')
  })

  it('tutte le inquadrature restano entro i limiti della cinepresa', () => {
    const shots = [attackerShot('A', false), attackerShot('B', true), targetShot('A', false), targetShot('B', true), knockoutShot('A'), outcomeShot('B')]
    for (const shot of shots) {
      expect(shot.zoom!).toBeGreaterThan(1)
      expect(shot.zoom!).toBeLessThanOrEqual(1.4)
      // Con un punto qualunque del palco la posa non scopre mai i bordi.
      const pose = poseForTarget({ focus: { x: 0.2, y: 0.75 }, zoom: shot.zoom })
      expect(Math.abs(pose.x)).toBeLessThanOrEqual((pose.zoom - 1) / 2 + 1e-9)
    }
    expect(targetShot('B', false)).toMatchObject({ focus: 'enemy', rotate: 0 })
    expect(knockoutShot('A').focus).toBe('player')
    expect(outcomeShot('A').focus).toBe('player')
  })

  it('ingrandisce i dadi quando sono pochi e non supera mai la griglia precedente quando sono molti', () => {
    const widths = [1, 2, 3, 4, 6, 12, 20].map((count) => diceCellWidth(count).desktop)
    expect(widths).toEqual([210, 190, 168, 146, 124, 106, 80])
    for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeLessThan(widths[i - 1])
    // Sei celle affiancate non devono superare il pannello (680 px meno i margini).
    expect(diceCellWidth(6).desktop * 6).toBeLessThanOrEqual(760)
    expect(diceCellWidth(13)).toEqual({ desktop: 80, mobile: 50 })
    expect(diceCellWidth(9)).toEqual({ desktop: 106, mobile: 94 })
  })
})
