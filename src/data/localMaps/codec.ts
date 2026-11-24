import type { LocalMapDefinition, LocalMapNode, LocalMapPoint, LocalMapRoad } from './types'

/**
 * Formato compatto delle reti di pallini (budget di avvio del 23–24 novembre 2026): le stesse
 * coordinate percentuali, scritte come testo invece che come oggetti letterali.
 *
 * - Gli identificatori dei pallini sono scritti senza la «n» iniziale: `12` è il pallino `n12`.
 * - Le coordinate sono millesimi di punto percentuale: `17171` è `17.171`.
 * - `nodes`: voci separate da `|`, ciascuna `id,x,y` più, se diverso dall'id, il numero
 *   dell'etichetta «Punto N», e `,*` se il componente deve disegnare il pallino assente nel PNG
 *   (con l'etichetta uguale all'id si scrive `id,x,y,,*`).
 * - `roads`: voci separate da `|`, ciascuna `da,a` seguita dalle coppie x,y dei vertici interni.
 */
export interface CompactLocalMap {
  id: string
  image: string
  startNode: string
  nodes: string
  roads: string
}

const coordinate = (value: string) => Number(value) / 1000

function points(values: string[]): LocalMapPoint[] {
  const out: LocalMapPoint[] = []
  for (let index = 0; index + 1 < values.length; index += 2) out.push({ x: coordinate(values[index]), y: coordinate(values[index + 1]) })
  return out
}

export function decodeLocalMap(compact: CompactLocalMap): LocalMapDefinition {
  const nodes: LocalMapNode[] = compact.nodes.split('|').map((entry) => {
    const [id, x, y, number, marker] = entry.split(',')
    const node: LocalMapNode = { id: `n${id}`, x: coordinate(x), y: coordinate(y), label: `Punto ${number || id}` }
    if (marker === '*') node.drawMarker = true
    return node
  })
  const roads: LocalMapRoad[] = compact.roads.split('|').map((entry) => {
    const [from, to, ...rest] = entry.split(',')
    return rest.length ? { from: `n${from}`, to: `n${to}`, points: points(rest) } : { from: `n${from}`, to: `n${to}` }
  })
  return { id: compact.id, image: compact.image, nodes, roads, startNode: compact.startNode }
}
