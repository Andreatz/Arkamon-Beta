import type { SpriteSheetMeta } from '@/components/vfx/types'
import { getNativeRuntimeClip } from './nativeRuntimePages'
import type { SpritePage } from '@/components/vfx/spritePages'

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
  pages?: readonly SpritePage[]
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
  25: frontAnimationSet(25, 704, { width: 256, height: 256, left: 224, top: 227 }, 53, 12),
  26: frontAnimationSet(26, 768, { width: 320, height: 320, left: 218, top: 228 }, 32, 14, { victory: 95 }),
  27: frontAnimationSet(27, 768, { width: 256, height: 256, left: 256, top: 256 }, 29, 13),
  28: frontAnimationSet(28, 768, { width: 256, height: 256, left: 256, top: 255 }, 46, 21),
  29: frontAnimationSet(29, 768, { width: 320, height: 320, left: 233, top: 224 }, 45, 14),
  30: frontAnimationSet(30, 768, { width: 192, height: 192, left: 288, top: 288 }, 34, 15, { victory: 95, ko: 95 }),
  31: frontAnimationSet(31, 768, { width: 288, height: 288, left: 264, top: 240 }, 32, 11),
  32: frontAnimationSet(32, 768, { width: 256, height: 256, left: 256, top: 258 }, 30, 25),
  33: frontAnimationSet(33, 768, { width: 320, height: 320, left: 226, top: 227 }, 45, 14),
  34: frontAnimationSet(34, 704, { width: 256, height: 256, left: 223, top: 227 }, 49, 18),
  35: frontAnimationSet(35, 768, { width: 288, height: 288, left: 240, top: 239 }, 31, 7),
  36: frontAnimationSet(36, 768, { width: 256, height: 256, left: 257, top: 230 }, 50, 30),
  37: frontAnimationSet(37, 768, { width: 256, height: 256, left: 256, top: 241 }, 31, 23),
  38: frontAnimationSet(38, 768, { width: 256, height: 256, left: 256, top: 258 }, 45, 18),
  39: frontAnimationSet(39, 768, { width: 176, height: 176, left: 296, top: 296 }, 30, 13),
  40: frontAnimationSet(40, 768, { width: 256, height: 256, left: 256, top: 258 }, 40, 26),
  41: frontAnimationSet(41, 704, { width: 256, height: 256, left: 223, top: 223 }, 23, 13, { idle: 95, attack: 95 }),
  42: frontAnimationSet(42, 704, { width: 192, height: 192, left: 256, top: 253 }, 45, 11),
  43: frontAnimationSet(43, 704, { width: 256, height: 256, left: 274, top: 240 }, 41, 22),
  44: frontAnimationSet(44, 640, { width: 192, height: 192, left: 224, top: 222 }, 42, 17),
  45: frontAnimationSet(45, 704, { width: 256, height: 256, left: 224, top: 232 }, 29, 27),
  46: frontAnimationSet(46, 640, { width: 256, height: 256, left: 192, top: 192 }, 33, 14),
  47: frontAnimationSet(47, 768, { width: 256, height: 256, left: 263, top: 260 }, 36, 14, { hit: 95 }),
  48: frontAnimationSet(48, 704, { width: 256, height: 256, left: 235, top: 225 }, 36, 16),
  49: frontAnimationSet(49, 704, { width: 256, height: 256, left: 243, top: 248 }, 36, 12),
  50: frontAnimationSet(50, 512, { width: 256, height: 256, left: 160, top: 128 }, 30, 29),
  51: frontAnimationSet(51, 640, { width: 256, height: 256, left: 197, top: 195 }, 38, 14),
  52: frontAnimationSet(52, 768, { width: 176, height: 176, left: 291, top: 317 }, 21, 12, { attack: 95, ko: 95 }),
  53: frontAnimationSet(53, 512, { width: 176, height: 176, left: 168, top: 169 }, 44, 16),
  56: frontAnimationSet(56, 640, { width: 192, height: 192, left: 224, top: 225 }, 35, 22),
  57: frontAnimationSet(57, 768, { width: 256, height: 256, left: 256, top: 258 }, 36, 18),
  58: frontAnimationSet(58, 768, { width: 192, height: 192, left: 288, top: 289 }, 31, 13),
  59: frontAnimationSet(59, 640, { width: 192, height: 192, left: 223, top: 225 }, 37, 28),
  60: frontAnimationSet(60, 768, { width: 256, height: 256, left: 256, top: 255 }, 23, 25),
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

/** Runtime pages are derived from the authoritative native atlas, never a second animation spec. */
export function getArkamonRuntimeAsset(asset: ArkamonAnimationAsset): ArkamonAnimationAsset {
  const clip = getNativeRuntimeClip(asset.src)
  return clip && clip.frameWidth === asset.frameWidth && clip.frameHeight === asset.frameHeight
    && clip.frameCount === asset.frameCount && clip.fps === asset.fps
    ? { ...asset, pages: clip.pages } : asset
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
  if (exact) return { asset: getArkamonRuntimeAsset(exact), animation, isIdleFallback: false }

  const idle = getArkamonAnimationAsset(speciesId, side, 'idle')
  return idle ? { asset: getArkamonRuntimeAsset(idle), animation: 'idle', isIdleFallback: true } : undefined
}
