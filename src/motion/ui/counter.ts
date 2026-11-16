/** Contatori animati: logica pura (testabile senza DOM). */

/** Durata del conteggio: cresce con l'entità del salto, entro 320–900 ms a velocità normale. */
export function counterDurationMs(from: number, to: number): number {
  const delta = Math.abs(to - from)
  if (delta === 0) return 0
  return Math.round(Math.min(900, 320 + Math.log10(delta + 1) * 180))
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/** Valore mostrato al tempo normalizzato `t` (0–1): intero, monotono, esatto agli estremi. */
export function counterValueAt(from: number, to: number, t: number): number {
  if (t <= 0) return from
  if (t >= 1) return to
  const value = from + (to - from) * easeOutCubic(t)
  return to >= from ? Math.min(to, Math.round(value)) : Math.max(to, Math.round(value))
}
