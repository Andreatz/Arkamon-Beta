import type { MoveVfxAsset } from './types'

export const VFX_CURATION_CATEGORIES = [
  'physical',
  'slash',
  'impact',
  'beam',
  'fire',
  'water',
  'electric',
  'psychic',
  'dark',
  'heal',
  'buff',
  'debuff',
  'status',
  'aura',
  'screen',
  'supreme',
] as const

export type VfxCurationCategory = typeof VFX_CURATION_CATEGORIES[number]

export interface VfxCurationEntry {
  categories: readonly VfxCurationCategory[]
  priority?: 'candidate' | 'preferred' | 'special'
  notes?: string
}

// Initial shortlist based on asset names and previous previews, pending visual review.
// Keep editorial metadata here: generatedVfxAssets.ts belongs to the asset pipeline.
export const VFX_CURATION: Readonly<Partial<Record<string, VfxCurationEntry>>> = {
  'generated:anglercompany-img_ladderpuzzle_shock-images_nested_sheet': {
    categories: ['electric', 'impact'],
    priority: 'preferred',
  },
  'generated:anglercompany-img_subboss_chargedcannon_blue_hit-images_nested_sheet': {
    categories: ['beam', 'impact'],
    priority: 'candidate',
  },
  'generated:anglercompany-img_subboss_chargedcannon_red_hit-images_nested_sheet': {
    categories: ['beam', 'fire', 'impact'],
    priority: 'candidate',
  },
  'generated:anglercompany-img_subboss_railcannon_discharge-images_nested_sheet': {
    categories: ['beam'],
    priority: 'preferred',
  },
  'generated:anglercompany-img_subboss_railcannon_hit-images_nested_sheet': {
    categories: ['impact', 'beam'],
    priority: 'candidate',
  },
  'generated:basiceff-img_itemlevelup-images_nested_sheet': {
    categories: ['buff', 'aura'],
    priority: 'candidate',
  },
  'generated:basiceff-img_psychicworkupward-images_nested_sheet': {
    categories: ['psychic', 'aura'],
    priority: 'candidate',
  },
  'generated:championraid-img_stackdebuff_acid_pre-images_nested_sheet': {
    categories: ['debuff', 'status'],
    priority: 'candidate',
  },
  'generated:championraid-img_stackdebuff_flame_pre-images_nested_sheet': {
    categories: ['fire', 'debuff', 'status'],
    priority: 'candidate',
  },
  'generated:championraid-img_stackdebuff_frozen_pre-images_nested_sheet': {
    categories: ['water', 'debuff', 'status'],
    priority: 'candidate',
  },
  'generated:debuffeffect-img_dropbloodingcurse_end-images_nested_sheet': {
    categories: ['dark', 'debuff'],
    priority: 'candidate',
  },
  'generated:direction-img_effect_skill_spark_0-images_nested_sheet': {
    categories: ['electric', 'impact'],
    priority: 'candidate',
  },
  'generated:direction1-img_effect_skill_overswingdouble_0-images_nested_sheet': {
    categories: ['slash', 'physical'],
    priority: 'preferred',
  },
  'generated:fieldgimmickeff-img_thunder-images_nested_sheet': {
    categories: ['electric'],
    priority: 'preferred',
  },
  'generated:hekatoneff_1001-img_explosion-images_nested_sheet': {
    categories: ['fire', 'impact'],
    priority: 'preferred',
  },
  'generated:hekatoneff_1011-img_hit-images_nested_sheet': {
    categories: ['impact', 'physical'],
    priority: 'candidate',
  },
  'generated:highmountain-img_effect_tynus_lightning_2-images_nested_sheet': {
    categories: ['electric', 'supreme'],
    priority: 'special',
  },
  'generated:lynn-img_skill_heal_effect-images_nested_sheet': {
    categories: ['heal', 'aura'],
    priority: 'preferred',
  },
  'generated:lynn-img_skill_heal_specialaffected-images_nested_sheet': {
    categories: ['heal', 'buff'],
    priority: 'candidate',
  },
  'generated:lynn-img_skill_hithard_hit-images_nested_sheet': {
    categories: ['impact', 'physical'],
    priority: 'preferred',
  },
  'generated:lynn-img_skill_sneakattackhit-images_nested_sheet': {
    categories: ['physical', 'slash'],
    priority: 'candidate',
  },
  'generated:mobeff-img_apcrevive_0-images_nested_sheet': {
    categories: ['heal', 'buff'],
    priority: 'candidate',
  },
  'generated:onusereff-img_eventeffect_watersmash1-images_nested_sheet': {
    categories: ['water', 'impact'],
    priority: 'preferred',
  },
  'generated:basiceff-img_jobchangedkain-images_nested_sheet': {
    categories: ['aura', 'supreme'],
    priority: 'special',
    notes: 'Effetto lungo: usare solo per mosse Supreme/cinematiche.',
  },
  'generated:elitemobeff-img_grandisindividualelitebosseffect-images_nested_sheet': {
    categories: ['screen', 'supreme'],
    priority: 'special',
  },
  'generated:highmountain-img_effect_fevertime-images_nested_sheet': {
    categories: ['screen', 'supreme'],
    priority: 'special',
  },
}

export function getVfxCuration(assetId: string): VfxCurationEntry | undefined {
  return Object.prototype.hasOwnProperty.call(VFX_CURATION, assetId)
    ? VFX_CURATION[assetId]
    : undefined
}

export function filterVfxAssetIds(
  assets: Readonly<Record<string, MoveVfxAsset>>,
  { search = '', category = 'all', curatedOnly = false }: {
    search?: string
    category?: VfxCurationCategory | 'all'
    curatedOnly?: boolean
  } = {}
): string[] {
  const query = search.trim().toLowerCase()

  return Object.keys(assets).filter((assetId) => {
    const asset = assets[assetId]
    const curation = getVfxCuration(assetId)

    // All entries are shortlisted, including preferred and special effects.
    if (curatedOnly && !curation) return false
    if (category !== 'all' && !curation?.categories.includes(category)) return false

    return !query || [assetId, asset.label, asset.kind, ...(curation?.categories ?? [])]
      .some((value) => value.toLowerCase().includes(query))
  })
}
