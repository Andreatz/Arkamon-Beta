/**
 * Messa in scena della cattura come funzione pura.
 *
 * Il motore ha già deciso tutto (`tentaCattura`): tre d6, somma, soglia ed
 * esito. Qui i tre dadi diventano le oscillazioni della sfera: ognuna rivela
 * un dado e la somma parziale. La sfera si apre al primo dado che porta la
 * somma oltre la soglia; se resiste a tutti e tre, la cattura riesce.
 */

export interface CaptureStep {
  /** Valore del dado rivelato da questa oscillazione (assente con la Masterball). */
  die: number | null
  /** Somma parziale dopo questo dado. */
  total: number
  /** true se la sfera resiste ancora dopo questo dado. */
  holds: boolean
}

/** Sacchettino lanciato: decide l'illustrazione del sacchetto (fase U5). */
export type CaptureBag = 'sacchettino' | 'mega-sacchettino' | 'ultra-sacchettino' | 'masterball'

export interface CapturePlan {
  kind: 'dice' | 'master'
  /** Sacchettino usato; senza indicazione si deduce dal tipo di cattura. */
  item?: CaptureBag
  steps: CaptureStep[]
  caught: boolean
  /** Somma massima che consente la cattura (i dadi sono interi). */
  maxTotal: number | null
  /** Tiro d20 del Sacchettino: risultato minimo per catturare. */
  minRoll?: number
}

/** La soglia del motore può essere decimale: con dadi interi conta la sua parte intera. */
export function captureMaxTotal(soglia: number): number {
  if (!Number.isFinite(soglia)) return 0
  return Math.floor(soglia + 1e-9)
}

export function planDiceCapture({ tiri, soglia, riuscita }: { tiri: readonly number[]; soglia: number; riuscita: boolean }): CapturePlan {
  const maxTotal = captureMaxTotal(soglia)
  const steps: CaptureStep[] = []
  let total = 0
  for (const die of tiri.slice(0, 3)) {
    total += die
    // Sull'ultimo dado l'esito è quello del motore, anche se una soglia anomala lo contraddicesse.
    const last = steps.length === Math.min(3, tiri.length) - 1
    const holds = last ? riuscita : total <= maxTotal
    steps.push({ die, total, holds })
    if (!holds) break
  }
  return { kind: 'dice', steps, caught: riuscita, maxTotal }
}

/** Sacchettino (tabella d20 del Database): due oscillazioni di attesa, poi il d20 decide. */
export function planD20Capture({ roll, soglia, riuscita }: { roll: number; soglia: number; riuscita: boolean }): CapturePlan {
  return {
    kind: 'dice', caught: riuscita, maxTotal: null, minRoll: soglia,
    steps: [{ die: null, total: 0, holds: true }, { die: null, total: 0, holds: true }, { die: roll, total: roll, holds: riuscita }],
  }
}

/** Sacchettino Supremo: tre oscillazioni senza dadi, sempre riuscita. */
export function planMasterCapture(): CapturePlan {
  return { kind: 'master', steps: [0, 0, 0].map(() => ({ die: null, total: 0, holds: true })), caught: true, maxTotal: null }
}

/** Illustrazione del lotto 1 per il sacchetto lanciato. */
export function captureBagArt(item: CaptureBag | undefined, kind: CapturePlan['kind']): string {
  const bag = item ?? (kind === 'master' ? 'masterball' : 'sacchettino')
  return bag === 'masterball' ? 'item-sacchettino-supremo' : `item-${bag}`
}
