import { useEffect, useRef } from 'react'
import selections from '@/data/audio-selections.json'
import { getMoveVfxAssignment } from './vfx/moveVfxAssignments'
import { playSelectedAudio } from '@/utils/soundManager'
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

export function MoveVfx({ effect, soundEnabled = false, ...callbacks }: { effect: MoveVfxEvent; soundEnabled?: boolean } & MoveVfxPlaybackCallbacks) {
  const stopAudio = useRef<(() => void) | null>(null)
  const played = useRef(false)
  useEffect(() => { played.current = false; return () => { stopAudio.current?.() } }, [effect.id])
  function cue(point: 'start' | 'impact') {
    const assignment = getMoveVfxAssignment(effect.move)
    const key = assignment ? `move:${assignment.sourceMoveId}` : ''
    const choice = (selections.choices as Record<string, { cue: string }>)[key]
    if (soundEnabled && !played.current && choice?.cue === point) { played.current = true; stopAudio.current = playSelectedAudio(key) }
  }
  return <SpriteMoveVfx effect={effect} {...callbacks}
    onStart={() => { cue('start'); callbacks.onStart?.() }}
    onImpact={() => { cue('impact'); callbacks.onImpact?.() }} />
}
