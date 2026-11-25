import type { OggettoId } from '@/types'

export type InteractionScope = 'player' | 'shared'
export interface InteractionRequirements {
  gymIds: number[]
  minLevel: number
  minCoins: number
  items: Partial<Record<OggettoId, number>>
  completedInteractions: string[]
}
export interface InteractionResources {
  coins: number
  items: Partial<Record<OggettoId, number>>
}
export type InteractionAction =
  | { kind: 'dialogue' }
  | { kind: 'heal' }
  | { kind: 'shop' }
  | { kind: 'trainer'; trainerId: number }
  | { kind: 'bush'; bush: string }
  | { kind: 'encounter'; speciesId: number; level: number }
export interface InteractionDefinition {
  id: string
  mapId: string
  nodeId: string
  title: string
  dialogue: string
  scope: InteractionScope
  enabled: boolean
  repeatable: boolean
  requirements: InteractionRequirements
  cost: InteractionResources
  reward: InteractionResources
  action: InteractionAction
}
/** Mappa principale come destinazione di un blocco stradale (le strade fra luoghi). */
export const MAIN_MAP_BLOCK_ID = 'mappa-principale'
/** Condizioni di riapertura: tutte quelle indicate devono essere soddisfatte dal giocatore. Nessuna = chiusura permanente. */
export interface RoadBlockUnlock {
  /** Il giocatore ha vinto la Lega. */
  league: boolean
  gymIds: number[]
  completedInteractions: string[]
}
/**
 * Strada bloccata (24 novembre 2026). Sulla mappa principale `roads` collega due luoghi; nelle mappe
 * locali collega due pallini e `nodes` elenca i pallini in cui non si può entrare.
 */
export interface RoadBlockDefinition {
  id: string
  mapId: string
  title: string
  message: string
  enabled: boolean
  roads: [string, string][]
  nodes: string[]
  unlock: RoadBlockUnlock
}
export interface InteractionCatalog {
  version: 1
  interactions: InteractionDefinition[]
  roadBlocks?: RoadBlockDefinition[]
  /** Versione dei dati del gioco (rinomine dei luoghi): evita migrazioni ripetute. */
  dataVersion?: number
  /** Revisione dei contenuti del gioco già ricevuti dal catalogo. */
  builtInRevision?: number
}
export interface InteractionLogEntry {
  interactionId: string
  title: string
  mapId: string
  nodeId: string
  message: string
}
export interface PendingInteractionBattle {
  interactionId: string
  playerId: 1 | 2
  title: string
  mapId: string
  nodeId: string
  scope: InteractionScope
  reward: InteractionResources
}
export interface InteractionProgress {
  completed1: string[]
  completed2: string[]
  completedShared: string[]
  log1: InteractionLogEntry[]
  log2: InteractionLogEntry[]
  pendingBattle: PendingInteractionBattle | null
}
export function emptyInteractionProgress(): InteractionProgress {
  return { completed1: [], completed2: [], completedShared: [], log1: [], log2: [], pendingBattle: null }
}
export function newInteractionDefinition(mapId: string, nodeId: string, id: string): InteractionDefinition {
  return {
    id, mapId, nodeId, title: '', dialogue: '', scope: 'player', enabled: true, repeatable: false,
    requirements: { gymIds: [], minLevel: 0, minCoins: 0, items: {}, completedInteractions: [] },
    cost: { coins: 0, items: {} }, reward: { coins: 0, items: {} }, action: { kind: 'dialogue' },
  }
}
export function newRoadBlockDefinition(mapId: string, id: string): RoadBlockDefinition {
  return { id, mapId, title: '', message: '', enabled: true, roads: [], nodes: [], unlock: { league: false, gymIds: [], completedInteractions: [] } }
}
