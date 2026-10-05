export interface ArkamonMotionProfile {
  idleLift: number
  idleTilt: number
  idleScale: number
  idleSeconds: number
  attackDistance: number
  attackLift: number
  attackTilt: number
  attackScale: number
  hitScale: number
  koTilt: number
  victoryLift: number
  victoryTilt: number
}

const DEFAULT_MOTION_PROFILE: ArkamonMotionProfile = {
  idleLift: 3,
  idleTilt: 0.35,
  idleScale: 1.012,
  idleSeconds: 2.6,
  attackDistance: 16,
  attackLift: 4,
  attackTilt: 2,
  attackScale: 1.04,
  hitScale: 0.95,
  koTilt: 7,
  victoryLift: 8,
  victoryTilt: 2,
}

/**
 * Procedural motion is deliberately species-aware for the first vertical slice.
 * These values only affect static PNG fallbacks. A real sprite-sheet animation
 * from arkamonAnimationManifest always takes precedence.
 */
export const ARKAMON_MOTION_PROFILES: Partial<Record<number, ArkamonMotionProfile>> = {
  // Vyrath: upright baby dragon — light, springy and expressive.
  1: {
    idleLift: 4,
    idleTilt: 0.55,
    idleScale: 1.018,
    idleSeconds: 2.35,
    attackDistance: 22,
    attackLift: 8,
    attackTilt: 3.2,
    attackScale: 1.055,
    hitScale: 0.93,
    koTilt: 10,
    victoryLift: 12,
    victoryTilt: 4,
  },

  // Wormaren: coiled earth serpent — heavier squash, roll and grounded impact.
  13: {
    idleLift: 2,
    idleTilt: 0.9,
    idleScale: 1.022,
    idleSeconds: 3.1,
    attackDistance: 14,
    attackLift: 3,
    attackTilt: 5,
    attackScale: 1.085,
    hitScale: 0.9,
    koTilt: 13,
    victoryLift: 6,
    victoryTilt: 6,
  },
}

export function getArkamonMotionProfile(speciesId: number): ArkamonMotionProfile {
  return ARKAMON_MOTION_PROFILES[speciesId] ?? DEFAULT_MOTION_PROFILE
}
