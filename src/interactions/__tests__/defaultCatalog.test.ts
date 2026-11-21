import { describe, expect, it } from 'vitest'
import { validateCatalog } from '../schema'
import { defaultInteractionCatalog, mergeDefaultInteractions } from '../defaultCatalog'
import { newInteractionDefinition } from '../types'

describe('catalogo di base (audit fase 8)', () => {
  const catalog = defaultInteractionCatalog()

  it('è un catalogo valido con un’attività per pallino', () => {
    expect(validateCatalog({ version: 1, interactions: catalog }).error).toBeUndefined()
    expect(new Set(catalog.map((entry) => `${entry.mapId}/${entry.nodeId}`)).size).toBe(catalog.length)
  })

  it('copre accoglienza, Arkastore, cura, due allenatori e Capopalestra a Venezia', () => {
    const venezia = catalog.filter((entry) => entry.mapId === 'Venezia').map((entry) => entry.action)
    expect(venezia.filter((action) => action.kind === 'dialogue')).toHaveLength(1)
    expect(venezia.filter((action) => action.kind === 'shop')).toHaveLength(1)
    expect(venezia.filter((action) => action.kind === 'heal')).toHaveLength(1)
    expect(venezia.filter((action) => action.kind === 'trainer').map((action) => action.kind === 'trainer' && action.trainerId).sort()).toEqual([201, 202, 203])
  })

  it('mette tre cespugli e due allenatori sul Percorso 1, con il cartello all’ingresso', () => {
    const route = catalog.filter((entry) => entry.mapId === 'Percorso_1')
    expect(route.filter((entry) => entry.action.kind === 'bush')).toHaveLength(3)
    expect(route.filter((entry) => entry.action.kind === 'trainer')).toHaveLength(2)
    expect(route.find((entry) => entry.action.kind === 'dialogue')?.nodeId).toBe('n11')
  })

  it('non sovrascrive le interazioni del GM e non duplica le voci già installate', () => {
    const gm = { ...newInteractionDefinition('Venezia', 'n52', 'gm-infermeria'), title: 'Infermeria del GM' }
    const merged = mergeDefaultInteractions([gm])
    expect(merged[0]).toBe(gm)
    expect(merged.some((entry) => entry.id === 'base-venezia-infermeria')).toBe(false)
    expect(merged).toHaveLength(catalog.length)
    expect(mergeDefaultInteractions(merged)).toHaveLength(merged.length)
  })
})
