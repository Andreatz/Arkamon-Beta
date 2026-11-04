/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Tiny generated build constant; the full game and asset catalogs stay out of assetUrl. */
  readonly VITE_LOCAL_FRONT_SPRITE_IDS: readonly number[]
}

declare module 'virtual:arkamon-runtime-pages' {
  type PackedNativePage = [fileToken: string, frameCount: number, columns: number]
  /** Comma-separated legacy tokens, or ! followed by eight-byte hashes in base64url. */
  type PackedNativeGrid = [capacity: number, columns: number, fileTokens: string]
  type PackedNativeClip = [frameWidth: number, frameHeight: number, frameCount: number, fps: number, pages: PackedNativePage[] | PackedNativeGrid]
  const clips: Record<string, PackedNativeClip | undefined>
  export default clips
}
