import { describe, expect, it } from 'vitest'
import { MOVE_VFX_ASSETS } from '../vfxManifest'
import {
  filterVfxAssetIds,
  getVfxCuration,
  VFX_CURATION,
  VFX_CURATION_CATEGORIES,
} from '../vfxCuration'

describe('VFX curation', () => {
  it('keeps the editorial catalogue linked to real assets after regeneration', () => {
    for (const [assetId, entry] of Object.entries(VFX_CURATION)) {
      expect(MOVE_VFX_ASSETS[assetId], assetId).toBeDefined()
      expect(entry?.categories.length, assetId).toBeGreaterThan(0)
      for (const category of entry?.categories ?? []) {
        expect(VFX_CURATION_CATEGORIES).toContain(category)
      }
    }
  })

  it('leaves uncatalogued assets available without filters', () => {
    expect(getVfxCuration('punch')).toBeUndefined()
    expect(getVfxCuration('unknown-vfx')).toBeUndefined()
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS)).toEqual(Object.keys(MOVE_VFX_ASSETS))
  })

  it('includes candidate, preferred and special entries in the shortlist', () => {
    const result = filterVfxAssetIds(MOVE_VFX_ASSETS, { curatedOnly: true })
    expect(result).toHaveLength(Object.keys(VFX_CURATION).length)
    expect(result).not.toContain('punch')
    expect(new Set(result.map((id) => getVfxCuration(id)?.priority)))
      .toEqual(new Set(['candidate', 'preferred', 'special']))
  })

  it('combines category, shortlist and normalized search', () => {
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS, {
      category: 'electric',
      curatedOnly: true,
      search: '  LIGHTNING  ',
    })).toEqual(['generated:highmountain-img_effect_tynus_lightning_2-images_nested_sheet'])
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS, {
      category: 'heal',
      curatedOnly: true,
      search: 'lightning',
    })).toEqual([])
  })

  it('finds semantic tags even when they are absent from the asset name', () => {
    const assetId = 'generated:fieldgimmickeff-img_thunder-images_nested_sheet'
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS, { search: ' ELECTRIC ' })).toContain(assetId)
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS, { category: 'electric' })).toContain(assetId)
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS, { category: 'heal' })).not.toContain(assetId)
  })

  it('preserves searching by asset ID, label and playback kind', () => {
    const assetId = 'generated:fieldgimmickeff-img_thunder-images_nested_sheet'
    for (const search of [assetId, MOVE_VFX_ASSETS[assetId].label, 'sprite-sheet']) {
      expect(filterVfxAssetIds(MOVE_VFX_ASSETS, { search })).toContain(assetId)
    }
    expect(filterVfxAssetIds(MOVE_VFX_ASSETS, { search: 'no-matching-effect' })).toEqual([])
  })
})
