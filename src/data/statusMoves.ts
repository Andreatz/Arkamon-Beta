import catalog from './move-vfx-assignments.json'
import type { MossaDef, PokemonSpecie, TipoPokemon } from '@/types'

// Le nove mosse di paralisi del catalogo entrano negli slot ancora liberi.
const PARALYSIS_SOURCE_IDS = new Set([221, 225, 227, 230, 242, 253, 256, 270, 271])
export const PARALYSIS_MOVE_ASSIGNMENTS = catalog.moves.filter((entry) =>
  PARALYSIS_SOURCE_IDS.has(entry.sourceMoveId)
  && entry.gameMoveId === null && entry.type === 'Status (Paralisi)',
)

/** Nome, tipo e proprietari derivano dal catalogo; uno status puro non inventa danno o scaling. */
export const STATUS_MOVES: MossaDef[] = PARALYSIS_MOVE_ASSIGNMENTS.map((entry) => ({
  id: entry.sourceMoveId,
  nome: entry.name,
  tipo: entry.element as TipoPokemon,
  effetto: 'PARALISI',
  valoreEffetto: null,
  soloStato: true,
  dadiPerLivello: { '5': 0 },
  incrementoPerLivello: { '5': 0 },
}))

/** Inserisce gli status soltanto negli slot liberi di una copia delle specie originali. */
export function addStatusMovesToPokemon(pokemon: PokemonSpecie[]): PokemonSpecie[] {
  return pokemon.map((specie) => {
    const mosse = [...specie.mosse] as PokemonSpecie['mosse']
    for (const assignment of PARALYSIS_MOVE_ASSIGNMENTS) {
      if (!assignment.arkamon.some((owner) => owner.id === specie.id) || mosse.includes(assignment.sourceMoveId)) continue
      const slot = mosse.indexOf(0)
      if (slot >= 0) mosse[slot] = assignment.sourceMoveId
    }
    return { ...specie, mosse }
  })
}
