import type { SpriteSheetMeta } from '@/components/vfx/types'

export type ArkamonBattleAnimation =
  | 'idle'
  | 'physical'
  | 'special'
  | 'hit'
  | 'ko'
  | 'victory'

export type ArkamonSpriteSide = 'front' | 'back'

export interface ArkamonAnimationAsset extends SpriteSheetMeta {
  src: string
  width: number
  height: number
  durationMs?: number
  loop?: boolean
}

export type ArkamonAnimationSet = Partial<
  Record<ArkamonSpriteSide, Partial<Record<ArkamonBattleAnimation, ArkamonAnimationAsset>>>
>

/**
 * Add species incrementally. Missing entries intentionally fall back to the
 * existing static front/back PNGs, so animated and static Arkamon can coexist.
 *
 * Example:
 *
 * 1: {
 *   front: {
 *     idle: {
 *       src: 'sprites/arkamon/1/front/idle.webp',
 *       frameWidth: 256,
 *       frameHeight: 256,
 *       columns: 4,
 *       rows: 2,
 *       frameCount: 8,
 *       fps: 12,
 *       width: 256,
 *       height: 256,
 *       loop: true,
 *     },
 *   },
 * },
 */
export const ARKAMON_ANIMATION_MANIFEST: Partial<Record<number, ArkamonAnimationSet>> = {}

export function getArkamonAnimationAsset(
  speciesId: number,
  side: ArkamonSpriteSide,
  animation: ArkamonBattleAnimation
): ArkamonAnimationAsset | undefined {
  return ARKAMON_ANIMATION_MANIFEST[speciesId]?.[side]?.[animation]
}
