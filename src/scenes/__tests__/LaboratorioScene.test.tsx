import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LaboratorioScene } from '@scenes/LaboratorioScene'
import { TitoloScene } from '@scenes/TitoloScene'
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

function starterButtons(markup: string): string[] {
  return [...markup.matchAll(/<button\b[^>]*>.*?<\/button>/g)].map(([button]) => button)
}

describe('laboratorio al rientro', () => {
  beforeEach(() => useGameStore.getState().reset())

  it('ricostruisce gli starter disponibili dal salvataggio del primo giocatore', () => {
    useGameStore.getState().scegliStarter(1)
    const buttons = starterButtons(renderToStaticMarkup(<LaboratorioScene />))
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toContain('disabled=""')
    expect(buttons[1]).not.toContain('disabled=""')
    expect(buttons[2]).not.toContain('disabled=""')
  })

  it('disabilita ogni starter durante l’attesa prima della mappa', () => {
    useGameStore.getState().scegliStarter(1)
    useGameStore.getState().scegliStarter(5)
    const buttons = starterButtons(renderToStaticMarkup(<LaboratorioScene />))
    expect(buttons).toHaveLength(3)
    expect(buttons.every((button) => button.includes('disabled=""'))).toBe(true)
  })

  it('mostra Continua anche con una scelta parziale salvata', () => {
    useGameStore.getState().scegliStarter(1)
    expect(renderToStaticMarkup(<TitoloScene />)).toContain('Continua')
  })
})
