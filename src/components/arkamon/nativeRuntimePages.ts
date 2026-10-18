import packed from 'virtual:arkamon-runtime-pages'
import type { SpritePage } from '@/components/vfx/spritePages'

export interface NativeRuntimeClip {
  frameWidth: number
  frameHeight: number
  frameCount: number
  fps: number
  pages: readonly SpritePage[]
}
const clips = new Map<string, NativeRuntimeClip>()

/**
 * Lazy allocation, synchronous selection: a pending request can never select a
 * legacy full atlas. Each clip is expanded once from the small bundled index.
 */
export function getNativeRuntimeClip(source: string): NativeRuntimeClip | undefined {
  const cached = clips.get(source)
  if (cached) return cached
  const entry = packed[source]
  if (!entry) return undefined
  const [frameWidth, frameHeight, frameCount, fps, packedPages] = entry
  const directory = source.replace('/sprites/arkamon/', '/sprites/arkamon-paged/').replace(/\.webp$/, '/')
  const pages = packedPages.map(([file, firstFrame, count, columns, rows, width, height, decodedBytes]) => ({
    src: directory + file, firstFrame, frameCount: count, columns, rows, width, height, decodedBytes,
  }))
  const clip = { frameWidth, frameHeight, frameCount, fps, pages }
  clips.set(source, clip)
  return clip
}
