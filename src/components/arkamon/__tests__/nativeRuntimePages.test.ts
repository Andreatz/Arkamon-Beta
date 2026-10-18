import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import authoritative from '@/data/arkamon-paged.json'
import packed from 'virtual:arkamon-runtime-pages'
import { getNativeRuntimeClip } from '../nativeRuntimePages'
import { getArkamonRuntimeAsset, ARKAMON_ANIMATION_MANIFEST } from '../arkamonAnimationManifest'

describe('compact native runtime metadata', () => {
  it('preserves every page path and source-frame geometry for all clips without shipping provenance hashes', () => {
    expect(Object.keys(packed)).toEqual(Object.keys(authoritative.clips))
    for (const [source, original] of Object.entries(authoritative.clips)) {
      const runtime = getNativeRuntimeClip(source)!
      expect(runtime).toEqual({ frameWidth: original.frameWidth, frameHeight: original.frameHeight, frameCount: original.frameCount, fps: original.fps,
        pages: original.pages.map(({ src, firstFrame, frameCount, columns, rows, width, height, decodedBytes }) => ({ src, firstFrame, frameCount, columns, rows, width, height, decodedBytes })),
      })
      expect(getNativeRuntimeClip(source)).toBe(runtime)
    }
    const serialized = JSON.stringify(packed)
    expect(serialized).not.toMatch(/sha256|sourceRgba|decodedRgba|encodedBytes|viewport/i)
    expect(gzipSync(serialized).byteLength).toBeLessThan(gzipSync(JSON.stringify(authoritative)).byteLength * .02)
  })

  it('synchronously supplies pages on the first lookup, including all original cues and irregular frame counts', () => {
    for (const set of Object.values(ARKAMON_ANIMATION_MANIFEST)) for (const source of Object.values(set!.front!)) {
      const runtime = getArkamonRuntimeAsset(source!)
      expect(runtime.pages?.length).toBeGreaterThan(0)
      const { pages: _, ...contract } = runtime
      expect(contract).toEqual(source)
    }
    expect(getNativeRuntimeClip('/sprites/arkamon/110/front/idle.webp')).toBeUndefined()
  })
})
