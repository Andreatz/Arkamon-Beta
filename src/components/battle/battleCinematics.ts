/**
 * Scelte di regia della battaglia, come funzioni pure.
 *
 * Qui non si decide nulla del gioco: i valori in ingresso (danno, HP, tiri,
 * moltiplicatore) arrivano già risolti dal motore e servono soltanto a
 * dosare inquadrature, scosse e dimensioni.
 */
import type { CameraMove } from '@/motion/camera'

export type BattleSide = 'A' | 'B'
export type EfficacyTone = 'super' | 'weak' | 'normal'

/** Nome del punto di interesse registrato sulla cinepresa di battaglia. */
export const focusOf = (side: BattleSide): 'player' | 'enemy' => (side === 'A' ? 'player' : 'enemy')
export const opponentOf = (side: BattleSide): BattleSide => (side === 'A' ? 'B' : 'A')

export function efficacyTone(multiplier: number): EfficacyTone {
  if (!Number.isFinite(multiplier) || multiplier === 1) return 'normal'
  return multiplier > 1 ? 'super' : 'weak'
}

export const EFFICACY_LABEL: Record<EfficacyTone, string | null> = {
  super: 'Superefficace!',
  weak: 'Poco efficace…',
  normal: null,
}

/**
 * Intensità 0..1 della scossa alla rivelazione del danno. Cresce con la quota
 * di HP massimi tolta; la radice dà peso anche ai colpi piccoli senza che
 * quelli grandi saturino subito. Un KO non scende mai sotto 0,8.
 */
export function damageTrauma(damage: number, hpMax: number, ko = false): number {
  if (!(damage > 0) || !(hpMax > 0)) return 0
  const share = Math.min(1, damage / hpMax)
  const trauma = 0.18 + 0.82 * Math.sqrt(share)
  return Math.min(1, ko ? Math.max(0.8, trauma) : trauma)
}

/**
 * Audit fase 5: scossa dello sprite colpito quando il danno diventa pubblico.
 * Ampiezza e durata seguono `damageTrauma`: un graffio appena si vede, un colpo
 * che porta via metà degli HP scuote chiaramente, un KO arriva al massimo.
 */
export function damageRevealShake(damage: number, hpMax: number, ko = false): { px: number; ms: number } | null {
  const trauma = damageTrauma(damage, hpMax, ko)
  if (trauma <= 0) return null
  return { px: Math.round(3 + 15 * trauma), ms: Math.round(160 + 260 * trauma) }
}

/** Inquadratura sull'attaccante: più stretta e inclinata per la Mossa Suprema. */
export function attackerShot(side: BattleSide, suprema: boolean): CameraMove {
  return suprema
    ? { focus: focusOf(side), zoom: 1.32, rotate: side === 'A' ? -1.6 : 1.6, ms: 520, ease: 'out' }
    : { focus: focusOf(side), zoom: 1.16, rotate: 0, ms: 380, ease: 'out' }
}

/** Stacco sul bersaglio al rilascio del colpo. */
export function targetShot(targetSide: BattleSide, suprema: boolean): CameraMove {
  return { focus: focusOf(targetSide), zoom: suprema ? 1.3 : 1.2, rotate: 0, ms: 240, ease: 'inOut' }
}

/** Primo piano sull'Arkamon che va KO. */
export function knockoutShot(side: BattleSide): CameraMove {
  return { focus: focusOf(side), zoom: 1.34, rotate: 0, ms: 420, ease: 'out' }
}

/** Inquadratura finale sul lato vincitore. */
export function outcomeShot(winner: BattleSide): CameraMove {
  return { focus: focusOf(winner), zoom: 1.14, rotate: 0, ms: 700, ease: 'inOut' }
}

/**
 * Larghezza in pixel della cella di un dado: pochi dadi diventano grandi e
 * leggibili da lontano, molti dadi tornano alla griglia compatta.
 */
export function diceCellWidth(count: number): { desktop: number; mobile: number } {
  if (count <= 1) return { desktop: 210, mobile: 150 }
  if (count === 2) return { desktop: 190, mobile: 130 }
  if (count === 3) return { desktop: 168, mobile: 104 }
  if (count === 4) return { desktop: 146, mobile: 94 }
  if (count <= 6) return { desktop: 124, mobile: 94 }
  if (count <= 12) return { desktop: 106, mobile: 94 }
  return { desktop: 80, mobile: 50 }
}
