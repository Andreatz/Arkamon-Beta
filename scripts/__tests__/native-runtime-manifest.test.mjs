import { describe, expect, it } from 'vitest'
import { packNativeRuntimeManifest } from '../native-runtime-manifest.mjs'

const source = '/sprites/arkamon/79/front/victory.webp'
const directory = '/sprites/arkamon-paged/79/front/victory/'
function fixture(file) {
  return { schemaVersion: 1, clips: { [source]: { frameWidth: 512, frameHeight: 512, frameCount: 95, fps: 24,
    pages: [{ src: directory + file, firstFrame: 0, frameCount: 16, columns: 4, rows: 4, width: 2048, height: 2048, decodedBytes: 16777216 }] } } }
}

describe('native runtime manifest page filenames', () => {
  it.each(['page-00.webp', 'page-01.png', 'page-00-0123456789abcdef.webp', 'page-11-fedcba9876543210.png'])(
    'retains legacy and content fingerprint filenames without changing frame timing: %s', file => {
      expect(packNativeRuntimeManifest(fixture(file))[source]).toEqual([512, 512, 95, 24,
        [[file, 0, 16, 4, 4, 2048, 2048, 16777216]]])
    },
  )
  it.each(['../attack/page-00.webp', 'page-00-0123.webp', 'page-00-ABCDEF0123456789.webp', 'page-00.svg', '/page-00.webp'])(
    'rejects filenames outside the emitted native page contract: %s', file => {
      expect(() => packNativeRuntimeManifest(fixture(file))).toThrow('Native page belongs to another clip')
    },
  )
  it('rejects a page from a different animation directory even with a valid fingerprint', () => {
    const value = fixture('page-00-0123456789abcdef.webp')
    value.clips[source].pages[0].src = directory.replace('/victory/', '/attack/') + 'page-00-0123456789abcdef.webp'
    expect(() => packNativeRuntimeManifest(value)).toThrow('Native page belongs to another clip')
  })
})
