/**
 * Punto di accesso unificato ai dati statici di gioco.
 * Tutti i moduli importano da qui (NON dai file JSON direttamente)
 * così se un domani cambia il formato dei dati, basta toccare questo file.
 */
import type {
  PokemonSpecie,
  MossaDef,
  TabellaTipi,
  CategoriaHP,
  Mappa,
  IncontroSelvatico,
  AllenatoreDef,
} from '@/types'

import pokemonData from './pokemon.json'
import mosseData from './mosse.json'
import tipiData from './tipi.json'
import crescitaData from './crescita_hp.json'
import mappeData from './mappe.json'
import incontriData from './incontri.json'
import allenatoriData from './allenatori.json'

// Cast tipizzati (i JSON non hanno tipi inferiti perfetti dal compilatore)
export const POKEMON_BASE: PokemonSpecie[] = pokemonData as PokemonSpecie[]
export const MOSSE: MossaDef[] = mosseData as MossaDef[]
export const TABELLA_TIPI: TabellaTipi = tipiData as TabellaTipi
export const CRESCITA_HP: Record<CategoriaHP, number> =
  crescitaData as Record<CategoriaHP, number>
export const MAPPE: Mappa[] = mappeData as Mappa[]
export const INCONTRI: IncontroSelvatico[] = incontriData as IncontroSelvatico[]
export const ALLENATORI: AllenatoreDef[] = allenatoriData as AllenatoreDef[]

// =============================================================
// FUNZIONI DI LOOKUP (sostituiscono i Find di VBA su Excel)
// =============================================================

const pokemonById = new Map<number, PokemonSpecie>(
  POKEMON_BASE.map((p) => [p.id, p])
)
const mosseById = new Map<number, MossaDef>(MOSSE.map((m) => [m.id, m]))
const allenatoriById = new Map<number, AllenatoreDef>(
  ALLENATORI.map((a) => [a.id, a])
)

export function getPokemon(id: number): PokemonSpecie | undefined {
  return pokemonById.get(id)
}

export function getMossa(id: number): MossaDef | undefined {
  return mosseById.get(id)
}

export function getAllenatore(id: number): AllenatoreDef | undefined {
  return allenatoriById.get(id)
}

/** Ritorna gli incontri possibili in un cespuglio specifico */
export function getIncontri(luogo: string, cespuglio: string): IncontroSelvatico[] {
  return INCONTRI.filter(
    (i) => i.luogo === luogo && i.cespuglio === cespuglio
  )
}

/** Ritorna tutti gli allenatori di un luogo */
export function getAllenatoriInLuogo(luogo: string): AllenatoreDef[] {
  return ALLENATORI.filter((a) => a.luogo === luogo)
}

/** Moltiplicatore di efficacia di un tipo attaccante contro un tipo difensore */
export function efficaciaTipo(
  attaccante: PokemonSpecie['tipo'],
  difensore: PokemonSpecie['tipo']
): number {
  return TABELLA_TIPI.efficacia[attaccante]?.[difensore] ?? 1
}
