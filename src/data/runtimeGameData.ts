import compact from './runtime-game-data.json'
import type { AllenatoreDef, CategoriaHP, IncontroSelvatico, MossaDef, PokemonSpecie, Probabilita, TipoAllenatore, TipoPokemon } from '@/types'

type PackedMove = [id: number, name: string, element: number, effect: number, value: number | null,
  dice: number, increment: number, status?: boolean | null, accuracy?: number | null, stage?: number | null, level?: number | null]
type PackedSpecies = [id: number, name: string, category: number, element: number, hp: number, moves: PokemonSpecie['mosse'],
  evolutionLevel: number | null, evolutionId: number | null, capture: number | null]
type PackedTrainer = [id: number, name: string, place: number, kind: number, team: [number, number][],
  workbookId?: number | null, win?: number | null, loss?: number | null, levels?: number[] | null]
type PackedEncounter = [place: number, bush: string, species: number, rarity: number, min: number, max: number]

// The generator emits fixed-length tuples that TypeScript widens when importing JSON.
const data = compact as unknown as {
  tables: [start: number, runs: number[]][]
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
export const BASE_RUNTIME_MOVES: MossaDef[] = data.moves.map(([id, nome, element, effect, valoreEffetto, dice, increment, soloStato, precisione, stadioMinimo, livelloMinimo]) => ({
  id, nome, tipo: data.elements[element], effetto: data.effects[effect], valoreEffetto,
  dadiPerLivello: levelTable(dice), incrementoPerLivello: levelTable(increment),
  ...(soloStato == null ? {} : { soloStato }),
  ...(precisione == null ? {} : { precisione }),
  ...(stadioMinimo == null ? {} : { stadioMinimo }),
  ...(livelloMinimo == null ? {} : { livelloMinimo }),
}))

export const RUNTIME_SPECIES: PokemonSpecie[] = data.species.map(([id, nome, category, element, hpBase, mosse, livelloEvoluzione, evoluzioneId, tassoCattura]) => ({
  id, nome, categoria: data.categories[category], tipo: data.elements[element], hpBase,
  mosse, livelloEvoluzione, evoluzioneId, tassoCattura,
}))

export const RUNTIME_TRAINERS: AllenatoreDef[] = data.trainers.map(([id, nome, place, kind, team, idDatabase, guadagno, perdita, livelliRivale]) => ({
  id, nome, luogo: data.places[place], tipo: data.trainerKinds[kind],
  squadra: team.map(([pokemonId, livello]) => ({ pokemonId, livello })),
  ...(idDatabase == null ? {} : { idDatabase }),
  ...(guadagno == null ? {} : { guadagno }),
  ...(perdita == null ? {} : { perdita }),
  ...(livelliRivale == null ? {} : { livelliRivale }),
}))

export const RUNTIME_ENCOUNTERS: IncontroSelvatico[] = data.encounters.map(([place, cespuglio, pokemonId, rarity, livelloMin, livelloMax]) => ({
  luogo: data.places[place], cespuglio, pokemonId, probabilita: data.rarities[rarity], livelloMin, livelloMax,
}))
