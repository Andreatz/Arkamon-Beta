import { ALLENATORI, getPokemon } from '@/data'
import type { TipoPokemon } from '@/types'

/** Capipalestra nell'ordine del Database: una medaglia ciascuno. */
export const GYM_LEADERS = ALLENATORI.filter(trainer => trainer.tipo === 'Capopalestra')

const MEDAL_BY_TYPE: Record<TipoPokemon, string> = {
  Normale: 'medal-normal', Erba: 'medal-grass', Acqua: 'medal-water', Elettro: 'medal-electric',
  Fuoco: 'medal-fire', Terra: 'medal-earth', Oscurità: 'medal-dark', Psico: 'medal-psychic',
}

// L'ordine delle palestre non segue i tipi: più palestre condividono lo stesso tipo.
// La medaglia dipinta è quella del tipo più presente nella squadra del Capopalestra.
const GYM_MEDAL_ARTWORK = new Map(GYM_LEADERS.map(gym => {
  const types = new Map<TipoPokemon, number>()
  for (const member of gym.squadra) {
    const species = getPokemon(member.pokemonId)
    if (species) types.set(species.tipo, (types.get(species.tipo) ?? 0) + 1)
  }
  const dominantType = [...types].sort((a, b) => b[1] - a[1])[0]?.[0]
  return [gym.id, dominantType ? MEDAL_BY_TYPE[dominantType] : 'medal-empty'] as const
}))

/** Arte della medaglia: quella della palestra se ottenuta, altrimenti l'alloggio vuoto. */
export function gymMedalArtwork(gymId: number, earned: boolean): string {
  return earned ? GYM_MEDAL_ARTWORK.get(gymId) ?? 'medal-empty' : 'medal-empty'
}
