import { describe, expect, it } from 'vitest'
import { getLocalMap } from '@data/localMaps'
import { getReachableLocalMapNodes } from '@/engine/localMapMovement'
import { applyLocalRoadBlocks, localRoadBlocks } from '@/engine/roadBlocks'
import { BUILT_IN_INTERACTIONS, BUILT_IN_REVISION, BUILT_IN_ROAD_BLOCKS, withBuiltInContent } from './builtInCatalog'
import { validateCatalog } from './schema'
import type { InteractionDefinition, RoadBlockDefinition } from './types'

const closedContext = { gymIds: new Set<number>(), leagueWon: false, isCompleted: () => false }

describe('contenuti del gioco', () => {
  it('superano la stessa validazione dell’editor Admin', () => {
    const result = validateCatalog({ version: 1, interactions: [...BUILT_IN_INTERACTIONS], roadBlocks: [...BUILT_IN_ROAD_BLOCKS] })
    expect(result.error).toBeUndefined()
    expect(result.catalog?.roadBlocks).toHaveLength(BUILT_IN_ROAD_BLOCKS.length)
  })
  it('un catalogo precedente riceve le voci mancanti una sola volta', () => {
    const old = withBuiltInContent({ interactions: [] as InteractionDefinition[], roadBlocks: [] as RoadBlockDefinition[] }, 0)
    expect(old.roadBlocks.map((entry) => entry.id)).toEqual(BUILT_IN_ROAD_BLOCKS.map((entry) => entry.id))
    expect(old.interactions.map((entry) => entry.id)).toEqual(['nascondiglio-postazione-codice'])
    // Dopo la revisione corrente le eliminazioni della regia restano tali.
    expect(withBuiltInContent({ interactions: [] as InteractionDefinition[], roadBlocks: [] as RoadBlockDefinition[] }, BUILT_IN_REVISION).roadBlocks).toEqual([])
  })
  it('non sovrascrive una voce modificata dalla regia', () => {
    const edited = { ...structuredClone(BUILT_IN_ROAD_BLOCKS[0]), title: 'Modificata' }
    const merged = withBuiltInContent({ interactions: [], roadBlocks: [edited] }, 0)
    expect(merged.roadBlocks.filter((entry) => entry.id === edited.id)).toEqual([edited])
  })
  it('nel Nascondiglio la postazione del codice resta raggiungibile, la sala finale no', () => {
    const map = getLocalMap('Nascondiglio_Team_Towers')!
    const blocked = localRoadBlocks(BUILT_IN_ROAD_BLOCKS, closedContext, map.id)
    const reachable = getReachableLocalMapNodes(applyLocalRoadBlocks(map, blocked, map.startNode), map.startNode, 999)
    expect(reachable).toContain('n111')
    expect(reachable).not.toContain('n72')
    const open = localRoadBlocks(BUILT_IN_ROAD_BLOCKS, { ...closedContext, isCompleted: (id: string) => id === 'nascondiglio-postazione-codice' }, map.id)
    expect(getReachableLocalMapNodes(applyLocalRoadBlocks(map, open, map.startNode), map.startNode, 999)).toContain('n72')
  })
})
