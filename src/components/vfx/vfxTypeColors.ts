import type { TipoPokemon } from '@/types'

/**
 * Colore di ogni tipo per fasce, impulsi e scie degli effetti (solo presentazione).
 * Audit fase 10: i valori vivono in tokens.css (--arka-type-*); qui restano i riferimenti,
 * usabili in style, gradienti, color-mix e drop-shadow.
 */
export const VFX_TYPE_COLORS: Record<TipoPokemon, string> = {
  Normale: 'var(--arka-type-normale)',
  Fuoco: 'var(--arka-type-fuoco)',
  Acqua: 'var(--arka-type-acqua)',
  Erba: 'var(--arka-type-erba)',
  Elettro: 'var(--arka-type-elettro)',
  Terra: 'var(--arka-type-terra)',
  Psico: 'var(--arka-type-psico)',
  Oscurità: 'var(--arka-type-oscurita)',
}
