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
 * Add species and views incrementally. An idle sheet remains the visual during
 * actions without a dedicated sheet; species and views without an idle retain
 * their existing static PNGs and procedural motion.
 */
export const ARKAMON_ANIMATION_MANIFEST: Partial<Record<number, ArkamonAnimationSet>> = {
  5: {
    front: {
      idle: {
        src: '/sprites/arkamon/5/front/idle.webp',
        frameWidth: 384,
        frameHeight: 384,
        columns: 8,
        rows: 6,
        frameCount: 48,
        fps: 12,
        width: 384,
        height: 384,
        loop: true,
      },
    },
  },
}

export function getArkamonAnimationAsset(
  speciesId: number,
  side: ArkamonSpriteSide,
  animation: ArkamonBattleAnimation
): ArkamonAnimationAsset | undefined {
  return ARKAMON_ANIMATION_MANIFEST[speciesId]?.[side]?.[animation]
}

export interface ResolvedArkamonAnimation {
  asset: ArkamonAnimationAsset
  animation: ArkamonBattleAnimation
  isIdleFallback: boolean
}

/** Prefer the requested pose, then keep this view's idle instead of changing art. */
export function resolveArkamonAnimationAsset(
  speciesId: number,
  side: ArkamonSpriteSide,
  animation: ArkamonBattleAnimation
): ResolvedArkamonAnimation | undefined {
  const exact = getArkamonAnimationAsset(speciesId, side, animation)
  if (exact) return { asset: exact, animation, isIdleFallback: false }

  const idle = getArkamonAnimationAsset(speciesId, side, 'idle')
  return idle ? { asset: idle, animation: 'idle', isIdleFallback: true } : undefined
}
