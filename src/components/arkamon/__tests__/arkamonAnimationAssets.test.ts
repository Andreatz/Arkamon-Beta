import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { getArkamonAnimationAsset, type ArkamonBattleAnimation } from '../arkamonAnimationManifest'

const SPECIES_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 20, 21]
const ANIMATIONS: ArkamonBattleAnimation[] = ['idle', 'attack', 'hit', 'victory', 'ko']

const conversionCache = new Map<string, ReturnType<typeof JSON.parse>>()

function readConversion(speciesId: number, animation: ArkamonBattleAnimation) {
  const path = resolve(`public/sprites/arkamon/${speciesId}/front/${animation}.metadata.json`)
  if (!conversionCache.has(path)) conversionCache.set(path, JSON.parse(readFileSync(path, 'utf8')))
  return conversionCache.get(path)!
}

describe.each(SPECIES_IDS.flatMap((speciesId) => ANIMATIONS.map((animation) => ({ speciesId, animation }))))(
  'species $speciesId $animation assets', ({ speciesId, animation }) => {
  const asset = getArkamonAnimationAsset(speciesId, 'front', animation)!
  const assetPath = resolve('public', asset.src.replace(/^\/+/, ''))

  it('matches the runtime frame grid to the actual transparent static atlas', async () => {
    const image = await sharp(assetPath).metadata()
    const conversion = readConversion(speciesId, animation)
    const sheet = readFileSync(assetPath)
    expect(sheet.byteLength).toBeGreaterThan(0)
    expect(createHash('sha256').update(sheet).digest('hex')).toBe(conversion.sheet.sha256)
    expect(sheet.byteLength).toBe(conversion.sheet.sizeBytes)
    expect(image.width).toBe(asset.frameWidth * asset.columns)
    expect(image.height).toBe(asset.frameHeight * asset.rows)
    expect(image.hasAlpha).toBe(true)
    expect(image.pages ?? 1).toBe(1)
    const posterPath = resolve(`public/sprites/arkamon/${speciesId}/front/${conversion.poster.file}`)
    const poster = readFileSync(posterPath)
    const posterImage = await sharp(posterPath).metadata()
    expect(conversion.poster.frameIndex).toBe(0)
    expect(poster.byteLength).toBeGreaterThan(0)
    expect(poster.byteLength).toBe(conversion.poster.sizeBytes)
    expect(createHash('sha256').update(poster).digest('hex')).toBe(conversion.poster.sha256)
    expect(posterImage.width).toBe(asset.frameWidth)
    expect(posterImage.height).toBe(asset.frameHeight)
    expect(posterImage.hasAlpha).toBe(true)
    expect(conversion.speciesId).toBe(speciesId)
    expect(conversion.view).toBe('front')
    expect(conversion.action).toBe(animation)
    if (animation === 'attack') {
      expect(conversion.timing.releaseFrame).toBe(asset.releaseFrame)
      expect(conversion.timing.releaseMs).toBeCloseTo(asset.releaseFrame! / asset.fps * 1000)
    } else if (animation === 'hit') {
      expect(conversion.timing.reactionFrame).toBe(asset.reactionFrame)
      expect(conversion.timing.reactionMs).toBeCloseTo(asset.reactionFrame! / asset.fps * 1000)
    }
    expect(conversion.sheet).toMatchObject({
      frameCount: asset.frameCount, fps: asset.fps,
      cellWidth: asset.frameWidth, cellHeight: asset.frameHeight,
      columns: asset.columns, rows: asset.rows,
    })
    expect(conversion.transform.fixedTransformAcrossFrames).toBe(true)
    expect(conversion.transform.sharedTransform).toEqual(readConversion(speciesId, 'idle').transform.sharedTransform)
    expect(conversion.transform.cameraCalibration.constantForEntireClip).toBe(true)
    expect(conversion.transform.sourceFrameAlphaBounds).toHaveLength(asset.frameCount)
    expect(conversion.transform.outputFrameAlphaBounds).toHaveLength(asset.frameCount)
    for (const bounds of conversion.transform.outputFrameAlphaBounds) {
      // A source KO may deliberately end with a fully transparent frame.
      if (bounds === null) continue
      const [left, top, right, bottom] = bounds
      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(right).toBeLessThanOrEqual(asset.frameWidth)
      expect(bottom).toBeLessThanOrEqual(asset.frameHeight)
      expect(right).toBeGreaterThanOrEqual(left)
      expect(bottom).toBeGreaterThanOrEqual(top)
    }
    const viewport = conversion.sheet.viewport
    expect(viewport).toEqual(asset.viewport)
    expect(viewport).toEqual(readConversion(speciesId, 'idle').sheet.viewport)
    expect(viewport.width).toBeGreaterThan(0)
    expect(viewport.height).toBeGreaterThan(0)
    expect(viewport.left).toBeGreaterThanOrEqual(0)
    expect(viewport.top).toBeGreaterThanOrEqual(0)
    expect(viewport.left + viewport.width).toBeLessThanOrEqual(asset.frameWidth)
    expect(viewport.top + viewport.height).toBeLessThanOrEqual(asset.frameHeight)
  })

  it('preserves every original source frame in order at its native rate and full duration', () => {
    const conversion = readConversion(speciesId, animation)
    expect(conversion.source.file).toBe(`animation-source/raw/${speciesId}/front/${animation}.mp4`)
    const video = readFileSync(resolve(conversion.source.file))
    const suppliedVideo = readFileSync(resolve(`public/sprites/animation/Front/${speciesId} ${animation}.mp4`))
    expect(video.byteLength).toBeGreaterThan(0)
    expect(suppliedVideo.byteLength).toBeGreaterThan(0)
    expect(video.equals(suppliedVideo)).toBe(true)
    expect(createHash('sha256').update(video).digest('hex')).toBe(conversion.source.sha256)
    expect(createHash('sha256').update(suppliedVideo).digest('hex')).toBe(conversion.source.sha256)
    expect(video.byteLength).toBe(conversion.source.sizeBytes)
    expect(suppliedVideo.byteLength).toBe(conversion.source.sizeBytes)
    expect(conversion.source.decodedFrameCount).toBe(asset.frameCount)
    expect(conversion.source.fps).toBe(asset.fps)
    expect(conversion.sampling.allSourceFramesPreserved).toBe(true)
    expect(conversion.sampling.sourceFrameIndices).toEqual(Array.from({ length: asset.frameCount }, (_, index) => index))
    expect(conversion.sheet.durationSeconds).toBeCloseTo(asset.frameCount / asset.fps)
    expect(conversion.source.decodedFrameCount / conversion.source.fps).toBeCloseTo(conversion.sheet.durationSeconds)
    expect(asset.durationMs).toBeCloseTo(conversion.sheet.durationSeconds * 1000)
  })

  it('makes the opening frame transparent while retaining the original opaque artwork', async () => {
    const { data, info } = await sharp(assetPath)
      .extract({ left: 0, top: 0, width: asset.frameWidth, height: asset.frameHeight })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let transparent = 0, opaqueArtwork = 0, darkFur = 0, redDetails = 0, greenSpill = 0
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
      if (a === 0) transparent++
      if (a > 240) opaqueArtwork++
      if (a > 240 && r < 100 && g < 100 && b < 100) darkFur++
      if (a > 200 && r > g + 35 && r > b + 20) redDetails++
      if (a > 16 && g > Math.max(r, b) + 8) greenSpill++
    }
    expect(transparent).toBeGreaterThan(info.width * info.height * 0.25)
    expect(opaqueArtwork).toBeGreaterThan(1000)
    if (speciesId === 5) {
      expect(darkFur).toBeGreaterThan(1000)
      expect(redDetails).toBeGreaterThan(100)
    }
    expect(greenSpill).toBe(0)
    expect(data[3]).toBe(0)
    // A 7680-pixel lossless atlas decodes about 236 MB before cropping the cell.
  }, 15_000)
})
