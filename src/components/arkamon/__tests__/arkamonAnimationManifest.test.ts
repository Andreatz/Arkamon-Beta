import { describe, expect, it } from 'vitest'
import {
  ARKAMON_ANIMATION_MANIFEST,
  getArkamonAnimationAsset,
  resolveArkamonAnimationAsset,
  type ArkamonBattleAnimation,
} from '../arkamonAnimationManifest'

// Type checking rejects an additional legacy animation key in the public API.
const ANIMATION_CONTRACT: Record<ArkamonBattleAnimation, true> = {
  idle: true, attack: true, hit: true, victory: true, ko: true,
}
const ANIMATIONS = Object.keys(ANIMATION_CONTRACT) as ArkamonBattleAnimation[]

describe('Arkamon animation manifest', () => {
  it('provides one complete Darklaw front set with a single attack animation', () => {
    expect(Object.keys(ARKAMON_ANIMATION_MANIFEST)).toEqual(['5'])
    expect(Object.keys(ARKAMON_ANIMATION_MANIFEST[5]!.front!).sort()).toEqual([...ANIMATIONS].sort())
    expect(getArkamonAnimationAsset(5, 'front', 'idle')).toMatchObject({ frameCount: 96, fps: 24, loop: true })
    expect(ARKAMON_ANIMATION_MANIFEST[5]!.front).not.toHaveProperty('physical')
    expect(ARKAMON_ANIMATION_MANIFEST[5]!.front).not.toHaveProperty('special')
    expect(resolveArkamonAnimationAsset(5, 'back', 'idle')).toBeUndefined()
    expect(resolveArkamonAnimationAsset(1, 'front', 'attack')).toBeUndefined()
    expect(resolveArkamonAnimationAsset(110, 'back', 'attack')).toBeUndefined()
  })

  it.each(ANIMATIONS)('selects the dedicated %s sheet rather than an idle substitute', (animation) => {
    const asset = getArkamonAnimationAsset(5, 'front', animation)
    expect(asset).toBeDefined()
    expect(asset!.src).toBe(`/sprites/arkamon/5/front/${animation}.webp`)
    expect(resolveArkamonAnimationAsset(5, 'front', animation)).toEqual({
      asset, animation, isIdleFallback: false,
    })
    expect(asset!.loop).toBe(animation === 'idle')
  })

  it('retains a view’s idle as the fallback when a dedicated action is unavailable', () => {
    const front = ARKAMON_ANIMATION_MANIFEST[5]!.front!
    const hit = front.hit
    delete front.hit
    try {
      expect(resolveArkamonAnimationAsset(5, 'front', 'hit')).toEqual({
        asset: front.idle, animation: 'idle', isIdleFallback: true,
      })
    } finally {
      front.hit = hit
    }
  })

  it('retains all source frames at native timing within the frame grid', () => {
    for (const animation of ANIMATIONS) {
      const asset = getArkamonAnimationAsset(5, 'front', animation)!
      expect(asset.frameCount).toBe(96)
      expect(asset.fps).toBe(24)
      expect(asset.durationMs).toBe(4000)
      expect((asset.startFrame ?? 0) + asset.frameCount).toBeLessThanOrEqual(asset.columns * asset.rows)
      expect(asset.width / asset.height).toBeCloseTo(asset.frameWidth / asset.frameHeight)
    }
  })
})
