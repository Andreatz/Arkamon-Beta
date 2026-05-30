import { beforeEach, describe, expect, it } from 'vitest'
import { useAdminStore } from '@store/adminStore'
import type { AdminTheme } from '@/theme/adminThemeTypes'
import { cloneAdminTheme, defaultAdminTheme } from '@/theme/defaultAdminTheme'

function resetAdminStore(): void {
  useAdminStore.setState({
    enabled: false,
    panelOpen: false,
    layoutEditing: false,
    layoutUndoStack: [],
    theme: cloneAdminTheme(defaultAdminTheme),
  })
}

describe('adminStore', () => {
  beforeEach(() => {
    resetAdminStore()
  })

  it('usa il tema default', () => {
    expect(useAdminStore.getState().theme).toEqual(defaultAdminTheme)
  })

  it('updateColor aggiorna solo il colore richiesto', () => {
    useAdminStore.getState().updateColor('primary', '#ffffff')

    const theme = useAdminStore.getState().theme
    expect(theme.colors.primary).toBe('#ffffff')
    expect(theme.colors.bg).toBe(defaultAdminTheme.colors.bg)
  })

  it('updateUi aggiorna solo il valore UI richiesto', () => {
    useAdminStore.getState().updateUi('panelRadius', 24)

    const theme = useAdminStore.getState().theme
    expect(theme.ui.panelRadius).toBe(24)
    expect(theme.ui.buttonRadius).toBe(defaultAdminTheme.ui.buttonRadius)
  })

  it('updateAsset aggiorna il path richiesto', () => {
    useAdminStore.getState().updateAsset('titleLogo', '/ui/logo_arkamon.png')

    expect(useAdminStore.getState().theme.assets.titleLogo).toBe('/ui/logo_arkamon.png')
  })

  it('updateBattleLayout aggiorna la posizione richiesta', () => {
    useAdminStore.getState().updateBattleLayout('playerSprite', {
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    })

    expect(useAdminStore.getState().theme.layouts.battle.playerSprite).toEqual({
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    })
  })

  it('updateMainMapNodePosition aggiorna un nodo della mappa principale', () => {
    useAdminStore.getState().updateMainMapNodePosition('Roma', { x: 51, y: 57 })

    expect(useAdminStore.getState().theme.layouts.mainMapNodes.Roma).toEqual({
      x: 51,
      y: 57,
    })
  })

  it('updateMainMapRoad aggiorna i punti di una strada della mappa principale', () => {
    useAdminStore.getState().updateMainMapRoad('Roma__Percorso_14', [
      { x: 48, y: 56 },
      { x: 51, y: 56 },
      { x: 51, y: 54 },
      { x: 54, y: 54 },
    ])

    expect(useAdminStore.getState().theme.layouts.mainMapRoads.Roma__Percorso_14).toEqual([
      { x: 48, y: 56 },
      { x: 51, y: 56 },
      { x: 51, y: 54 },
      { x: 54, y: 54 },
    ])
  })

  it('updateMainMapRoad raddrizza le strade diagonali ad angoli di 90 gradi', () => {
    useAdminStore.getState().updateMainMapRoad('Venezia__Pordenone', [
      { x: 56, y: 24 },
      { x: 64, y: 20 },
    ])

    expect(useAdminStore.getState().theme.layouts.mainMapRoads.Venezia__Pordenone).toEqual([
      { x: 56, y: 24 },
      { x: 64, y: 24 },
      { x: 64, y: 20 },
    ])
  })

  it('undoLayoutChange ripristina l ultima modifica di layout', () => {
    useAdminStore.getState().beginLayoutChange()
    useAdminStore.getState().updateMainMapNodePosition('Roma', { x: 51, y: 57 })

    useAdminStore.getState().undoLayoutChange()

    expect(useAdminStore.getState().theme.layouts.mainMapNodes.Roma).toEqual(
      defaultAdminTheme.layouts.mainMapNodes.Roma
    )
    expect(useAdminStore.getState().layoutUndoStack).toHaveLength(0)
  })

  it('undoLayoutChange ripristina anche un reset layout', () => {
    useAdminStore.getState().updateMainMapRoad('Roma__Percorso_14', [
      { x: 48, y: 56 },
      { x: 51, y: 56 },
      { x: 54, y: 54 },
    ])

    useAdminStore.getState().resetMainMapRoads()
    expect(useAdminStore.getState().theme.layouts.mainMapRoads).toEqual({})

    useAdminStore.getState().undoLayoutChange()

    expect(useAdminStore.getState().theme.layouts.mainMapRoads.Roma__Percorso_14).toEqual([
      { x: 48, y: 56 },
      { x: 54, y: 56 },
      { x: 54, y: 54 },
    ])
  })

  it('resetSceneLayout ripristina il layout UI della mappa principale', () => {
    useAdminStore.getState().updateSceneLayout({
      scene: 'mainMapUi',
      key: 'turnPanel',
      rect: { x: 5, y: 6, w: 20, h: 7 },
    })

    useAdminStore.getState().resetSceneLayout('mainMapUi')

    expect(useAdminStore.getState().theme.layouts.mainMapUi.turnPanel).toEqual(
      defaultAdminTheme.layouts.mainMapUi.turnPanel
    )
  })

  it('resetTheme ripristina Arkamon Classico', () => {
    useAdminStore.getState().updateColor('bg', '#ffffff')
    useAdminStore.getState().updateUi('stageScale', 0.8)

    useAdminStore.getState().resetTheme()

    expect(useAdminStore.getState().theme).toEqual(defaultAdminTheme)
  })

  it('importTheme sostituisce il tema corrente', () => {
    const imported: AdminTheme = {
      ...defaultAdminTheme,
      id: 'tema-test',
      name: 'Tema Test',
      colors: {
        ...defaultAdminTheme.colors,
        primary: '#123456',
      },
      ui: {
        ...defaultAdminTheme.ui,
        buttonRadius: 6,
      },
    }

    useAdminStore.getState().importTheme(imported)

    expect(useAdminStore.getState().theme).toEqual(imported)
  })
})
