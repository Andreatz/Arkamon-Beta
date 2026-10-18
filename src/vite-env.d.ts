/// <reference types="vite/client" />

declare module 'virtual:arkamon-runtime-pages' {
  type PackedNativePage = [file: string, firstFrame: number, frameCount: number, columns: number, rows: number, width: number, height: number, decodedBytes: number]
  type PackedNativeClip = [frameWidth: number, frameHeight: number, frameCount: number, fps: number, pages: PackedNativePage[]]
  const clips: Record<string, PackedNativeClip | undefined>
  export default clips
}
