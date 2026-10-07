import { describe, expect, it } from 'vitest'
import {
  ARKAMON_ANIMATION_MANIFEST,
  getArkamonAnimationAsset,
  getArkamonAnimationDurationMs,
  resolveArkamonAnimationAsset,
  type ArkamonBattleAnimation,
} from '../arkamonAnimationManifest'

// Type checking rejects an additional legacy animation key in the public API.
const ANIMATION_CONTRACT: Record<ArkamonBattleAnimation, true> = {
  idle: true, attack: true, hit: true, victory: true, ko: true,
}
const SPECIES_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 20, 21]
const ORIGINAL_SPECIES_IDS = [5, 6, 7, 8, 20]
const ANIMATIONS = Object.keys(ANIMATION_CONTRACT) as ArkamonBattleAnimation[]

describe('Arkamon animation manifest', () => {
  it('provides every supplied species with a complete front set and a single attack animation', () => {
    expect(Object.keys(ARKAMON_ANIMATION_MANIFEST).map(Number)).toEqual(SPECIES_IDS)
    for (const speciesId of SPECIES_IDS) {
      expect(Object.keys(ARKAMON_ANIMATION_MANIFEST[speciesId]!.front!).sort()).toEqual([...ANIMATIONS].sort())
      expect(ARKAMON_ANIMATION_MANIFEST[speciesId]!.front).not.toHaveProperty('physical')
      expect(ARKAMON_ANIMATION_MANIFEST[speciesId]!.front).not.toHaveProperty('special')
      for (const animation of ANIMATIONS) {
        expect(resolveArkamonAnimationAsset(speciesId, 'back', animation)).toBeUndefined()
        expect(getArkamonAnimationDurationMs(speciesId, 'back', animation)).toBe(0)
      }
    }
    expect(resolveArkamonAnimationAsset(110, 'front', 'attack')).toBeUndefined()
    expect(resolveArkamonAnimationAsset(110, 'back', 'attack')).toBeUndefined()
  })

  it.each(SPECIES_IDS.flatMap((speciesId) => ANIMATIONS.map((animation) => ({ speciesId, animation }))))(
    'selects the dedicated $animation sheet for species $speciesId', ({ speciesId, animation }) => {
    const asset = getArkamonAnimationAsset(speciesId, 'front', animation)
    expect(asset).toBeDefined()
    expect(asset!.src).toBe(`/sprites/arkamon/${speciesId}/front/${animation}.webp`)
    expect(resolveArkamonAnimationAsset(speciesId, 'front', animation)).toEqual({
      asset, animation, isIdleFallback: false,
    })
    expect(asset!.loop).toBe(animation === 'idle')
    expect(getArkamonAnimationDurationMs(speciesId, 'front', animation)).toBe(asset!.durationMs)
  })

  it.each(SPECIES_IDS)('uses native-frame cues only on attack and hit for species %s', (speciesId) => {
    const attack = getArkamonAnimationAsset(speciesId, 'front', 'attack')!
    const hit = getArkamonAnimationAsset(speciesId, 'front', 'hit')!
    for (const [asset, marker] of [[attack, attack.releaseFrame], [hit, hit.reactionFrame]] as const) {
      expect(Number.isInteger(marker)).toBe(true)
      expect(marker).toBeGreaterThanOrEqual(0)
      expect(marker).toBeLessThan(asset.frameCount)
      expect(marker! / asset.fps * 1000).toBeLessThan(asset.durationMs!)
    }
    expect(attack.reactionFrame).toBeUndefined()
    expect(hit.releaseFrame).toBeUndefined()
    for (const animation of ['idle', 'victory', 'ko'] as const) {
      const asset = getArkamonAnimationAsset(speciesId, 'front', animation)!
      expect(asset.releaseFrame).toBeUndefined()
      expect(asset.reactionFrame).toBeUndefined()
    }
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
    for (const speciesId of SPECIES_IDS) for (const animation of ANIMATIONS) {
      const asset = getArkamonAnimationAsset(speciesId, 'front', animation)!
      expect(Number.isInteger(asset.frameCount)).toBe(true)
      expect(asset.frameCount).toBeGreaterThan(1)
      expect(asset.fps).toBeGreaterThan(0)
      expect(asset.durationMs).toBeCloseTo(asset.frameCount / asset.fps * 1000)
      expect((asset.startFrame ?? 0) + asset.frameCount).toBeLessThanOrEqual(asset.columns * asset.rows)
      expect(asset.width / asset.height).toBeCloseTo(asset.frameWidth / asset.frameHeight)
    }
  })

  it('keeps the original five front sets at their existing native 96 frames and 24 FPS', () => {
    for (const speciesId of ORIGINAL_SPECIES_IDS) for (const animation of ANIMATIONS) {
      const asset = getArkamonAnimationAsset(speciesId, 'front', animation)!
      expect(asset.frameCount).toBe(96)
      expect(asset.fps).toBe(24)
      expect(asset.durationMs).toBe(4000)
    }
  })
})
