import type { TipoPokemon } from '@/types'

const TYPE_SLUGS: Record<TipoPokemon, string> = {
  Normale: 'normale', Fuoco: 'fuoco', Acqua: 'acqua', Erba: 'erba',
  Elettro: 'elettro', Terra: 'terra', Psico: 'psico', Oscurità: 'oscurita',
}

/** Colore del tipo come variabile CSS (`--arka-type-*` in index.css). */
export function typeColorVar(type: TipoPokemon): string {
  return `var(--arka-type-${TYPE_SLUGS[type]})`
}
