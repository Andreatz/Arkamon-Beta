import type {
  ArkamonBattleAnimation,
  ArkamonSpriteSide,
} from './arkamonAnimationManifest'

export interface ArkamonRigPoint {
  x: number
  y: number
}

export interface ArkamonRigMotion {
  rotate?: number[]
  x?: number[]
  y?: number[]
  scale?: number[]
  scaleX?: number[]
  scaleY?: number[]
  opacity?: number[]
  durationMs: number
  delayMs?: number
  repeatDelayMs?: number
  loop?: boolean
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export interface ArkamonRigPart {
  id: string
  polygon: ArkamonRigPoint[]
  pivot: ArkamonRigPoint
  zIndex?: number
  /**
   * When true, the part is removed from the base image before its articulated
   * copy is drawn. This avoids a static "ghost" beneath moving tails/wings.
   */
  cutout?: boolean
  ambient?: ArkamonRigMotion
  states?: Partial<Record<ArkamonBattleAnimation, ArkamonRigMotion>>
}

export interface ArkamonRigBlinkZone {
  cx: number
  cy: number
  rx: number
  ry: number
  fill: string
}

export interface ArkamonRigBlink {
  zones: ArkamonRigBlinkZone[]
  cycleMs: number
}

export interface ArkamonSpriteRig {
  speciesId: number
  side: ArkamonSpriteSide
  src: string
  canvas: {
    width: number
    height: number
  }
  parts: ArkamonRigPart[]
  blink?: ArkamonRigBlink
}

export type ArkamonRigSet = Partial<Record<ArkamonSpriteSide, ArkamonSpriteRig>>

/**
 * First single-source rig vertical slice.
 *
 * A rig reuses the existing battle PNG and articulates selected regions by
 * clipping them into independent layers. This lets us prototype tails, ears,
 * wings and similar appendages without requiring a full sprite sheet.
 *
 * Species #5 is Darklaw.
 */
export const ARKAMON_RIG_MANIFEST: Partial<Record<number, ArkamonRigSet>> = {
  5: {
    front: {
      speciesId: 5,
      side: 'front',
      src: '/sprites/front_sprites/5.png',
      canvas: { width: 750, height: 1000 },
      parts: [
        {
          id: 'tail',
          polygon: [
            { x: 455, y: 760 },
            { x: 500, y: 700 },
            { x: 535, y: 620 },
            { x: 595, y: 575 },
            { x: 660, y: 590 },
            { x: 695, y: 665 },
            { x: 680, y: 760 },
            { x: 640, y: 845 },
            { x: 565, y: 925 },
            { x: 485, y: 930 },
            { x: 450, y: 870 },
          ],
          pivot: { x: 478, y: 835 },
          zIndex: 1,
          cutout: true,
          ambient: {
            rotate: [-2.5, 3.5, -2.5],
            y: [0, -2, 0],
            durationMs: 3400,
            loop: true,
            ease: 'easeInOut',
          },
          states: {
            physical: {
              rotate: [0, -8, 12, 0],
              durationMs: 430,
              ease: 'easeInOut',
            },
            special: {
              rotate: [0, 6, -4, 0],
              durationMs: 720,
              ease: 'easeInOut',
            },
            hit: {
              rotate: [0, 10, -6, 0],
              durationMs: 260,
              ease: 'easeOut',
            },
            ko: {
              rotate: [0, -12],
              y: [0, 8],
              durationMs: 420,
              ease: 'easeOut',
            },
            victory: {
              rotate: [-3, 8, -5, 7, -3],
              durationMs: 1000,
              loop: true,
              repeatDelayMs: 140,
              ease: 'easeInOut',
            },
          },
        },
        {
          id: 'left-head-tuft',
          polygon: [
            { x: 95, y: 300 },
            { x: 145, y: 195 },
            { x: 245, y: 225 },
            { x: 275, y: 370 },
            { x: 225, y: 455 },
            { x: 135, y: 430 },
          ],
          pivot: { x: 220, y: 405 },
          zIndex: 3,
          ambient: {
            rotate: [0, -1.2, 0, 0.8, 0],
            durationMs: 3900,
            loop: true,
            ease: 'easeInOut',
          },
          states: {
            hit: {
              rotate: [0, -5, 3, 0],
              durationMs: 250,
              ease: 'easeOut',
            },
            special: {
              rotate: [0, -3, 1, 0],
              durationMs: 680,
              ease: 'easeInOut',
            },
          },
        },
        {
          id: 'right-head-tuft',
          polygon: [
            { x: 430, y: 255 },
            { x: 555, y: 175 },
            { x: 675, y: 225 },
            { x: 645, y: 415 },
            { x: 550, y: 500 },
            { x: 465, y: 420 },
          ],
          pivot: { x: 500, y: 420 },
          zIndex: 3,
          ambient: {
            rotate: [0, 1, 0, -0.8, 0],
            durationMs: 4100,
            loop: true,
            ease: 'easeInOut',
          },
          states: {
            hit: {
              rotate: [0, 5, -3, 0],
              durationMs: 250,
              ease: 'easeOut',
            },
            special: {
              rotate: [0, 3, -1, 0],
              durationMs: 680,
              ease: 'easeInOut',
            },
          },
        },
      ],
      blink: {
        cycleMs: 4400,
        zones: [
          { cx: 210, cy: 444, rx: 47, ry: 58, fill: '#3d343e' },
          { cx: 475, cy: 444, rx: 50, ry: 60, fill: '#3d343e' },
        ],
      },
    },
    back: {
      speciesId: 5,
      side: 'back',
      src: '/sprites/back_sprites/5.png',
      canvas: { width: 750, height: 1000 },
      parts: [
        {
          id: 'tail',
          polygon: [
            { x: 38, y: 610 },
            { x: 100, y: 570 },
            { x: 185, y: 585 },
            { x: 250, y: 650 },
            { x: 290, y: 735 },
            { x: 340, y: 815 },
            { x: 315, y: 900 },
            { x: 220, y: 960 },
            { x: 105, y: 935 },
            { x: 48, y: 850 },
          ],
          pivot: { x: 330, y: 820 },
          zIndex: 1,
          cutout: true,
          ambient: {
            rotate: [2.5, -3.5, 2.5],
            y: [0, -2, 0],
            durationMs: 3400,
            loop: true,
            ease: 'easeInOut',
          },
          states: {
            physical: {
              rotate: [0, 8, -12, 0],
              durationMs: 430,
              ease: 'easeInOut',
            },
            special: {
              rotate: [0, -6, 4, 0],
              durationMs: 720,
              ease: 'easeInOut',
            },
            hit: {
              rotate: [0, -10, 6, 0],
              durationMs: 260,
              ease: 'easeOut',
            },
            ko: {
              rotate: [0, 12],
              y: [0, 8],
              durationMs: 420,
              ease: 'easeOut',
            },
            victory: {
              rotate: [3, -8, 5, -7, 3],
              durationMs: 1000,
              loop: true,
              repeatDelayMs: 140,
              ease: 'easeInOut',
            },
          },
        },
      ],
    },
  },
}

export function getArkamonRig(
  speciesId: number,
  side: ArkamonSpriteSide
): ArkamonSpriteRig | undefined {
  return ARKAMON_RIG_MANIFEST[speciesId]?.[side]
}
