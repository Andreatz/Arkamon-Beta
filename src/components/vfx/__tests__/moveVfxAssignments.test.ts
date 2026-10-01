import { afterEach, describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import { useVfxAdminStore } from '@store/vfxAdminStore'
import { MOVE_VFX_ASSETS } from '../vfxManifest'
import { MOVE_VFX_ASSIGNMENTS, MOVE_VFX_ASSIGNMENT_COUNTS, VFX_MOVE_PREVIEWS, getMoveVfxAssignment } from '../moveVfxAssignments'
import { resolveMoveVfxAsset, resolveMoveVfxRecipe } from '../resolveMoveVfxAsset'
import { resolveMoveVfxProfile } from '../moveVfxProfiles'

describe('individual moveset VFX assignments', () => {
  afterEach(() => useVfxAdminStore.getState().resetOverrides())

  it('covers all 276 source IDs with 142 distinct assets and 134 explicit gaps', () => {
    expect(MOVE_VFX_ASSIGNMENTS.map((entry) => entry.sourceMoveId)).toEqual(Array.from({ length: 276 }, (_, i) => i + 1))
    expect(MOVE_VFX_ASSIGNMENT_COUNTS).toEqual({ total: 276, assigned: 142, missing: 134, needsAdaptation: 16 })
    const assigned = MOVE_VFX_ASSIGNMENTS.filter((entry) => entry.assetId)
    const ids = assigned.map((entry) => entry.assetId!)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(Object.keys(MOVE_VFX_ASSETS).sort())
    expect(new Set(VFX_MOVE_PREVIEWS.map((move) => move.id)).size).toBe(276)
  })

  it('resolves every reserved asset exactly once without a composite recipe or manifest mutation', () => {
    for (const move of VFX_MOVE_PREVIEWS) {
      const entry = getMoveVfxAssignment(move)!
      expect(entry).toBeDefined()
      if (!entry.assetId) {
        expect(entry.review).toBe('missing')
        continue
      }
      const original = structuredClone(MOVE_VFX_ASSETS[entry.assetId])
      expect(resolveMoveVfxAsset(move)).toMatchObject({ id: entry.assetId, anchor: entry.anchor, scale: entry.scale })
      expect(resolveMoveVfxRecipe(move)).toBeUndefined()
      expect(MOVE_VFX_ASSETS[entry.assetId]).toEqual(original)
    }
  })

  it('reconciles the four swapped IDs by name while preserving the existing combat catalog', () => {
    for (const [sourceId, gameId] of [[107, 109], [108, 110], [109, 107], [110, 108]]) {
      const entry = MOVE_VFX_ASSIGNMENTS.find((item) => item.sourceMoveId === sourceId)!
      expect(entry.gameMoveId).toBe(gameId)
      const move = MOSSE.find((item) => item.id === gameId)!
      expect(getMoveVfxAssignment(move)).toBe(entry)
      if (entry.assetId) expect(resolveMoveVfxAsset(move).id).toBe(entry.assetId)
    }
    expect(MOSSE).toHaveLength(220)
    expect(getMoveVfxAssignment({ id: 107, nome: 'Sguardo glaciale' })).toBeUndefined()
  })

  it('uses the worksheet colors, including light Voltaggio and medium Alta tensione/Colpo felpato', () => {
    for (const move of VFX_MOVE_PREVIEWS) {
      const entry = getMoveVfxAssignment(move)!
      expect(resolveMoveVfxProfile(move).intensity).toBe(entry.tier === 'status' ? 'subtle' : entry.tier)
    }
    for (const [id, tier] of [[5, 'light'], [6, 'medium'], [29, 'medium'], [130, 'light']] as const) {
      expect(resolveMoveVfxProfile(MOSSE.find((move) => move.id === id)!).intensity).toBe(tier)
    }
  })

  it('includes Stasi Elettrica for Felvex Oscurità as a paralysis preview without inventing gameplay', () => {
    const move = VFX_MOVE_PREVIEWS.find((item) => item.id === 256)!
    const entry = getMoveVfxAssignment(move)!
    expect(entry).toMatchObject({ name: 'Stasi Elettrica', type: 'Status (Paralisi)', tier: 'status', gameMoveId: null, arkamon: [{ id: 44, name: 'Felvex' }] })
    expect(move.tipo).toBe('Oscurità')
    expect(move.dadiPerLivello).toEqual({})
    expect(MOSSE.some((item) => item.id === 256)).toBe(false)
    expect(resolveMoveVfxProfile(move).feedback.targetShakePx).toBe(0)
  })

  it('keeps the two Boro Breath and two Comando draconico IDs distinct', () => {
    for (const name of ['Boro Breath', 'Comando draconico']) {
      const entries = MOVE_VFX_ASSIGNMENTS.filter((item) => item.name === name)
      expect(entries).toHaveLength(2)
      expect(entries[0].sourceMoveId).not.toBe(entries[1].sourceMoveId)
    }
  })
})
