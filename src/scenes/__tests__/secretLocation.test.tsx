import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocalMap } from '@data/localMaps'
import { SECRET_LOCATION_GYM_IDS } from '@data/secretLocation'
import { CittaScene } from '@scenes/CittaScene'
import { LocalMapScene } from '@scenes/LocalMapScene'
import { MappaPrincipaleScene } from '@scenes/MappaPrincipaleScene'
import { PercorsoScene } from '@scenes/PercorsoScene'
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
const unlock = (id: 1 | 2) => {
  const key = id === 1 ? 'giocatore1' : 'giocatore2'
  useGameStore.setState((s) => ({ [key]: { ...s[key], allenatoriSconfitti: new Set(SECRET_LOCATION_GYM_IDS) } }))
}

describe('interfaccia del passaggio verso la Lega di Roma', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
    useGameStore.setState({ posizione1: world('Roma'), posizione2: world('Roma'), scenaCorrente: { scena: 'citta', payload: { luogo: 'Roma' } } })
  })

  it('nasconde il passaggio a Roma prima dello sblocco personale, anche se l’altro giocatore ha tutte le palestre', () => {
    unlock(2)
    const markup = renderToStaticMarkup(<CittaScene />)
    expect(markup).not.toContain('Verso Lega di Roma')
  })

  it('offre a Roma il passaggio dopo tutte le palestre, indicando il costo di movimento', () => {
    unlock(1)
    const markup = renderToStaticMarkup(<CittaScene />)
    expect(markup).toContain('Verso Lega di Roma · 1 movimento')
  })

  it('non offre il passaggio in un’altra città neppure a un giocatore sbloccato', () => {
    unlock(1)
    useGameStore.setState({ posizione1: world('Venezia'), scenaCorrente: { scena: 'citta', payload: { luogo: 'Venezia' } } })
    expect(renderToStaticMarkup(<CittaScene />)).not.toContain('Verso ')
  })

  it('un payload forzato non mostra attività della Lega prima dello sblocco', () => {
    useGameStore.setState({ posizione1: world('Lega_Roma'), scenaCorrente: { scena: 'percorso', payload: { luogo: 'Lega_Roma' } } })
    const markup = renderToStaticMarkup(<PercorsoScene />)
    expect(markup).toContain('Luogo non disponibile')
    expect(markup).not.toContain('Cespuglio')
    expect(markup).not.toContain('Punti raggiungibili')
  })

  it('protegge anche il componente locale usato direttamente prima dello sblocco', () => {
    useGameStore.setState({ posizione1: world('Lega_Roma') })
    // La Lega non ha ancora una rete di nodi: si simula la mappa futura con una rete esistente.
    const future = { ...getLocalMap('Via_Vittoria_2')!, id: 'Lega_Roma' }
    const markup = renderToStaticMarkup(<LocalMapScene map={future} activities={<p>Contenuto segreto</p>} />)
    expect(markup).not.toContain('Contenuto segreto')
    expect(markup).toContain('Luogo non disponibile')
  })

  it('dopo l’ingresso la mappa principale mostra il luogo in preparazione e il ritorno a Roma, senza cambiare lo stato', () => {
    unlock(1)
    expect(useGameStore.getState().attraversaPassaggioSegreto(1)).toBe(true)
    const before = useGameStore.getState()
    const markup = renderToStaticMarkup(<MappaPrincipaleScene />)
    expect(markup).toContain('Passaggio di ritorno')
    expect(markup).toContain('Lega di Roma')
    expect(markup).toContain('Torna a Roma · 1 movimento')
    expect(markup).toContain('in preparazione')
    expect(markup).not.toContain('Riapri')
    expect(markup).not.toContain('/maps/Mappa-Finale.jpg')
    expect(useGameStore.getState()).toBe(before)
    expect(before.posizione1.luogo).toBe('Lega_Roma')
    expect(before.turnoOverworld.azioniRimaste).toBe(1)
  })

  it('quando l’altro giocatore è sul mondo, l’avatar nella Lega non appare su coordinate inventate', () => {
    unlock(1)
    expect(useGameStore.getState().attraversaPassaggioSegreto(1)).toBe(true)
    useGameStore.getState().passaTurnoOverworld()
    const markup = renderToStaticMarkup(<MappaPrincipaleScene />)
    expect(markup).toContain('/maps/Mappa-Finale.jpg')
    expect(markup).not.toContain('Torna a Roma')
    expect(markup).not.toContain('data-main-map-player="1"')
    expect(markup).toContain('data-main-map-player="2"')
  })
})

describe('interfaccia dei luoghi nascosti dei percorsi e di Via Vittoria', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
    useGameStore.setState({ posizione2: world('Venezia'), scenaCorrente: { scena: 'mappa-principale' } })
  })

  it.each([
    ['Percorso_3', 'Luogo leggendario del Percorso 3'],
    ['Percorso_11', 'Luogo leggendario del Percorso 11'],
  ])('sulla mappa principale %s (senza mappa dipinta) offre il passaggio verso %s senza medaglie', (origin, label) => {
    useGameStore.setState({ posizione1: world(origin) })
    expect(renderToStaticMarkup(<MappaPrincipaleScene />)).toContain(`Verso ${label} · 1 movimento`)
  })

  it.each([
    ['Percorso_9', 'Nascondiglio del Team Towers'],
    ['Percorso_12', 'Luogo leggendario del Percorso 12'],
  ])('nella mappa dipinta di %s il passaggio verso %s sta nella mappa locale', (origin, label) => {
    const map = getLocalMap(origin)!
    useGameStore.setState({ posizione1: world(origin), posizioniLocali1: { [origin]: map.startNode }, scenaCorrente: { scena: 'percorso', payload: { luogo: origin } } })
    expect(renderToStaticMarkup(<MappaPrincipaleScene />)).not.toContain('Verso ')
    expect(renderToStaticMarkup(<PercorsoScene />)).toContain(`Verso ${label} · 1 movimento`)
  })

  it('gli altri luoghi non offrono passaggi', () => {
    useGameStore.setState({ posizione1: world('Percorso_10') })
    expect(renderToStaticMarkup(<MappaPrincipaleScene />)).not.toContain('Verso ')
  })

  it('il Percorso 15 è Via Vittoria, sempre aperto: mappa dipinta senza requisiti di medaglie', () => {
    useGameStore.setState({ posizione1: world('Percorso_15'), scenaCorrente: { scena: 'percorso', payload: { luogo: 'Percorso_15' } } })
    const markup = renderToStaticMarkup(<PercorsoScene />)
    expect(markup).not.toContain('Luogo non disponibile')
    expect(markup).toContain('/maps/Percorso_14.png')
    expect(markup).toContain('Percorso 15 · Via Vittoria')
  })
})
