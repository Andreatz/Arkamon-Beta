import { describe, expect, it } from 'vitest'
import {
  ARKAMON_ANIMATION_MANIFEST,
  getArkamonAnimationAsset,
  resolveArkamonAnimationAsset,
} from '../arkamonAnimationManifest'

describe('Arkamon animation manifest', () => {
  it('opts only the Darklaw front view into the prototype', () => {
    expect(Object.keys(ARKAMON_ANIMATION_MANIFEST)).toEqual(['5'])
    expect(getArkamonAnimationAsset(5, 'front', 'idle')).toMatchObject({
      src: '/sprites/arkamon/5/front/idle.webp',
      loop: true,
    })
    expect(getArkamonAnimationAsset(5, 'front', 'idle')!.frameCount).toBeGreaterThan(1)
    expect(resolveArkamonAnimationAsset(5, 'back', 'idle')).toBeUndefined()
    expect(resolveArkamonAnimationAsset(1, 'front', 'idle')).toBeUndefined()
    expect(resolveArkamonAnimationAsset(110, 'back', 'physical')).toBeUndefined()
  })

  it.each(['physical', 'special', 'hit', 'ko', 'victory'] as const)(
    'retains the animated idle art during %s without a dedicated pose',
    (animation) => {
      expect(getArkamonAnimationAsset(5, 'front', animation)).toBeUndefined()
      expect(resolveArkamonAnimationAsset(5, 'front', animation)).toEqual({
        asset: getArkamonAnimationAsset(5, 'front', 'idle'),
        animation: 'idle',
        isIdleFallback: true,
      })
    }
  )

  it('uses a dedicated action sheet before the idle fallback', () => {
    const front = ARKAMON_ANIMATION_MANIFEST[5]!.front!
    const original = front.special
    const special = { ...front.idle!, src: '/dedicated-special.webp', loop: false }
    front.special = special
    try {
      expect(resolveArkamonAnimationAsset(5, 'front', 'special')).toEqual({
        asset: special,
        animation: 'special',
        isIdleFallback: false,
      })
    } finally {
      if (original) front.special = original
      else delete front.special
    }
  })

  it('marks the idle itself as an exact animation to avoid a second idle bounce', () => {
    expect(resolveArkamonAnimationAsset(5, 'front', 'idle')).toMatchObject({
      animation: 'idle',
      isIdleFallback: false,
    })
  })

  it('keeps every animation in bounds and preserves its frame aspect ratio', () => {
    for (const species of Object.values(ARKAMON_ANIMATION_MANIFEST)) {
      if (!species) continue
      for (const side of Object.values(species)) {
        if (!side) continue
        for (const animation of Object.values(side)) {
          if (!animation) continue
          expect((animation.startFrame ?? 0) + animation.frameCount).toBeLessThanOrEqual(
            animation.columns * animation.rows
          )
          expect(animation.frameCount).toBeGreaterThan(0)
          expect(animation.fps).toBeGreaterThan(0)
          expect(animation.frameWidth).toBeGreaterThan(0)
          expect(animation.frameHeight).toBeGreaterThan(0)
          expect(animation.width).toBeGreaterThan(0)
          expect(animation.height).toBeGreaterThan(0)
          expect(animation.width / animation.height).toBeCloseTo(
            animation.frameWidth / animation.frameHeight
          )
        }
      }
    }
  })
})
