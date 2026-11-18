import compact from './runtime-game-data.json'
import type { AllenatoreDef, CategoriaHP, IncontroSelvatico, MossaDef, PokemonSpecie, Probabilita, TipoAllenatore, TipoPokemon } from '@/types'

type PackedMove = [number, string, number, number, number | null, number, number,
  (boolean | null)?, (string | null)?, (number | null)?]
type PackedSpecies = [number, string, number, number, number, PokemonSpecie['mosse'], number | null, number | null, number]
type PackedTrainer = [number, string, number, number, [number, number][], (boolean | null)?]
type PackedEncounter = [number, string, number, number, number, number]

// JSON tuple lengths are widened by TypeScript; the generator fixes their schema.
const data = compact as unknown as {
  tables: [number, number[]][]
  elements: TipoPokemon[]
  effects: (string | null)[]
  categories: CategoriaHP[]
  places: string[]
  trainerKinds: TipoAllenatore[]
  rarities: Probabilita[]
  moves: PackedMove[]
  species: PackedSpecies[]
  trainers: PackedTrainer[]
  encounters: PackedEncounter[]
}

function levelTable(index: number): Record<string, number> {
  const [start, runs] = data.tables[index]
  const table: Record<string, number> = {}
  let level = start
  for (let i = 0; i < runs.length; i += 2) {
    const end = level + runs[i]
    for (; level < end; level++) table[String(level)] = runs[i + 1]
  }
  return table
}

/** Each move retains independent mutable tables, exactly as in the authored catalog. */
export const BASE_RUNTIME_MOVES: MossaDef[] = data.moves.map(([id, nome, element, effect, valoreEffetto, dice, increment, soloStato, regolaStato, livelloMinimo]) => ({
  id, nome, tipo: data.elements[element], effetto: data.effects[effect], valoreEffetto,
  dadiPerLivello: levelTable(dice), incrementoPerLivello: levelTable(increment),
  ...(soloStato == null ? {} : { soloStato }),
  ...(regolaStato == null ? {} : { regolaStato }),
  ...(livelloMinimo == null ? {} : { livelloMinimo }),
}))

export const RUNTIME_SPECIES: PokemonSpecie[] = data.species.map(([id, nome, category, element, hpBase, mosse, livelloEvoluzione, evoluzioneId, tassoCattura]) => ({
  id, nome, categoria: data.categories[category], tipo: data.elements[element], hpBase, mosse, livelloEvoluzione, evoluzioneId, tassoCattura,
}))

export const RUNTIME_TRAINERS: AllenatoreDef[] = data.trainers.map(([id, nome, place, kind, team, rivale]) => ({
  id, nome, luogo: data.places[place], tipo: data.trainerKinds[kind],
  squadra: team.map(([pokemonId, livello]) => ({ pokemonId, livello })),
  ...(rivale == null ? {} : { rivale }),
}))

export const RUNTIME_ENCOUNTERS: IncontroSelvatico[] = data.encounters.map(([place, cespuglio, pokemonId, rarity, livelloMin, livelloMax]) => ({
  luogo: data.places[place], cespuglio, pokemonId, probabilita: data.rarities[rarity], livelloMin, livelloMax,
}))
