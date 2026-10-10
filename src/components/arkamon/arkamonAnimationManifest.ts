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
  frameCounts: Partial<Record<ArkamonBattleAnimation, number>> = {},
): ArkamonAnimationSet {
  const front: Partial<Record<ArkamonBattleAnimation, ArkamonAnimationAsset>> = {}
  for (const animation of FRONT_ANIMATIONS) {
    const frameCount = frameCounts[animation] ?? 96
    front[animation] = {
      src: `/sprites/arkamon/${speciesId}/front/${animation}.webp`,
      frameWidth: cellSize,
      frameHeight: cellSize,
      columns: 10,
      rows: 10,
      frameCount,
      fps: 24,
      width: cellSize,
      height: cellSize,
      durationMs: frameCount / 24 * 1000,
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
  1: frontAnimationSet(1, 704, { width: 384, height: 384, left: 196, top: 165 }, 45, 30),
  2: frontAnimationSet(2, 576, { width: 384, height: 384, left: 112, top: 81 }, 53, 22),
  3: frontAnimationSet(3, 576, { width: 384, height: 384, left: 112, top: 90 }, 45, 33),
  4: frontAnimationSet(4, 576, { width: 384, height: 384, left: 153, top: 79 }, 47, 25),
  5: frontAnimationSet(5, 640, { width: 384, height: 384, left: 177, top: 140 }, 31, 28),
  6: frontAnimationSet(6, 704, { width: 320, height: 320, left: 208, top: 191 }, 47, 27),
  7: frontAnimationSet(7, 704, { width: 384, height: 384, left: 152, top: 156 }, 51, 26),
  8: frontAnimationSet(8, 768, { width: 384, height: 384, left: 234, top: 186 }, 26, 37),
  9: frontAnimationSet(9, 512, { width: 384, height: 384, left: 66, top: 69 }, 50, 17),
  10: frontAnimationSet(10, 576, { width: 384, height: 384, left: 122, top: 96 }, 58, 27),
  11: frontAnimationSet(11, 768, { width: 384, height: 384, left: 200, top: 179 }, 58, 26),
  12: frontAnimationSet(12, 704, { width: 384, height: 384, left: 193, top: 145 }, 47, 25),
  13: frontAnimationSet(13, 576, { width: 384, height: 384, left: 95, top: 84 }, 48, 32),
  14: frontAnimationSet(14, 640, { width: 384, height: 384, left: 122, top: 112 }, 48, 23, { ko: 95 }),
  15: frontAnimationSet(15, 768, { width: 384, height: 384, left: 180, top: 212 }, 35, 29),
  16: frontAnimationSet(16, 768, { width: 352, height: 352, left: 202, top: 219 }, 46, 18),
  17: frontAnimationSet(17, 768, { width: 320, height: 320, left: 221, top: 240 }, 43, 38, { attack: 95 }),
  18: frontAnimationSet(18, 768, { width: 384, height: 384, left: 203, top: 193 }, 55, 16),
  19: frontAnimationSet(19, 768, { width: 352, height: 352, left: 204, top: 217 }, 36, 13),
  20: frontAnimationSet(20, 704, { width: 384, height: 384, left: 150, top: 153 }, 56, 29),
  21: frontAnimationSet(21, 768, { width: 384, height: 384, left: 200, top: 207 }, 54, 25),
  23: frontAnimationSet(23, 768, { width: 288, height: 288, left: 239, top: 199 }, 50, 30, { idle: 95 }),
  24: frontAnimationSet(24, 704, { width: 320, height: 320, left: 197, top: 213 }, 52, 27),
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
