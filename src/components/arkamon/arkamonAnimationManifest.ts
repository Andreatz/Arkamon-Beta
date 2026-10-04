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
  /** Native source frame where an attack releases its effect. */
  releaseFrame?: number
  /** Native source frame where the defender visibly reacts to the impact. */
  reactionFrame?: number
  /** The common battle view inside a padded frame; padding may extend beyond it. */
  viewport?: { width: number; height: number; left: number; top: number }
}

export type ArkamonAnimationSet = Partial<
  Record<ArkamonSpriteSide, Partial<Record<ArkamonBattleAnimation, ArkamonAnimationAsset>>>
>

const FRONT_ANIMATIONS: ArkamonBattleAnimation[] = ['idle', 'attack', 'hit', 'victory', 'ko']

function frontAnimationSet(
  speciesId: number,
  cellSize: number,
  viewport: NonNullable<ArkamonAnimationAsset['viewport']>,
  releaseFrame: number,
  reactionFrame: number,
): ArkamonAnimationSet {
  const front: Partial<Record<ArkamonBattleAnimation, ArkamonAnimationAsset>> = {}
  for (const animation of FRONT_ANIMATIONS) {
    front[animation] = {
      src: `/sprites/arkamon/${speciesId}/front/${animation}.webp`,
      frameWidth: cellSize,
      frameHeight: cellSize,
      columns: 10,
      rows: 10,
      frameCount: 96,
      fps: 24,
      width: cellSize,
      height: cellSize,
      durationMs: 96 / 24 * 1000,
      loop: animation === 'idle',
      viewport,
      ...(animation === 'attack' ? { releaseFrame } : {}),
      ...(animation === 'hit' ? { reactionFrame } : {}),
    }
  }
  return { front }
}

/**
 * Frame grids and padded views match each species' conversion metadata.
 * Action cues are native source-frame indices chosen from the original videos.
 * Other species and the back views retain their existing sprites.
 */
export const ARKAMON_ANIMATION_MANIFEST: Partial<Record<number, ArkamonAnimationSet>> = {
  5: frontAnimationSet(5, 640, { width: 384, height: 384, left: 177, top: 140 }, 31, 28),
  6: frontAnimationSet(6, 704, { width: 320, height: 320, left: 208, top: 191 }, 47, 27),
  7: frontAnimationSet(7, 704, { width: 384, height: 384, left: 152, top: 156 }, 51, 26),
  8: frontAnimationSet(8, 768, { width: 384, height: 384, left: 234, top: 186 }, 26, 37),
  20: frontAnimationSet(20, 704, { width: 384, height: 384, left: 150, top: 153 }, 56, 29),
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
