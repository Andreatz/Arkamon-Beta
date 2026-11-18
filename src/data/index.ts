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

import { BASE_RUNTIME_MOVES, RUNTIME_ENCOUNTERS, RUNTIME_SPECIES, RUNTIME_TRAINERS } from './runtimeGameData'
import tipiData from './tipi.json'
import crescitaData from './crescita_hp.json'
import mappeData from './mappe.json'
import { resolveStatusMove } from './statusMoves'

// Cast tipizzati (i JSON non hanno tipi inferiti perfetti dal compilatore)
// Specie, mosse, incontri e allenatori vengono da data-source/Database.xlsx
// (scripts/data/import-database.py). Le mosse Status prendono i valori da statusMoveRules.json.
export const POKEMON_BASE: PokemonSpecie[] = RUNTIME_SPECIES
export const MOSSE: MossaDef[] = BASE_RUNTIME_MOVES.map(resolveStatusMove)
export const TABELLA_TIPI: TabellaTipi = tipiData as TabellaTipi
export const CRESCITA_HP: Record<CategoriaHP, number> =
  crescitaData as Record<CategoriaHP, number>
export const MAPPE: Mappa[] = mappeData as Mappa[]
export const INCONTRI: IncontroSelvatico[] = RUNTIME_ENCOUNTERS
export const ALLENATORI: AllenatoreDef[] = RUNTIME_TRAINERS


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

/** Stadio della linea evolutiva adatto al livello (lo starter del rivale cresce con lui). */
export function stadioPerLivello(speciesId: number, livello: number): number {
  let current = getPokemon(speciesId)
  while (current && current.evoluzioneId && current.livelloEvoluzione && livello >= current.livelloEvoluzione) {
    const next = getPokemon(current.evoluzioneId)
    if (!next) break
    current = next
  }
  return current?.id ?? speciesId
}

/**
 * Squadra reale di un allenatore. Nel Database lo slot 1 del rivale è vuoto (pokemonId 0):
 * diventa lo starter scartato dai giocatori, allo stadio adatto al suo livello.
 */
export function squadraAllenatore(trainer: AllenatoreDef, rivaleStarterId: number | null): { pokemonId: number; livello: number }[] {
  return trainer.squadra.map((slot) => {
    if (slot.pokemonId !== 0 || !trainer.rivale) return slot
    return { ...slot, pokemonId: stadioPerLivello(rivaleStarterId ?? 1, slot.livello) }
  })
}
