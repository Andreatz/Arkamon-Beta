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

  it('updateSpriteScale salva e ripristina la scala della singola specie', () => {
    useAdminStore.getState().updateSpriteScale(12, 1.45)
    expect(useAdminStore.getState().theme.spriteScales['12']).toBe(1.45)

    useAdminStore.getState().updateSpriteScale(12, 1)
    expect(useAdminStore.getState().theme.spriteScales['12']).toBeUndefined()
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

  it('updateBattleLayout conserva gli offset dei singoli testi', () => {
    useAdminStore.getState().updateBattleLayout('playerMoves', {
      x: 46,
      y: 70,
      w: 50,
      h: 24,
      contentOffsets: {
        'move-0-name': { x: 12, y: -8 },
        'move-1-dice': { x: -5, y: 15 },
      },
    })

    expect(useAdminStore.getState().theme.layouts.battle.playerMoves.contentOffsets).toEqual({
      'move-0-name': { x: 12, y: -8 },
      'move-1-dice': { x: -5, y: 15 },
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

  it('updateMainMapRoad salva solo gli hook senza generare nodi automatici', () => {
    useAdminStore.getState().updateMainMapRoad('Venezia__Pordenone', [
      { x: 56, y: 24 },
      { x: 64, y: 20 },
    ])

    expect(useAdminStore.getState().theme.layouts.mainMapRoads.Venezia__Pordenone).toEqual([
      { x: 56, y: 24 },
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
      { x: 51, y: 56 },
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

  it('updateSceneLayout aggiorna il layout condiviso da tutti i percorsi', () => {
    useAdminStore.getState().updateSceneLayout({
      scene: 'luogo',
      key: 'contentGrid',
      rect: { x: 8, y: 24, w: 84, h: 66 },
    })

    expect(useAdminStore.getState().theme.layouts.luogo.contentGrid).toEqual({
      x: 8,
      y: 24,
      w: 84,
      h: 66,
    })
  })

  it('resetSceneLayout ripristina il layout condiviso da percorsi e citta', () => {
    useAdminStore.getState().updateSceneLayout({
      scene: 'luogo',
      key: 'contentGrid',
      rect: { x: 10, y: 20, w: 80, h: 72 },
    })

    useAdminStore.getState().resetSceneLayout('luogo')

    expect(useAdminStore.getState().theme.layouts.luogo.contentGrid).toEqual(
      defaultAdminTheme.layouts.luogo.contentGrid
    )
  })

  it('resetTheme ripristina Arkamon Classico', () => {
    useAdminStore.getState().updateColor('bg', '#ffffff')
    useAdminStore.getState().updateUi('stageScale', 0.8)

    useAdminStore.getState().resetTheme()

    expect(useAdminStore.getState().theme).toEqual(defaultAdminTheme)
  })

  it('applyVisualTheme cambia lo stile senza sovrascrivere i layout', () => {
    useAdminStore.getState().updateMainMapNodePosition('Roma', { x: 51, y: 57 })
    useAdminStore.getState().updateBattleLayout('playerSprite', {
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    })

    const preset: AdminTheme = {
      ...defaultAdminTheme,
      id: 'preset-test',
      name: 'Preset Test',
      colors: {
        ...defaultAdminTheme.colors,
        primary: '#123456',
      },
      ui: {
        ...defaultAdminTheme.ui,
        buttonRadius: 6,
      },
    }

    useAdminStore.getState().applyVisualTheme(preset)

    const theme = useAdminStore.getState().theme
    expect(theme.colors.primary).toBe('#123456')
    expect(theme.ui.buttonRadius).toBe(6)
    expect(theme.layouts.mainMapNodes.Roma).toEqual({ x: 51, y: 57 })
    expect(theme.layouts.battle.playerSprite).toEqual({
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    })
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
