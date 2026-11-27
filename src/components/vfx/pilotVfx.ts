import type { MossaDef } from '@/types'
import catalog from '@/data/vfx-pilot.json'
import type { MoveVfxAsset, SpriteSheetMeta, VfxAnchor, VfxBlendMode } from './types'

/**
 * Lotto pilota dei VFX (27 novembre 2026): tre metodi a confronto sulle stesse 8 mosse.
 * - `codice`: disegnati in Skia da `scripts/vfx-pilot/draw-vfx.py`;
 * - `flow`: clip di Flow convertite da `scripts/vfx-pilot/import-vfx.py`;
 * - `imagegen`: fogli di ChatGPT convertiti dallo stesso script.
 * Ogni variante è un asset `pilot:<mossa>:<metodo>`; quella `active` è usata in battaglia.
 */
export type PilotVfxMethod = 'codice' | 'flow' | 'imagegen'

export const PILOT_VFX_METHOD_LABELS: Record<PilotVfxMethod, string> = {
  codice: 'Codice',
  flow: 'Flow',
  imagegen: 'ImageGen',
}

interface PilotVariant {
  src: string
  sprite: SpriteSheetMeta
  durationMs: number
  impactAtMs: number
  anchor: string
  width: number
  height: number
  offsetY: number
  blendMode: string
}

interface PilotMove {
  name: string
  type: string
  arkamon: string
  arkamonId: number
  active: string
  variants: Partial<Record<PilotVfxMethod, PilotVariant>>
}

const MOVES = (catalog as { moves: Record<string, PilotMove> }).moves

export const pilotVfxAssetId = (moveId: number, method: PilotVfxMethod) => `pilot:${moveId}:${method}`

export const PILOT_VFX_ASSETS: Record<string, MoveVfxAsset> = Object.fromEntries(
  Object.entries(MOVES).flatMap(([moveId, move]) => (Object.entries(move.variants) as [PilotVfxMethod, PilotVariant][])
    .map(([method, variant]) => {
      const id = pilotVfxAssetId(Number(moveId), method)
      const asset: MoveVfxAsset = {
        id,
        label: `Pilota · ${move.name} (${move.arkamon}) · ${PILOT_VFX_METHOD_LABELS[method]}`,
        kind: 'sprite-sheet',
        src: variant.src,
        sprite: variant.sprite,
        durationMs: variant.durationMs,
        impactAtMs: variant.impactAtMs,
        anchor: variant.anchor as VfxAnchor,
        layer: 'over-pokemon',
        width: variant.width,
        height: variant.height,
        scale: 1,
        offsetY: variant.offsetY,
        mirrorForEnemy: true,
        blendMode: variant.blendMode as VfxBlendMode,
        motion: 'static',
      }
      return [id, asset] as const
    })),
)

export interface PilotVfxEntry {
  moveId: number
  name: string
  type: string
  arkamon: string
  arkamonId: number
  active: PilotVfxMethod
  methods: PilotVfxMethod[]
}

export const PILOT_VFX_MOVES: PilotVfxEntry[] = Object.entries(MOVES).map(([moveId, move]) => ({
  moveId: Number(moveId),
  name: move.name,
  type: move.type,
  arkamon: move.arkamon,
  arkamonId: move.arkamonId,
  active: move.active as PilotVfxMethod,
  methods: Object.keys(move.variants) as PilotVfxMethod[],
}))

const normalize = (name: string) => name.trim().toLocaleLowerCase('it')

/** Asset pilota in uso per la mossa, se la mossa fa parte del lotto (stesso id e stesso nome). */
export function getPilotVfxAssetId(move: Pick<MossaDef, 'id' | 'nome'>): string | undefined {
  const entry = MOVES[String(move.id)]
  if (!entry || normalize(entry.name) !== normalize(move.nome)) return undefined
  const id = pilotVfxAssetId(move.id, entry.active as PilotVfxMethod)
  return PILOT_VFX_ASSETS[id] ? id : undefined
}
