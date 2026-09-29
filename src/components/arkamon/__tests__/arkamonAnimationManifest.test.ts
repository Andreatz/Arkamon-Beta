import { describe, expect, it } from 'vitest'
import {
  ARKAMON_ANIMATION_MANIFEST,
  getArkamonAnimationAsset,
} from '../arkamonAnimationManifest'

describe('Arkamon animation manifest', () => {
  it('allows species to opt into animations incrementally', () => {
    expect(Object.keys(ARKAMON_ANIMATION_MANIFEST)).toHaveLength(0)
    expect(getArkamonAnimationAsset(1, 'front', 'idle')).toBeUndefined()
  })

  it('keeps every configured animation inside its sprite-sheet bounds', () => {
    for (const species of Object.values(ARKAMON_ANIMATION_MANIFEST)) {
      if (!species) continue
      for (const side of Object.values(species)) {
        if (!side) continue
        for (const animation of Object.values(side)) {
          if (!animation) continue
          expect(animation.frameCount).toBeLessThanOrEqual(
            animation.columns * animation.rows
          )
          expect(animation.fps).toBeGreaterThan(0)
          expect(animation.width).toBeGreaterThan(0)
          expect(animation.height).toBeGreaterThan(0)
        }
      }
    }
  })
})
