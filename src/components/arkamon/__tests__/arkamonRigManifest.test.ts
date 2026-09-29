import { describe, expect, it } from 'vitest'
import {
  ARKAMON_RIG_MANIFEST,
  getArkamonRig,
} from '../arkamonRigManifest'

describe('Arkamon rig manifest', () => {
  it('enables Darklaw front and back rigs without affecting other species', () => {
    expect(getArkamonRig(5, 'front')).toBeDefined()
    expect(getArkamonRig(5, 'back')).toBeDefined()
    expect(getArkamonRig(1, 'front')).toBeUndefined()
  })

  it('keeps pivots and polygons inside each rig canvas', () => {
    for (const species of Object.values(ARKAMON_RIG_MANIFEST)) {
      if (!species) continue

      for (const rig of Object.values(species)) {
        if (!rig) continue

        expect(rig.canvas.width).toBeGreaterThan(0)
        expect(rig.canvas.height).toBeGreaterThan(0)

        for (const part of rig.parts) {
          expect(part.polygon.length).toBeGreaterThanOrEqual(3)
          expect(part.pivot.x).toBeGreaterThanOrEqual(0)
          expect(part.pivot.x).toBeLessThanOrEqual(rig.canvas.width)
          expect(part.pivot.y).toBeGreaterThanOrEqual(0)
          expect(part.pivot.y).toBeLessThanOrEqual(rig.canvas.height)

          for (const point of part.polygon) {
            expect(point.x).toBeGreaterThanOrEqual(0)
            expect(point.x).toBeLessThanOrEqual(rig.canvas.width)
            expect(point.y).toBeGreaterThanOrEqual(0)
            expect(point.y).toBeLessThanOrEqual(rig.canvas.height)
          }

          if (part.ambient) {
            expect(part.ambient.durationMs).toBeGreaterThan(0)
          }

          for (const stateMotion of Object.values(part.states ?? {})) {
            if (!stateMotion) continue
            expect(stateMotion.durationMs).toBeGreaterThan(0)
          }
        }

        if (rig.blink) {
          expect(rig.blink.cycleMs).toBeGreaterThan(0)
          expect(rig.blink.zones.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('uses at least one true cutout layer for Darklaw tail articulation', () => {
    const front = getArkamonRig(5, 'front')
    const back = getArkamonRig(5, 'back')

    expect(front?.parts.some((part) => part.id === 'tail' && part.cutout)).toBe(true)
    expect(back?.parts.some((part) => part.id === 'tail' && part.cutout)).toBe(true)
  })
})
