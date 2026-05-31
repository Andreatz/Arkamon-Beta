export type VfxPlaybackKind = 'sprite-sheet' | 'gif' | 'static-image'

export type VfxAnchor =
  | 'attacker'
  | 'target'
  | 'self'
  | 'center'
  | 'screen'

export type VfxLayer =
  | 'behind-pokemon'
  | 'over-pokemon'
  | 'front-ui'

export type VfxBlendMode =
  | 'normal'
  | 'screen'
  | 'lighten'
  | 'plus-lighter'

export interface SpriteSheetMeta {
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
}

export interface MoveVfxAsset {
  id: string
  label: string
  kind: VfxPlaybackKind
  src: string
  sprite?: SpriteSheetMeta
  durationMs: number
  impactAtMs?: number
  anchor: VfxAnchor
  layer: VfxLayer
  width: number
  height: number
  scale?: number
  offsetX?: number
  offsetY?: number
  mirrorForEnemy?: boolean
  rotateDegForEnemy?: number
  blendMode?: VfxBlendMode
  opacity?: number
  loop?: boolean
}
