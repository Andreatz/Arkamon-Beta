import { useEffect, useRef } from 'react'
import { getMoveVfxAssignment } from './vfx/moveVfxAssignments'
import { playSfx } from '@/utils/soundManager'
import { moveSoundFor, panForSide } from '@/audio/moveSounds'
import type { MossaDef } from '@/types'
import { SpriteMoveVfx } from './vfx/SpriteMoveVfx'

export type MoveVfxSide = 'A' | 'B'
export type MoveVfxTarget = 'opponent' | 'self'

export interface MoveVfxEvent {
  id: number
  move: MossaDef
  attackerSpeciesId?: number
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
  const played = useRef(false)
  // Il suono non si tronca quando l'effetto visivo sparisce: la coda si spegne da sola.
  useEffect(() => { played.current = false }, [effect.id])
  function cue(point: 'start' | 'impact') {
    if (!soundEnabled || played.current) return
    // Elemento × potenza dell'assegnazione VFX; le mosse di stato hanno il loro suono.
    const assignment = getMoveVfxAssignment(effect.move)
    const sound = moveSoundFor(effect.move, assignment?.tier ?? 'medium', assignment?.type)
    if (sound.cue !== point) return
    played.current = true
    const hits = effect.target === 'self' ? effect.side : effect.side === 'A' ? 'B' : 'A'
    playSfx(sound.id, { rate: sound.rate, pan: panForSide(hits) })
  }
  return <SpriteMoveVfx effect={effect} {...callbacks}
    onStart={() => { cue('start'); callbacks.onStart?.() }}
    onImpact={() => { cue('impact'); callbacks.onImpact?.() }} />
}
