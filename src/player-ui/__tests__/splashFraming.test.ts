import { describe, expect, it } from 'vitest'
import { fitSplashFrame, type SplashFrameBounds, type SplashFrameInput, type SplashFrameResult } from '../reference/splashFraming'

const fixture = (): SplashFrameInput => ({
  canvas: { width: 1600, height: 1000 }, image: { width: 1920, height: 1080 },
  focus: { left: .4, top: .3, right: .6, bottom: .7 },
  available: { left: 550, top: 200, right: 1100, bottom: 800 },
  preferredScale: 1.5, preferredOffset: { x: .02, y: -.01 },
})

function expectInside(result: SplashFrameResult | null, bounds: SplashFrameBounds) {
  expect(result).not.toBeNull()
  expect(result!.focus.left).toBeGreaterThanOrEqual(bounds.left - 1e-7)
  expect(result!.focus.top).toBeGreaterThanOrEqual(bounds.top - 1e-7)
  expect(result!.focus.right).toBeLessThanOrEqual(bounds.right + 1e-7)
  expect(result!.focus.bottom).toBeLessThanOrEqual(bounds.bottom + 1e-7)
}

describe('Splash framing against the actual available UI region', () => {
  it('preserves an authored framing on a 16:10 canvas, including contain letterboxing', () => {
    const input = fixture(), result = fitSplashFrame(input)!
    expectInside(result, input.available)
    expect(result.scale).toBe(1.5)
    expect(result.translateX).toBe(32)
    expect(result.translateY).toBe(-10)
    expect(result.focus).toEqual({ left: 592, top: 220, right: 1072, bottom: 760 })
  })

  it('includes the horizontal letterbox offset in a wide gallery iframe', () => {
    const input = fixture()
    Object.assign(input, { canvas: { width: 1600, height: 700 }, preferredScale: 1, preferredOffset: { x: 0, y: 0 }, available: { left: 600, top: 150, right: 1000, bottom: 550 } })
    const result = fitSplashFrame(input)!
    expectInside(result, input.available)
    expect(result.scale).toBe(1)
    expect(result.translateX).toBe(0)
    expect(result.translateY).toBe(0)
    expect(result.focus.left).toBeCloseTo(675.5555556)
    expect(result.focus.top).toBeCloseTo(210)
    expect(result.focus.right).toBeCloseTo(924.4444444)
    expect(result.focus.bottom).toBeCloseTo(490)
  })

  it('repositions an oversized translation without unnecessarily shrinking the figure', () => {
    const input = fixture()
    Object.assign(input, { preferredOffset: { x: -.3, y: -.3 } })
    const result = fitSplashFrame(input)!
    expectInside(result, input.available)
    expect(result.scale).toBe(input.preferredScale)
    expect(result.focus.left).toBeCloseTo(input.available.left)
    expect(result.focus.top).toBeCloseTo(input.available.top)
  })

  it('reduces only the required dimension when panels make the central gap narrower', () => {
    const input = fixture()
    Object.assign(input, { available: { left: 650, top: 100, right: 950, bottom: 850 } })
    const result = fitSplashFrame(input)!
    expectInside(result, input.available)
    expect(result.scale).toBeCloseTo(300 / 320)
    expect(result.focus.right - result.focus.left).toBeCloseTo(300)
    expect(result.focus.bottom - result.focus.top).toBeCloseTo(337.5)
  })

  it('can scale below one for a portrait-width panel gap without distorting the image', () => {
    const input = fixture()
    Object.assign(input, { canvas: { width: 500, height: 900 }, available: { left: 200, top: 350, right: 260, bottom: 490 } })
    const result = fitSplashFrame(input)!
    expectInside(result, input.available)
    expect(result.scale).toBeCloseTo(.6)
    expect(result.focus.right - result.focus.left).toBeCloseTo(60)
    expect(result.focus.bottom - result.focus.top).toBeCloseTo(67.5)
  })

  it('responds to a shorter iframe instead of reusing the previous fullscreen framing', () => {
    const input = fixture(), fullscreen = fitSplashFrame(input)!
    const shorter: SplashFrameInput = { ...input, canvas: { width: 1600, height: 600 }, available: { left: 550, top: 160, right: 1100, bottom: 450 } }
    const gallery = fitSplashFrame(shorter)!
    expectInside(fullscreen, input.available)
    expectInside(gallery, shorter.available)
    expect(gallery.scale).toBeCloseTo(290 / 240)
    expect(gallery.scale).toBeLessThan(fullscreen.scale)
    expect(gallery.translateY).not.toBe(fullscreen.translateY)
  })

  it('does not enlarge an already small authored scale to fill the available gap', () => {
    const input = fixture()
    Object.assign(input, { preferredScale: .4 })
    const result = fitSplashFrame(input)!
    expectInside(result, input.available)
    expect(result.scale).toBe(.4)
    expect(result.translateX).toBe(32)
    expect(result.translateY).toBe(-10)
  })

  it.each([
    { canvas: { width: 0, height: 900 } },
    { image: { width: 1920, height: Number.NaN } },
    { preferredScale: 0 },
    { preferredScale: Number.POSITIVE_INFINITY },
    { preferredOffset: { x: Number.NaN, y: 0 } },
    { focus: { left: .5, top: .3, right: .4, bottom: .7 } },
    { focus: { left: -.1, top: .3, right: .6, bottom: .7 } },
    { available: { left: 600, top: 100, right: 600, bottom: 800 } },
    { available: { left: 500, top: 100, right: 1700, bottom: 800 } },
  ])('returns null for invalid geometry rather than generating an invalid transform: %j', override => {
    expect(fitSplashFrame({ ...fixture(), ...override })).toBeNull()
  })
})
