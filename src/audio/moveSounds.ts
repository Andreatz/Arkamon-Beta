import type { MossaDef, TipoPokemon } from '@/types'
import type { SfxId } from './sfxIds'

/**
 * Suono di ogni mossa: elemento × potenza, più gli effetti di stato.
 *
 * Ogni mossa ha un'intonazione propria (±1,5 semitoni, stabile per id), così due mosse dello
 * stesso elemento non suonano identiche. Il lato del bersaglio decide il panorama.
 */

export type MoveSoundTier = 'light' | 'medium' | 'heavy' | 'status'

const ELEMENT_SLUG: Record<TipoPokemon, string> = {
  Normale: 'normale', Elettro: 'elettro', Fuoco: 'fuoco', Terra: 'terra',
  Acqua: 'acqua', Erba: 'erba', Oscurità: 'oscurita', Psico: 'psico',
}

export interface MoveSound {
  id: SfxId
  /** `impact` per i colpi, `start` per le mosse di stato che non toccano il bersaglio. */
  cue: 'start' | 'impact'
  rate: number
}

/** Mossa Suprema e colpi senza indicazione di potenza: medio, salvo diversa indicazione. */
export function moveSoundFor(
  move: Pick<MossaDef, 'id' | 'tipo' | 'effetto'>,
  tier: MoveSoundTier = 'medium',
  statusKind?: string,
): MoveSound {
  const rate = moveRate(move.id)
  const status = statusSound(statusKind, move.effetto)
  if (tier === 'status' && status) return { id: status, cue: 'start', rate: 1 }
  const power = tier === 'status' ? 'medium' : tier
  return { id: `move.${ELEMENT_SLUG[move.tipo] ?? 'normale'}.${power}` as SfxId, cue: 'impact', rate }
}

function statusSound(kind: string | undefined, effetto: MossaDef['effetto'] | undefined): SfxId | null {
  const text = (kind ?? '').toLocaleLowerCase('it')
  if (text.includes('cura paralisi') || text.includes('cura status')) return 'status.cure'
  if (text.includes('immunità')) return 'status.shield'
  if (text.includes('recupero') || effetto === 'CURA') return 'battle.heal'
  if (text.includes('paralisi') || effetto === 'PARALISI') return 'status.paralysis'
  if (text.includes('confusione') || effetto === 'CONFUSIONE') return 'status.confusion'
  if (text.includes('sonno') || effetto === 'SONNO') return 'status.sleep'
  if (text.includes('veleno') || effetto === 'VELENO') return 'status.poison'
  // «Danno fisso» e simili: un colpo dell'elemento, non un suono di stato.
  return null
}

/** Intonazione stabile per mossa: sette gradini fra -1,5 e +1,5 semitoni. */
export function moveRate(moveId: number): number {
  const step = ((Math.imul(moveId | 0, 2654435761) >>> 0) % 7) - 3
  return 2 ** (step * 0.5 / 12)
}

/** Il colpo arriva dal lato dell'attaccante verso il bersaglio: A a sinistra, B a destra. */
export function panForSide(side: 'A' | 'B' | null | undefined): number {
  return side === 'A' ? -0.35 : side === 'B' ? 0.35 : 0
}

/** Effetti da precaricare all'inizio di una battaglia. */
export const BATTLE_PRELOAD_SFX: readonly SfxId[] = [
  'battle.banner', 'battle.super', 'battle.weak', 'battle.miss', 'battle.ko', 'battle.heal',
  'dice.roll', 'dice.land', 'battle.coin-spin', 'battle.coin-land', 'battle.supreme',
  'capture.throw', 'capture.absorb', 'capture.settle', 'capture.shake', 'capture.escape', 'capture.caught',
  'status.paralysis', 'status.sleep', 'status.confusion', 'status.poison', 'status.cure', 'status.shield', 'status.tick',
  'battle.item', 'battle.boost', 'battle.switch-in',
  'jingle.victory', 'jingle.defeat', 'jingle.levelup',
]

/** Tutti i suoni delle mosse: 8 elementi × 3 potenze, pochi KB l'uno. */
export const ALL_MOVE_SFX: readonly SfxId[] = Object.values(ELEMENT_SLUG)
  .flatMap((slug) => (['light', 'medium', 'heavy'] as const).map((power) => `move.${slug}.${power}` as SfxId))
