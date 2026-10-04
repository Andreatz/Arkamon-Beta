import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { getArkamonAnimationAsset } from '../arkamonAnimationManifest'

describe('Darklaw idle animation assets', () => {
  const asset = getArkamonAnimationAsset(5, 'front', 'idle')!
  const assetPath = resolve('public', asset.src.replace(/^\/+/, ''))
  const metadataPath = resolve('public/sprites/arkamon/5/front/idle.metadata.json')

  it('keeps the runtime frame grid consistent with the actual transparent sheet', async () => {
    const image = await sharp(assetPath).metadata()
    const conversion = JSON.parse(readFileSync(metadataPath, 'utf8'))
    expect(image.width).toBe(asset.frameWidth * asset.columns)
    expect(image.height).toBe(asset.frameHeight * asset.rows)
    expect(image.hasAlpha).toBe(true)
    expect(image.pages ?? 1).toBe(1)
    expect(conversion.sheet).toMatchObject({
      frameCount: asset.frameCount,
      fps: asset.fps,
      cellWidth: asset.frameWidth,
      cellHeight: asset.frameHeight,
      columns: asset.columns,
      rows: asset.rows,
    })
    expect(conversion.transform.fixedTransformAcrossFrames).toBe(true)
  })

  it('records the exact source video used to prepare the animation', () => {
    const conversion = JSON.parse(readFileSync(metadataPath, 'utf8'))
    const video = readFileSync(resolve(conversion.source.file))
    expect(createHash('sha256').update(video).digest('hex')).toBe(conversion.source.sha256)
    expect(conversion.sampling.sourceFrameIndices).toHaveLength(asset.frameCount)
  })

  it('removes the green background while preserving opaque dark fur and red eyes', async () => {
    const { data, info } = await sharp(assetPath)
      .extract({ left: 0, top: 0, width: asset.frameWidth, height: asset.frameHeight })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let transparent = 0, darkFur = 0, redEyes = 0, greenSpill = 0
    for (let i = 0; i < data.length; i += info.channels) {
      const [r, g, b, a] = data.subarray(i, i + 4)
      if (a === 0) transparent++
      if (a > 240 && r < 100 && g < 100 && b < 100) darkFur++
      if (a > 200 && r > g + 35 && r > b + 20) redEyes++
      if (a > 16 && g > Math.max(r, b) + 8) greenSpill++
    }
    expect(transparent).toBeGreaterThan(info.width * info.height * 0.25)
    expect(darkFur).toBeGreaterThan(1000)
    expect(redEyes).toBeGreaterThan(100)
    expect(greenSpill).toBe(0)
    expect(data[3]).toBe(0)
  })
})
