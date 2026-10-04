import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { getArkamonAnimationAsset, type ArkamonBattleAnimation } from '../arkamonAnimationManifest'

const ANIMATIONS: ArkamonBattleAnimation[] = ['idle', 'attack', 'hit', 'victory', 'ko']

function readConversion(animation: ArkamonBattleAnimation) {
  return JSON.parse(readFileSync(resolve(`public/sprites/arkamon/5/front/${animation}.metadata.json`), 'utf8'))
}

describe.each(ANIMATIONS)('Darklaw %s animation assets', (animation) => {
  const asset = getArkamonAnimationAsset(5, 'front', animation)!
  const assetPath = resolve('public', asset.src.replace(/^\/+/, ''))

  it('matches the runtime frame grid to the actual transparent static atlas', async () => {
    const image = await sharp(assetPath).metadata()
    const conversion = readConversion(animation)
    expect(image.width).toBe(asset.frameWidth * asset.columns)
    expect(image.height).toBe(asset.frameHeight * asset.rows)
    expect(image.hasAlpha).toBe(true)
    expect(image.pages ?? 1).toBe(1)
    expect(conversion.action).toBe(animation)
    expect(conversion.sheet).toMatchObject({
      frameCount: asset.frameCount, fps: asset.fps,
      cellWidth: asset.frameWidth, cellHeight: asset.frameHeight,
      columns: asset.columns, rows: asset.rows,
    })
    expect(conversion.transform.fixedTransformAcrossFrames).toBe(true)
    expect(conversion.transform.sharedTransform).toEqual(readConversion('idle').transform.sharedTransform)
    expect(conversion.transform.cameraCalibration.constantForEntireClip).toBe(true)
    const viewport = conversion.sheet.viewport
    expect(viewport).toEqual(asset.viewport)
    expect(viewport).toEqual(readConversion('idle').sheet.viewport)
    expect(viewport.width).toBeGreaterThan(0)
    expect(viewport.height).toBeGreaterThan(0)
    expect(viewport.left).toBeGreaterThanOrEqual(0)
    expect(viewport.top).toBeGreaterThanOrEqual(0)
    expect(viewport.left + viewport.width).toBeLessThanOrEqual(asset.frameWidth)
    expect(viewport.top + viewport.height).toBeLessThanOrEqual(asset.frameHeight)
  })

  it('preserves every original source frame in order at its native rate and full duration', () => {
    const conversion = readConversion(animation)
    const video = readFileSync(resolve(conversion.source.file))
    expect(createHash('sha256').update(video).digest('hex')).toBe(conversion.source.sha256)
    expect(conversion.source.decodedFrameCount).toBe(asset.frameCount)
    expect(conversion.source.fps).toBe(asset.fps)
    expect(conversion.sampling.allSourceFramesPreserved).toBe(true)
    expect(conversion.sampling.sourceFrameIndices).toEqual(Array.from({ length: asset.frameCount }, (_, index) => index))
    expect(conversion.sheet.durationSeconds).toBeCloseTo(asset.frameCount / asset.fps)
    expect(conversion.source.decodedFrameCount / conversion.source.fps).toBeCloseTo(conversion.sheet.durationSeconds)
    expect(asset.durationMs).toBeCloseTo(conversion.sheet.durationSeconds * 1000)
  })

  it('makes the opening frame transparent while retaining opaque fur and red details', async () => {
    const { data, info } = await sharp(assetPath)
      .extract({ left: 0, top: 0, width: asset.frameWidth, height: asset.frameHeight })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let transparent = 0, darkFur = 0, redDetails = 0, greenSpill = 0
    for (let i = 0; i < data.length; i += info.channels) {
      const [r, g, b, a] = data.subarray(i, i + 4)
      if (a === 0) transparent++
      if (a > 240 && r < 100 && g < 100 && b < 100) darkFur++
      if (a > 200 && r > g + 35 && r > b + 20) redDetails++
      if (a > 16 && g > Math.max(r, b) + 8) greenSpill++
    }
    expect(transparent).toBeGreaterThan(info.width * info.height * 0.25)
    expect(darkFur).toBeGreaterThan(1000)
    expect(redDetails).toBeGreaterThan(100)
    expect(greenSpill).toBe(0)
    expect(data[3]).toBe(0)
  })
})
