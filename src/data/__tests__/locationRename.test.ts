import { describe, expect, it } from 'vitest'
import {
  hasLegacyThemeLocations,
  renameLegacyLocalMap,
  renameLegacyLocation,
  renameLegacyRoadKey,
  renameLegacySaveLocations,
} from '@data/locationRename'
import { migrateCatalogPayload } from '@/interactions/interactionStore'
import { initialGameSave, normalizeGameSave, serializeGameState } from '@/save/gamePersistence'
import { SECRET_LOCATION_GYM_IDS } from '@data/secretLocation'
import { useAdminStore } from '@store/adminStore'
import { defaultAdminTheme } from '@/theme/defaultAdminTheme'

const world = (luogo: string) => ({ mappaId: 'mappa-principale', luogo, x: 0, y: 0, direzione: 'S' })

describe('rinomina dei luoghi del 18 novembre 2026', () => {
  it('sposta ogni nome di un passo, una sola volta', () => {
    expect(['Molisnt', 'Percorso_13', 'Percorso_14', 'Percorso_15', 'Roma'].map(renameLegacyLocation))
      .toEqual(['Percorso_13', 'Percorso_14', 'Percorso_15', 'Lega_Roma', 'Roma'])
    // La pittura del vecchio luogo segreto è la seconda mappa di Via Vittoria.
    expect(renameLegacyLocalMap('Percorso_15')).toBe('Via_Vittoria_2')
    expect(renameLegacyRoadKey('Pescara__Percorso_14')).toBe('Pescara__Percorso_15')
    expect(renameLegacyRoadKey('Percorso_12__Molisnt')).toBe('Percorso_12__Percorso_13')
  })

  it('rinomina posizioni, pallini, scene, battaglia e attività di un salvataggio grezzo', () => {
    const raw = {
      posizione1: world('Molisnt'),
      posizione2: { mappaId: 'Percorso_15', x: 1, y: 2, direzione: 'N' },
      posizioniLocali1: { Percorso_13: 'n3', Percorso_15: 'n7', Roma: 'n1' },
      posizioniLocali2: { Percorso_14: 'n9' },
      scenaCorrente: { scena: 'percorso', payload: { luogo: 'Percorso_14' } },
      scenaPrecedente: { scena: 'evoluzione', payload: { luogoRitorno: 'Percorso_13' } },
      battaglia: { luogoRitorno: 'Molisnt' },
      fallbackLocationActivity: { playerId: 1, location: 'Percorso_13' },
      giocatore1: { cespugliVisitati: ['Percorso_13:A'] },
    }
    const next = renameLegacySaveLocations(raw)
    expect(next.posizione1).toEqual(world('Percorso_13'))
    expect(next.posizione2).toEqual({ mappaId: 'Lega_Roma', x: 1, y: 2, direzione: 'N' })
    expect(next.posizioniLocali1).toEqual({ Percorso_14: 'n3', Via_Vittoria_2: 'n7', Roma: 'n1' })
    expect(next.posizioniLocali2).toEqual({ Percorso_15: 'n9' })
    expect(next.scenaCorrente).toEqual({ scena: 'percorso', payload: { luogo: 'Percorso_15' } })
    expect(next.scenaPrecedente).toEqual({ scena: 'evoluzione', payload: { luogoRitorno: 'Percorso_14' } })
    expect(next.battaglia).toEqual({ luogoRitorno: 'Percorso_13' })
    expect(next.fallbackLocationActivity).toEqual({ playerId: 1, location: 'Percorso_14' })
    // I cespugli seguono l'identità dei dati del Database e non si rinominano.
    expect(next.giocatore1).toBe(raw.giocatore1)
    expect(raw.posizione1.luogo).toBe('Molisnt')
  })

  it('un salvataggio della versione 2 viene rinominato senza ripetere la migrazione degli allenatori', () => {
    const save = serializeGameState(initialGameSave()) as Record<string, any>
    save.dataVersion = 2
    save.posizione1 = world('Percorso_14')
    save.posizione2 = world('Molisnt')
    save.posizioniLocali1 = { Percorso_14: 'n12' }
    save.giocatore1.allenatoriSconfitti = [203, 220]
    save.giocatore1.inventario = { potion: 1 }
    const { state, warnings } = normalizeGameSave(save)
    expect(state.posizione1.luogo).toBe('Percorso_15')
    expect(state.posizione2.luogo).toBe('Percorso_13')
    expect(state.posizioniLocali1).toEqual({ Percorso_15: 'n12' })
    expect([...state.giocatore1.allenatoriSconfitti]).toEqual([203, 220])
    expect(state.giocatore1.inventario).toEqual({ potion: 1 })
    expect(warnings.join(' ')).not.toContain('Database')
    // Il salvataggio successivo è già della versione 3: una seconda lettura non sposta più nulla.
    const again = normalizeGameSave(serializeGameState(state))
    expect(again.state.posizione1.luogo).toBe('Percorso_15')
    expect(again.state.posizione2.luogo).toBe('Percorso_13')
  })

  it('il vecchio luogo segreto diventa la Lega: chi aveva le medaglie vi resta, gli altri tornano a Roma', () => {
    const save = serializeGameState(initialGameSave()) as Record<string, any>
    save.dataVersion = 2
    save.posizione1 = world('Percorso_15')
    save.posizione2 = world('Percorso_15')
    save.giocatore1.allenatoriSconfitti = [...SECRET_LOCATION_GYM_IDS]
    const { state } = normalizeGameSave(save)
    expect(state.posizione1.luogo).toBe('Lega_Roma')
    expect(state.posizione2.luogo).toBe('Roma')
  })

  it('le interazioni dei cataloghi precedenti seguono la mappa dipinta rinominata, una volta sola', () => {
    const entry = (mapId: string) => ({ id: `i-${mapId}`, mapId, nodeId: 'n1', action: { type: 'dialogue' }, requirements: { gymIds: [] } })
    const migrated = migrateCatalogPayload({ version: 1, dataVersion: 2, interactions: [entry('Percorso_13'), entry('Percorso_15'), entry('Roma')] }) as { dataVersion: number; interactions: { mapId: string }[] }
    expect(migrated.dataVersion).toBe(3)
    expect(migrated.interactions.map((item) => item.mapId)).toEqual(['Percorso_14', 'Via_Vittoria_2', 'Roma'])
    const again = migrateCatalogPayload(migrated) as { interactions: { mapId: string }[] }
    expect(again.interactions.map((item) => item.mapId)).toEqual(['Percorso_14', 'Via_Vittoria_2', 'Roma'])
  })

  it('il tema Admin salvato con i vecchi nomi sposta nodi e strade; quello nuovo resta invariato', () => {
    const oldNodes = { Molisnt: { x: 61, y: 43 }, Percorso_13: { x: 58, y: 48 }, Percorso_14: { x: 51, y: 40 }, Roma: { x: 51, y: 48 } }
    const oldRoads = { Grosseto__Percorso_14: [{ x: 41, y: 40 }], Percorso_14__Roma: [{ x: 51, y: 44 }] }
    expect(hasLegacyThemeLocations(oldNodes, oldRoads)).toBe(true)
    useAdminStore.getState().importTheme({ ...defaultAdminTheme, layouts: { ...defaultAdminTheme.layouts, mainMapNodes: oldNodes, mainMapRoads: oldRoads } })
    const layouts = useAdminStore.getState().theme.layouts
    expect(layouts.mainMapNodes.Percorso_13).toEqual({ x: 61, y: 43 })
    expect(layouts.mainMapNodes.Percorso_14).toEqual({ x: 58, y: 48 })
    expect(layouts.mainMapNodes.Percorso_15).toEqual({ x: 51, y: 40 })
    expect(layouts.mainMapNodes).not.toHaveProperty('Molisnt')
    expect(layouts.mainMapRoads.Grosseto__Percorso_15).toEqual([{ x: 41, y: 40 }])
    expect(layouts.mainMapRoads.Percorso_15__Roma).toEqual([{ x: 51, y: 44 }])
    expect(layouts).not.toHaveProperty('mapGrid')
    expect(hasLegacyThemeLocations(layouts.mainMapNodes, layouts.mainMapRoads)).toBe(false)
    useAdminStore.getState().importTheme(useAdminStore.getState().theme)
    expect(useAdminStore.getState().theme.layouts.mainMapNodes.Percorso_13).toEqual({ x: 61, y: 43 })
  })
})
