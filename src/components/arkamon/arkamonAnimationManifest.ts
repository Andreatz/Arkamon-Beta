import type { SpriteSheetMeta } from '@/components/vfx/types'

export type ArkamonBattleAnimation =
  | 'idle'
  | 'attack'
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
  /** The common battle view inside a padded frame; padding may extend beyond it. */
  viewport?: { width: number; height: number; left: number; top: number }
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
        frameWidth: 640,
        frameHeight: 640,
        columns: 10,
        rows: 10,
        frameCount: 96,
        fps: 24,
        width: 640,
        height: 640,
        loop: true,
        durationMs: 4000,
        viewport: { width: 384, height: 384, left: 177, top: 140 },
      },
      attack: {
        src: '/sprites/arkamon/5/front/attack.webp',
        frameWidth: 640, frameHeight: 640, columns: 10, rows: 10,
        frameCount: 96, fps: 24, width: 640, height: 640,
        durationMs: 4000, loop: false,
        viewport: { width: 384, height: 384, left: 177, top: 140 },
      },
      hit: {
        src: '/sprites/arkamon/5/front/hit.webp',
        frameWidth: 640, frameHeight: 640, columns: 10, rows: 10,
        frameCount: 96, fps: 24, width: 640, height: 640,
        durationMs: 4000, loop: false,
        viewport: { width: 384, height: 384, left: 177, top: 140 },
      },
      victory: {
        src: '/sprites/arkamon/5/front/victory.webp',
        frameWidth: 640, frameHeight: 640, columns: 10, rows: 10,
        frameCount: 96, fps: 24, width: 640, height: 640,
        durationMs: 4000, loop: false,
        viewport: { width: 384, height: 384, left: 177, top: 140 },
      },
      ko: {
        src: '/sprites/arkamon/5/front/ko.webp',
        frameWidth: 640, frameHeight: 640, columns: 10, rows: 10,
        frameCount: 96, fps: 24, width: 640, height: 640,
        durationMs: 4000, loop: false,
        viewport: { width: 384, height: 384, left: 177, top: 140 },
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

/** A dedicated clip's real runtime; static/procedural views add no battle wait. */
export function getArkamonAnimationDurationMs(
  speciesId: number,
  side: ArkamonSpriteSide,
  animation: ArkamonBattleAnimation
): number {
  const asset = getArkamonAnimationAsset(speciesId, side, animation)
  return asset ? asset.durationMs ?? (asset.frameCount / asset.fps) * 1000 : 0
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
