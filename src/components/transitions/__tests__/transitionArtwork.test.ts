import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

interface PoseProvenance {
  pose: string
  original: string
  runtime: string
  original_sha256: string
  runtime_sha256: string
}
const provenance = JSON.parse(readFileSync(join(process.cwd(), 'art-source/transitions/arkamon-d6/provenance.json'), 'utf8')) as { poses: PoseProvenance[] }

describe('Arkamon capture D6 artwork', () => {
  it('retains distinct open and closed poses with their unmodified generated originals', () => {
    expect(provenance.poses.map((pose) => pose.pose).sort()).toEqual(['closed', 'open'])
    expect(new Set(provenance.poses.map((pose) => pose.runtime_sha256)).size).toBe(2)
    for (const pose of provenance.poses) {
      for (const [path, expectedHash] of [[pose.original, pose.original_sha256], [pose.runtime, pose.runtime_sha256]]) {
        const bytes = readFileSync(join(process.cwd(), path))
        expect(createHash('sha256').update(bytes).digest('hex'), path).toBe(expectedHash)
      }
    }
  })

  it('decodes both runtime poses with a real alpha channel and transparent padding', async () => {
    for (const pose of provenance.poses) {
      const source = join(process.cwd(), pose.runtime)
      const metadata = await sharp(source).metadata()
      expect(metadata.format).toBe('webp')
      expect(metadata.hasAlpha).toBe(true)
      expect([metadata.width, metadata.height]).toEqual([1024, 1024])
      const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + info.channels - 1]
      expect([alpha(0, 0), alpha(1023, 0), alpha(0, 1023), alpha(1023, 1023)]).toEqual([0, 0, 0, 0])
      let solidPixels = 0
      for (let index = info.channels - 1; index < data.length; index += info.channels) {
        if (data[index] >= 240) solidPixels += 1
      }
      expect(solidPixels).toBeGreaterThan(100000)
    }
  })
})
