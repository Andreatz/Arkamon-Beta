import { afterEach, describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import { useVfxAdminStore } from '@store/vfxAdminStore'
import { MOVE_VFX_ASSETS } from '../vfxManifest'
import { MOVE_VFX_BY_MOVE_ID } from '../moveVfxOverrides'
import { resolveMoveVfxProfile, resolveProfileAssetId } from '../moveVfxProfiles'
import { VFX_CURATION, getCuratedBattleAssetId, getVfxCurationPreviewAsset } from '../vfxCuration'
import {
  getMoveVfxDurationMs,
  getMoveVfxImpactDelayMs,
  resolveMoveVfxAsset,
  resolveMoveVfxRecipe,
} from '../resolveMoveVfxAsset'

const byId = (id: number) => MOSSE.find((move) => move.id === id)!

const cases = [
  [118, 'psychic', 'light', 'generated:anglercompany-img_finalboss_minitail_hit-images_flat_sheet', 'target', 1.25],
  [119, 'psychic', 'medium', 'generated:hekatoneff_1001-img_explosion-images_nested_sheet', 'target', 1.25],
  [44, 'psychic', 'heavy', 'generated:anglercompany-img_ladderpuzzle_shock-images_nested_sheet', 'center', 1.5],
  [38, 'electric', 'light', 'generated:anglercompany-img_subboss_chargedcannon_blue_hit-images_nested_sheet', 'target', 1.25],
  [5, 'electric', 'medium', 'generated:direction-img_effect_skill_spark_0-images_nested_sheet', 'target', 1.5],
  [6, 'electric', 'heavy', 'generated:highmountain-img_effect_tynus_lightning_2-images_nested_sheet', 'target', 1.5],
  [70, 'slash', 'light', 'generated:direction1-img_effect_skill_overswingdouble_0-images_nested_sheet', 'target', 1],
  [130, 'slash', 'medium', 'gif:27c650209255d638948a6215ffea9c78', 'target', 1.25],
  [29, 'blunt', 'light', 'generated:basiceff-img_tjrjump-images_nested_sheet', 'target', 1],
  [129, 'blunt', 'medium', 'generated:lynn-img_skill_hithard_hit-images_nested_sheet', 'target', 1],
] as const

describe('confirmed VFX in battle', () => {
  afterEach(() => useVfxAdminStore.getState().resetOverrides())

  it.each(cases)('maps move %i to %s/%s with the saved calibration and asset timing',
    (id, archetype, intensity, assetId, anchor, scale) => {
      const move = byId(id)
      expect(resolveMoveVfxProfile(move)).toMatchObject({ archetype, intensity })
      const original = { ...MOVE_VFX_ASSETS[assetId] }
      const asset = resolveMoveVfxAsset(move)
      expect(asset).toMatchObject({ id: assetId, anchor, scale })
      expect(asset).toEqual(getVfxCurationPreviewAsset(MOVE_VFX_ASSETS[assetId]))
      expect(resolveMoveVfxRecipe(move)).toBeUndefined()
      expect(getMoveVfxDurationMs(move)).toBe(original.durationMs)
      expect(getMoveVfxImpactDelayMs(move)).toBe(original.impactAtMs)
      expect(getMoveVfxImpactDelayMs(move)).toBeLessThanOrEqual(getMoveVfxDurationMs(move))
      expect(resolveMoveVfxAsset(move)).toEqual(asset)
      expect(MOVE_VFX_ASSETS[assetId]).toEqual(original)
    })

  it('assigns each confirmed battle role only once and never promotes a reserve', () => {
    const roles = new Set<string>()
    for (const [id, entry] of Object.entries(VFX_CURATION)) {
      if (!entry?.battleArchetype) continue
      expect(entry.reviewed).toBe(true)
      expect(entry.recommendation).toBeUndefined()
      expect(entry.intensity).toBeDefined()
      expect(MOVE_VFX_ASSETS[id]).toBeDefined()
      const role = `${entry.battleArchetype}/${entry.intensity}`
      expect(roles.has(role)).toBe(false)
      roles.add(role)
      expect(getCuratedBattleAssetId(entry.battleArchetype, entry.intensity!)).toBe(id)
    }
    expect(roles.size).toBe(10)
  })

  it('preserves all explicit move assignments and uncurated profiles', () => {
    for (const [id, assetId] of Object.entries(MOVE_VFX_BY_MOVE_ID)) {
      expect(resolveMoveVfxAsset(byId(Number(id)))).toBe(MOVE_VFX_ASSETS[assetId!])
    }
    const heavySlash = { ...resolveMoveVfxProfile(byId(70)), intensity: 'heavy' as const }
    expect(getCuratedBattleAssetId('slash', 'heavy')).toBeUndefined()
    expect(resolveProfileAssetId(byId(70), heavySlash)).toBe('slash')
    expect(getCuratedBattleAssetId('blunt', 'heavy')).toBeUndefined()
    expect(resolveMoveVfxAsset(byId(169)).id).toBe('confuseGif')
    expect(resolveMoveVfxAsset(byId(110)).id).toBe('burst')
    expect(resolveMoveVfxRecipe(byId(1))?.id).toBe('neutral-beam')
  })

  it('lets an Admin override replace saved calibration without multiplying zoom twice', () => {
    const move = byId(6)
    const asset = resolveMoveVfxAsset(move)
    useVfxAdminStore.getState().setOverride({
      moveId: move.id, assetId: asset.id,
      scale: 0.75, anchor: 'self', offsetX: 12, offsetY: -8,
      durationMs: 1200, layer: 'front-ui', mirrorForEnemy: false, blendMode: 'lighten',
    })
    expect(resolveMoveVfxAsset(move)).toMatchObject({
      scale: 0.75, anchor: 'self', offsetX: 12, offsetY: -8, durationMs: 1200,
    })
    expect(resolveMoveVfxRecipe(move)).toBeUndefined()
    expect(getMoveVfxDurationMs(move)).toBe(1200)
    useVfxAdminStore.getState().resetOverrides()
    expect(resolveMoveVfxAsset(move)).toEqual(asset)
  })
})
