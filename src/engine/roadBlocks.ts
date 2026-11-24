/**
 * Strade bloccate (24 novembre 2026): logica pura. Un blocco attivo toglie strade alla mappa
 * principale o a una mappa locale finché il giocatore non soddisfa le condizioni di riapertura.
 */
import type { LocalMapDefinition } from '@data/localMaps'
import type { RoadBlockDefinition } from '@/interactions/types'

export interface RoadBlockContext {
  gymIds: ReadonlySet<number>
  leagueWon: boolean
  isCompleted: (interactionId: string) => boolean
}

export const roadKey = (a: string, b: string) => a < b ? `${a}|${b}` : `${b}|${a}`

/** Senza condizioni il blocco è permanente (finché la regia non lo disattiva). */
export function isRoadBlockActive(block: RoadBlockDefinition, context: RoadBlockContext): boolean {
  if (!block.enabled) return false
  const unlock = block.unlock
  if (!unlock.league && !unlock.gymIds.length && !unlock.completedInteractions.length) return true
  const open = (!unlock.league || context.leagueWon)
    && unlock.gymIds.every((id) => context.gymIds.has(id))
    && unlock.completedInteractions.every((id) => context.isCompleted(id))
  return !open
}

/** Il primo blocco attivo che chiude la strada fra due luoghi della mappa principale. */
export function mainRoadBlock(blocks: readonly RoadBlockDefinition[], context: RoadBlockContext, from: string, to: string, mainMapId: string): RoadBlockDefinition | undefined {
  const key = roadKey(from, to)
  return blocks.find((block) => block.mapId === mainMapId && block.roads.some(([a, b]) => roadKey(a, b) === key) && isRoadBlockActive(block, context))
}

export interface LocalRoadBlocks {
  roads: Set<string>
  nodes: Set<string>
  active: RoadBlockDefinition[]
}

export function localRoadBlocks(blocks: readonly RoadBlockDefinition[], context: RoadBlockContext, mapId: string): LocalRoadBlocks {
  const active = blocks.filter((block) => block.mapId === mapId && isRoadBlockActive(block, context))
  return {
    roads: new Set(active.flatMap((block) => block.roads.map(([a, b]) => roadKey(a, b)))),
    nodes: new Set(active.flatMap((block) => block.nodes)),
    active,
  }
}

/** Una strada è chiusa se è bloccata o porta in un pallino chiuso (diverso da quello in cui si trova il giocatore). */
export function isLocalRoadClosed(blocked: LocalRoadBlocks, from: string, to: string, current?: string): boolean {
  if (blocked.roads.has(roadKey(from, to))) return true
  return (blocked.nodes.has(from) && from !== current) || (blocked.nodes.has(to) && to !== current)
}

/** La mappa percorribile dal giocatore: le strade chiuse spariscono, il disegno resta invariato. */
export function applyLocalRoadBlocks(map: LocalMapDefinition, blocked: LocalRoadBlocks, current?: string): LocalMapDefinition {
  if (!blocked.roads.size && !blocked.nodes.size) return map
  return { ...map, roads: map.roads.filter((road) => !isLocalRoadClosed(blocked, road.from, road.to, current)) }
}

/** Il blocco che spiega perché un pallino adiacente nel disegno non è raggiungibile. */
export function localBlockFor(blocked: LocalRoadBlocks, from: string, to: string): RoadBlockDefinition | undefined {
  const key = roadKey(from, to)
  return blocked.active.find((block) => block.roads.some(([a, b]) => roadKey(a, b) === key) || block.nodes.includes(to))
}
