export interface ArkamonMotionProfile {
  idleLift: number
  idleTilt: number
  idleScale: number
  idleSeconds: number
  physicalDistance: number
  physicalLift: number
  physicalTilt: number
  physicalScale: number
  specialLift: number
  specialTilt: number
  specialScale: number
  specialGlow: string
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
  physicalDistance: 16,
  physicalLift: 4,
  physicalTilt: 2,
  physicalScale: 1.04,
  specialLift: 4,
  specialTilt: 1.2,
  specialScale: 1.055,
  specialGlow: 'rgba(203, 213, 225, 0.82)',
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
    physicalDistance: 22,
    physicalLift: 8,
    physicalTilt: 3.2,
    physicalScale: 1.055,
    specialLift: 7,
    specialTilt: 2.2,
    specialScale: 1.075,
    specialGlow: 'rgba(191, 219, 254, 0.95)',
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
    physicalDistance: 14,
    physicalLift: 3,
    physicalTilt: 5,
    physicalScale: 1.085,
    specialLift: 3,
    specialTilt: 4.5,
    specialScale: 1.095,
    specialGlow: 'rgba(217, 164, 88, 0.95)',
    hitScale: 0.9,
    koTilt: 13,
    victoryLift: 6,
    victoryTilt: 6,
  },
}

export function getArkamonMotionProfile(speciesId: number): ArkamonMotionProfile {
  return ARKAMON_MOTION_PROFILES[speciesId] ?? DEFAULT_MOTION_PROFILE
}
