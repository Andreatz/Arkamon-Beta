import type { MossaDef, TipoPokemon } from '@/types'
import { MOVE_VFX_BY_MOVE_ID } from './moveVfxOverrides'
import {
  MOVE_VFX_ASSETS,
  type MoveVfxAssetId,
} from './vfxManifest'
import type { MoveVfxAsset } from './types'
import { getAdminMoveVfxOverride } from '@store/vfxAdminStore'

const BY_EFFECT: Partial<Record<string, MoveVfxAssetId>> = {
  CURA: 'cure',
  CURA_PCT: 'cure',
  CONFUSIONE: 'confuseGif',
  SONNO: 'debuff',
  VELENO: 'poisonGif',
  SUPREMA: 'burst',
}

const BY_TYPE: Record<TipoPokemon, MoveVfxAssetId[]> = {
  Fuoco: ['fireballGif', 'fireImpactGif', 'firePulseGif', 'fireWaveGif'],
  Acqua: ['waterGif', 'waterTorrentGif'],
  Erba: ['shimmer', 'slash'],
  Elettro: ['energyGif', 'lightningGif'],
  Terra: ['punch', 'guardBreakGif'],
  Psico: ['psychicGif', 'psychicBurstGif', 'confuseGif'],
  Oscurità: ['debuff', 'slash'],
  Normale: ['punch', 'thrust', 'gutsPunchGif'],
}

const NAME_RULES: { words: string[]; assetId: MoveVfxAssetId }[] = [
  { words: ['taglio', 'lama', 'artiglio', 'fendente', 'slash', 'squarcio'], assetId: 'slash' },
  { words: ['pugno', 'colpo', 'botta', 'punch', 'impatto'], assetId: 'punch' },
  { words: ['cura', 'guarigione', 'heal', 'risveglio', 'respiro'], assetId: 'cure' },
  { words: ['barriera', 'protezione'], assetId: 'barrier' },
  { words: ['scudo', 'guardia'], assetId: 'shield' },
  { words: ['confusione'], assetId: 'confuseGif' },
  { words: ['psico', 'mente', 'mentale'], assetId: 'psychicGif' },
  { words: ['acqua', 'onda', 'spruzzo', 'marea', 'alluvione'], assetId: 'waterGif' },
  { words: ['fulmine', 'tuono', 'tensione', 'scarica', 'elettr'], assetId: 'energyGif' },
  { words: ['fiamma', 'fuoco', 'incendio', 'brace', 'lavic'], assetId: 'burst' },
]

export function normalizeVfxText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function byName(move: MossaDef): MoveVfxAssetId | undefined {
  const name = normalizeVfxText(move.nome)
  return NAME_RULES.find((rule) => rule.words.some((word) => name.includes(word)))?.assetId
}

function byType(move: MossaDef): MoveVfxAssetId {
  const variants = BY_TYPE[move.tipo]
  return variants[move.id % variants.length] ?? 'punch'
}

export function resolveMoveVfxAsset(move: MossaDef): MoveVfxAsset {
  const assetId =
    MOVE_VFX_BY_MOVE_ID[move.id] ??
    (move.effetto ? BY_EFFECT[move.effetto] : undefined) ??
    byName(move) ??
    byType(move) ??
    'punch'

  const baseAsset = MOVE_VFX_ASSETS[assetId] ?? MOVE_VFX_ASSETS.punch
  const adminOverride = getAdminMoveVfxOverride(move.id)

  if (!adminOverride) return baseAsset

  return {
    ...MOVE_VFX_ASSETS[adminOverride.assetId],
    scale: adminOverride.scale,
    offsetX: adminOverride.offsetX,
    offsetY: adminOverride.offsetY,
    durationMs: adminOverride.durationMs,
    anchor: adminOverride.anchor,
    layer: adminOverride.layer,
    mirrorForEnemy: adminOverride.mirrorForEnemy,
    blendMode: adminOverride.blendMode,
  }
}

export function getMoveVfxImpactDelayMs(move: MossaDef): number {
  return resolveMoveVfxAsset(move).impactAtMs ?? 0
}

export function getMoveVfxDurationMs(move: MossaDef): number {
  return resolveMoveVfxAsset(move).durationMs
}
