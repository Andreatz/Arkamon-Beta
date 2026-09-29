import type { MoveVfxAsset, VfxAnchor, VfxIntensity } from './types'

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
  reviewed?: boolean
  recommendation?: 'proposed' | 'reserve'
  intensity?: VfxIntensity
  preview?: {
    anchor?: VfxAnchor
    scaleMultiplier?: number
  }
  notes?: string
}

// Initial shortlist based on asset names and previous previews, pending visual review.
// Keep editorial metadata here: generatedVfxAssets.ts belongs to the asset pipeline.
export const VFX_CURATION: Readonly<Partial<Record<string, VfxCurationEntry>>> = {
  'generated:anglercompany-img_finalboss_minitail_hit-images_flat_sheet': {
    categories: ['psychic', 'impact'],
    priority: 'candidate',
    recommendation: 'proposed',
    intensity: 'light',
    preview: { anchor: 'target', scaleMultiplier: 1 },
    notes: 'Proposta Psico leggera: lampo viola compatto, dissolvenza rapida (333 ms).',
  },
  'generated:basiceff-img_tjrjump-images_nested_sheet': {
    categories: ['physical', 'impact'],
    priority: 'candidate',
    recommendation: 'proposed',
    intensity: 'light',
    preview: { anchor: 'target', scaleMultiplier: 1.25 },
    notes: 'Proposta impatto leggero: anello bianco breve e direzionale (458 ms).',
  },
  'gif:27c650209255d638948a6215ffea9c78': {
    categories: ['slash', 'physical'],
    priority: 'candidate',
    recommendation: 'proposed',
    intensity: 'light',
    preview: { anchor: 'target', scaleMultiplier: 0.75 },
    notes: 'Proposta taglio leggero: tre artigli chiari e rapidi (400 ms). Fondo nero gestito con screen.',
  },
  'generated:anglercompany-img_ladderpuzzle_shock-images_nested_sheet': {
    categories: ['psychic', 'impact'],
    priority: 'preferred',
    reviewed: true,
    preview: { anchor: 'center', scaleMultiplier: 1.5 },
    notes: 'Scelto per mosse psichiche: allineamento centrale e zoom 1.5×.',
  },
  'generated:anglercompany-img_subboss_chargedcannon_blue_hit-images_nested_sheet': {
    categories: ['electric', 'impact'],
    priority: 'candidate',
    recommendation: 'proposed',
    intensity: 'light',
    preview: { anchor: 'target', scaleMultiplier: 1.25 },
    notes: 'Proposta Elettro leggera: scintille ciano compatte (417 ms), distinta da Spark 0.',
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
    recommendation: 'reserve',
    notes: 'Riserva UI: contiene la scritta LEVEL UP, non adatto a una mossa generica.',
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
    priority: 'preferred',
    reviewed: true,
    intensity: 'medium',
    preview: { scaleMultiplier: 1.5 },
    notes: 'Scelto per mosse Elettro medie, zoom 1.5×. Posizione originale.',
  },
  'generated:direction1-img_effect_skill_overswingdouble_0-images_nested_sheet': {
    categories: ['slash', 'physical'],
    priority: 'preferred',
    recommendation: 'proposed',
    intensity: 'medium',
    preview: { anchor: 'target', scaleMultiplier: 1.25 },
    notes: 'Proposta taglio medio: doppio arco rosso-bianco, ampio ma breve (292 ms).',
  },
  'generated:fieldgimmickeff-img_thunder-images_nested_sheet': {
    categories: ['electric'],
    priority: 'preferred',
    recommendation: 'reserve',
    notes: 'Alternativa: fulmine stretto con nuvola e detriti. Meno neutro dei tre Elettro selezionati.',
  },
  'generated:hekatoneff_1001-img_explosion-images_nested_sheet': {
    categories: ['psychic', 'impact'],
    priority: 'candidate',
    recommendation: 'proposed',
    intensity: 'medium',
    preview: { anchor: 'target', scaleMultiplier: 1.5 },
    notes: 'Proposta Psico media: nucleo viola con orbite luminose (292 ms), non una fiammata.',
  },
  'generated:hekatoneff_1011-img_hit-images_nested_sheet': {
    categories: ['psychic', 'aura'],
    priority: 'candidate',
    recommendation: 'reserve',
    notes: 'Portale con sagoma scura: riservare a evocazioni, non a impatti fisici generici.',
  },
  'generated:highmountain-img_effect_tynus_lightning_2-images_nested_sheet': {
    categories: ['electric', 'impact'],
    priority: 'preferred',
    reviewed: true,
    intensity: 'heavy',
    preview: { anchor: 'target', scaleMultiplier: 1.5 },
    notes: 'Confermato per mosse Elettro forti: sul bersaglio, zoom 1.5×.',
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
    recommendation: 'proposed',
    intensity: 'medium',
    preview: { anchor: 'target', scaleMultiplier: 1.25 },
    notes: 'Proposta impatto medio: stella giallo-bianca e anello breve (333 ms).',
  },
  'generated:lynn-img_skill_sneakattackhit-images_nested_sheet': {
    categories: ['dark', 'impact'],
    priority: 'candidate',
    recommendation: 'reserve',
    notes: 'Impatto nero, viola e verde; conservare per Oscurità, non come taglio neutro.',
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

export function getVfxReviewLabel(entry: VfxCurationEntry | undefined): string {
  if (entry?.reviewed) return 'Confermato'
  if (entry?.recommendation === 'proposed') return 'Proposta'
  if (entry?.recommendation === 'reserve') return 'Riserva'
  return 'Da valutare'
}

// Apply saved visual decisions without mutating the generated manifest.
// Explicit Lab controls replace saved values, so choosing 1.5× never applies it twice.
export function getVfxCurationPreviewAsset(
  asset: MoveVfxAsset,
  { anchor = 'default', scale = 'default' }: {
    anchor?: VfxAnchor | 'default'
    scale?: number | 'default'
  } = {}
): MoveVfxAsset {
  const preview = getVfxCuration(asset.id)?.preview
  return {
    ...asset,
    anchor: anchor === 'default' ? preview?.anchor ?? asset.anchor : anchor,
    scale: (asset.scale ?? 1) * (scale === 'default' ? preview?.scaleMultiplier ?? 1 : scale),
  }
}

export function filterVfxAssetIds(
  assets: Readonly<Record<string, MoveVfxAsset>>,
  { search = '', category = 'all', curatedOnly = false, recommendedOnly = false }: {
    search?: string
    category?: VfxCurationCategory | 'all'
    curatedOnly?: boolean
    recommendedOnly?: boolean
  } = {}
): string[] {
  const query = search.trim().toLowerCase()

  return Object.keys(assets).filter((assetId) => {
    const asset = assets[assetId]
    const curation = getVfxCuration(assetId)

    // All entries are shortlisted, including preferred and special effects.
    if (curatedOnly && !curation) return false
    if (recommendedOnly && !curation?.reviewed && curation?.recommendation !== 'proposed') return false
    if (category !== 'all' && !curation?.categories.includes(category)) return false

    return !query || [assetId, asset.label, asset.kind, ...(curation?.categories ?? [])]
      .some((value) => value.toLowerCase().includes(query))
  })
}
