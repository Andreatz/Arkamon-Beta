/** Movimento lungo i collegamenti delle mappe locali. Coordinate espresse in percentuale. */
import type { LocalMapDefinition, LocalMapNode, LocalMapPoint } from '@data/localMaps'

/** Un riferimento salvato non più presente nel disegno torna al punto d'ingresso. */
export function getLocalMapNode(map: LocalMapDefinition, nodeId?: string): LocalMapNode {
  const node = map.nodes.find((candidate) => candidate.id === nodeId)
    ?? map.nodes.find((candidate) => candidate.id === map.startNode)
  if (!node) throw new Error(`La mappa ${map.id} non ha un punto d'ingresso valido.`)
  return node
}

/** Le strade sono percorribili in entrambe le direzioni; non si possono saltare pallini. */
export function getAdjacentLocalMapNodes(map: LocalMapDefinition, nodeId: string): string[] {
  if (!map.nodes.some((node) => node.id === nodeId)) return []
  const adjacent = new Set<string>()
  for (const road of map.roads) {
    const destination = road.from === nodeId ? road.to : road.to === nodeId ? road.from : undefined
    if (destination && destination !== nodeId && map.nodes.some((node) => node.id === destination)) {
      adjacent.add(destination)
    }
  }
  return [...adjacent]
}

/**
 * Pallini raggiungibili con un movimento. `range` 1 = solo adiacenti; 2 = Bicicletta nei percorsi
 * o Monopattino nelle città (si attraversa un pallino intermedio senza fermarsi).
 */
export function getReachableLocalMapNodes(map: LocalMapDefinition, from: string, range = 1): string[] {
  const distance = localDistances(map, from, range)
  distance.delete(from)
  return [...distance.keys()]
}

function localDistances(map: LocalMapDefinition, from: string, range: number): Map<string, { steps: number; via?: string }> {
  const seen = new Map<string, { steps: number; via?: string }>([[from, { steps: 0 }]])
  let frontier = [from]
  for (let step = 1; step <= range; step++) {
    const next: string[] = []
    for (const node of frontier) {
      for (const adjacent of getAdjacentLocalMapNodes(map, node)) {
        if (seen.has(adjacent)) continue
        seen.set(adjacent, { steps: step, via: node })
        next.push(adjacent)
      }
    }
    frontier = next
  }
  return seen
}

export function canMoveOnLocalMap(map: LocalMapDefinition, from: string, to: string, range = 1): boolean {
  return to !== from && getReachableLocalMapNodes(map, from, range).includes(to)
}

/** Il percorso grafico comprende gli estremi e segue le curve anche percorrendolo al contrario. */
export function getLocalRoadPath(map: LocalMapDefinition, from: string, to: string): LocalMapPoint[] {
  if (!canMoveOnLocalMap(map, from, to)) return []
  const origin = getLocalMapNode(map, from)
  const destination = getLocalMapNode(map, to)
  const road = map.roads.find((candidate) =>
    (candidate.from === from && candidate.to === to) || (candidate.from === to && candidate.to === from))!
  const intermediates = road.from === from ? road.points ?? [] : [...(road.points ?? [])].reverse()
  return [origin, ...intermediates, destination].map(({ x, y }) => ({ x, y }))
}

/** Percorso grafico di un movimento: diretto, oppure attraverso un pallino intermedio con un veicolo. */
export function getLocalTravelPath(map: LocalMapDefinition, from: string, to: string, range = 1): LocalMapPoint[] {
  const direct = getLocalRoadPath(map, from, to)
  if (direct.length || range < 2) return direct
  const via = localDistances(map, from, 2).get(to)?.via
  if (!via || via === from) return []
  const first = getLocalRoadPath(map, from, via)
  const second = getLocalRoadPath(map, via, to)
  return first.length && second.length ? [...first, ...second.slice(1)] : []
}
