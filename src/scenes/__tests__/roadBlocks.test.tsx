import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocalMap } from '@data/localMaps'
import { CittaScene } from '@scenes/CittaScene'
import { MappaPrincipaleScene } from '@scenes/MappaPrincipaleScene'
import { useGameStore } from '@store/gameStore'

vi.mock('@store/gameStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@store/gameStore')>()
  return {
    ...actual,
    useGameStore: Object.assign(
      (selector: (state: ReturnType<typeof actual.useGameStore.getState>) => unknown) => selector(actual.useGameStore.getState()),
      actual.useGameStore,
    ),
  }
})

const world = (luogo: string) => ({ mappaId: 'mappa-principale', luogo, x: 0, y: 0, direzione: 'S' as const })
const winLeague = () => useGameStore.setState((s) => ({ league: { ...s.league, players: { ...s.league.players, 1: { ...s.league.players[1], status: 'completed' } } } }))

describe('interfaccia delle strade bloccate', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
    useGameStore.setState({ posizione1: world('Civitavecchia'), posizione2: world('Venezia'), scenaCorrente: { scena: 'mappa-principale' } })
  })

  it('la mappa principale disegna la linea chiusa verso Roma finché il giocatore non vince la Lega', () => {
    const closed = renderToStaticMarkup(<MappaPrincipaleScene />)
    expect(closed).toContain('world-map-road-closed')
    expect(closed).toContain('Strada chiusa per lavori')
    winLeague()
    expect(renderToStaticMarkup(<MappaPrincipaleScene />)).not.toContain('Strada chiusa per lavori')
  })

  it('la mappa locale di Civitavecchia mostra i pallini della pista ciclabile chiusi', () => {
    const map = getLocalMap('Civitavecchia')!
    useGameStore.setState({ posizioniLocali1: { Civitavecchia: map.startNode }, scenaCorrente: { scena: 'citta', payload: { luogo: 'Civitavecchia' } } })
    const markup = renderToStaticMarkup(<CittaScene />)
    expect(markup.match(/local-map-node--closed/g)?.length).toBe(2)
    expect(markup).toContain('chiuso: Strada chiusa per lavori')
    winLeague()
    expect(renderToStaticMarkup(<CittaScene />)).not.toContain('local-map-node--closed')
  })
})
