import type { TipoPokemon } from '@/types'

/** Colore di ogni tipo per fasce, impulsi e scie degli effetti (solo presentazione). */
export const VFX_TYPE_COLORS: Record<TipoPokemon, string> = {
  Normale: '#f8fafc',
  Fuoco: '#fb923c',
  Acqua: '#38bdf8',
  Erba: '#4ade80',
  Elettro: '#fde047',
  Terra: '#d6a15f',
  Psico: '#e879f9',
  Oscurità: '#a78bfa',
}
