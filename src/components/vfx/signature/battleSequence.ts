import type { MossaDef } from '@/types'
import { getAdminMoveVfxOverride } from '@/store/vfxAdminStore'
import { resolveMoveVfxTravel } from '../moveVfxProfiles'
import { getMoveVfxImpactDelayMs } from '../resolveMoveVfxAsset'
import { moveSequence } from './sequence'

export function battleSequence(move: MossaDef, formId?: number) {
  if (!formId || getAdminMoveVfxOverride(move.id)) return undefined
  return moveSequence(move, formId, resolveMoveVfxTravel(move))
}

export function battleImpactDelay(move: MossaDef, formId: number) {
  return battleSequence(move, formId)?.impact ?? getMoveVfxImpactDelayMs(move)
}
