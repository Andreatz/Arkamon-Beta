import type { LocalMapDefinition, LocalMapNode, LocalMapPoint, LocalMapRoad } from './types'

/**
 * Formato compatto delle reti di pallini (budget di avvio del 23 novembre 2026): le stesse
 * coordinate percentuali, scritte come testo invece che come oggetti letterali.
 *
 * - `nodes`: voci separate da `|`, ciascuna `id,x,y,numero` più `,*` se il componente deve
 *   disegnare il pallino assente nel PNG. Il numero diventa l'etichetta «Punto N».
 * - `roads`: voci separate da `|`, ciascuna `da,a` seguita dalle coppie x,y dei vertici interni.
 */
export interface CompactLocalMap {
  id: string
  image: string
  startNode: string
  nodes: string
  roads: string
}

function points(values: string[]): LocalMapPoint[] {
  const out: LocalMapPoint[] = []
  for (let index = 0; index + 1 < values.length; index += 2) out.push({ x: Number(values[index]), y: Number(values[index + 1]) })
  return out
}

export function decodeLocalMap(compact: CompactLocalMap): LocalMapDefinition {
  const nodes: LocalMapNode[] = compact.nodes.split('|').map((entry) => {
    const [id, x, y, number, marker] = entry.split(',')
    const node: LocalMapNode = { id, x: Number(x), y: Number(y) }
    if (number) node.label = `Punto ${number}`
    if (marker === '*') node.drawMarker = true
    return node
  })
  const roads: LocalMapRoad[] = compact.roads.split('|').map((entry) => {
    const [from, to, ...rest] = entry.split(',')
    return rest.length ? { from, to, points: points(rest) } : { from, to }
  })
  return { id: compact.id, image: compact.image, nodes, roads, startNode: compact.startNode }
}
