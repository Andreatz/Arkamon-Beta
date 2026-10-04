import type { MossaDef } from '@/types'
import { SpriteMoveVfx } from './vfx/SpriteMoveVfx'

export type MoveVfxSide = 'A' | 'B'
export type MoveVfxTarget = 'opponent' | 'self'

export interface MoveVfxEvent {
  id: number
  move: MossaDef
  side: MoveVfxSide
  target?: MoveVfxTarget
}

export const MOVE_VFX_VISIBLE_MS = 3400

export interface MoveVfxPlaybackCallbacks {
  onStart?: () => void
  onImpact?: () => void
  onComplete?: () => void
}

export function MoveVfx({ effect, ...callbacks }: { effect: MoveVfxEvent } & MoveVfxPlaybackCallbacks) {
  return <SpriteMoveVfx effect={effect} {...callbacks} />
}
