import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getLocalMap, LOCAL_MAPS, type LocalMapDefinition } from '@data/localMaps'
import { LocalMapBoard } from '../LocalMapBoard'
import { VENEZIA_REFERENCE_NODES } from '@data/__tests__/fixtures/veneziaReference'

function renderMap(map: LocalMapDefinition) {
  return renderToStaticMarkup(
    <LocalMapBoard
      map={map}
      players={[{ id: 1, name: 'Alice', nodeId: map.startNode }, { id: 2, name: 'Bruno', nodeId: map.startNode }]}
      activePlayerId={1} remainingActions={2} canMove
      onMove={() => true} onSelectNode={() => undefined}
    />,
  )
}

function visibleNumbers(markup: string) {
  return [...markup.matchAll(/<button\b[^>]*data-local-map-node="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)]
    .flatMap((match) => {
      const number = match[2].match(/<span\b[^>]*class="local-map-node-number"[^>]*>(\d+)<\/span>/)
      return number ? [{ id: match[1], number: Number(number[1]) }] : []
    })
}

describe('LocalMapBoard - numeri concordati di Venezia', () => {
  it('mostra tutti i 57 numeri della foto sopra i pallini fisici giusti', () => {
    const markup = renderMap(getLocalMap('Venezia')!)
    const numbers = visibleNumbers(markup).sort((a, b) => a.number - b.number)
    expect(numbers).toEqual(VENEZIA_REFERENCE_NODES.map(([number, id]) => ({ id, number })))
    expect(markup.match(/class="local-map-node-number" aria-hidden="true"/g)).toHaveLength(57)
    expect(markup).toContain('aria-label="Punto 29, posizione attuale; mostra interazione"')
  })

  it('ricava i numeri dalle label anche se i nodi sono riordinati, senza usare ID o indice', () => {
    const map = getLocalMap('Venezia')!
    const markup = renderMap({ ...map, nodes: [...map.nodes].reverse() })
    expect(visibleNumbers(markup).sort((a, b) => a.number - b.number))
      .toEqual(VENEZIA_REFERENCE_NODES.map(([number, id]) => ({ id, number })))
  })

  it('rispetta il flag disattivato conservando le etichette accessibili dei pallini', () => {
    const markup = renderMap({ ...getLocalMap('Venezia')!, showNodeNumbers: false })
    expect(visibleNumbers(markup)).toEqual([])
    expect(markup).toContain('aria-label="Punto 29, posizione attuale; mostra interazione"')
  })

  it.each(Object.values(LOCAL_MAPS).filter((map) => map.id !== 'Venezia'))(
    '$id: conserva i pallini senza introdurre numeri visibili non concordati', (map) => {
      const markup = renderMap(map)
      expect(visibleNumbers(markup)).toEqual([])
      expect(markup.match(/data-local-map-node="/g)).toHaveLength(map.nodes.length)
    },
  )
})
