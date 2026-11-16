/**
 * Coreografia dell'evoluzione come dati: istanti in cui la sagoma passa da
 * una forma all'altra, sempre più vicini fino al lampo bianco.
 */

/** Durata della trasformazione a velocità normale. */
export const EVOLUTION_MORPH_MS = 3200
/** Frazione della durata in cui lo schermo è già bianco. */
export const EVOLUTION_WHITE_AT = 0.9

/**
 * Keyframe di opacità per la forma vecchia e la nuova. Gli intervalli fra un
 * cambio e il successivo si accorciano in progressione geometrica; dopo
 * l'ultimo cambio restano visibili entrambe, sovrapposte nel bagliore.
 */
export function evolutionAlternation(switches = 14, endAt = 0.82, ratio = 0.8): { times: number[]; oldOpacity: number[]; newOpacity: number[] } {
  const count = Math.max(2, Math.floor(switches))
  const weights = Array.from({ length: count }, (_, index) => ratio ** index)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const times = [0]
  let elapsed = 0
  for (const weight of weights) {
    elapsed += (weight / total) * endAt
    times.push(Math.round(elapsed * 10000) / 10000)
  }
  times[times.length - 1] = endAt
  times.push(1)
  // Si parte dalla forma vecchia; ogni cambio inverte quale delle due è visibile.
  const oldOpacity = times.map((_, index) => (index === times.length - 1 ? 1 : index % 2 === 0 ? 1 : 0))
  const newOpacity = times.map((_, index) => (index === times.length - 1 ? 1 : index % 2 === 0 ? 0 : 1))
  return { times, oldOpacity, newOpacity }
}
