import { describe, expect, it } from 'vitest'
import {
  ARKAMON_MOTION_PROFILES,
  getArkamonMotionProfile,
} from '../arkamonMotionProfiles'

describe('Arkamon procedural battle motion profiles', () => {
  it('defines distinct vertical-slice profiles for Vyrath and Wormaren', () => {
    const vyrath = getArkamonMotionProfile(1)
    const wormaren = getArkamonMotionProfile(13)

    expect(ARKAMON_MOTION_PROFILES[1]).toBeTruthy()
    expect(ARKAMON_MOTION_PROFILES[13]).toBeTruthy()
    expect(vyrath.attackDistance).toBeGreaterThan(wormaren.attackDistance)
    expect(wormaren.attackScale).toBeGreaterThan(vyrath.attackScale)
  })

  it('provides a safe default profile to every other species', () => {
    const fallback = getArkamonMotionProfile(9999)

    expect(fallback.idleSeconds).toBeGreaterThan(0)
    expect(fallback.attackDistance).toBeGreaterThan(0)
  })
})
