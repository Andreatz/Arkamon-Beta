import { describe, expect, it } from 'vitest'
import { getLocalMap } from '@data/localMaps'
import { MAIN_MAP_BLOCK_ID, type RoadBlockDefinition } from '@/interactions/types'
import { canMoveOnLocalMap } from './localMapMovement'
import { applyLocalRoadBlocks, isRoadBlockActive, localBlockFor, localRoadBlocks, mainRoadBlock, type RoadBlockContext } from './roadBlocks'

const context = (over: Partial<RoadBlockContext> = {}): RoadBlockContext => ({ gymIds: new Set(), leagueWon: false, isCompleted: () => false, ...over })
const block = (over: Partial<RoadBlockDefinition> = {}): RoadBlockDefinition => ({ id: 'b', mapId: MAIN_MAP_BLOCK_ID, title: 'Chiusa', message: '', enabled: true,
  roads: [['Civitavecchia', 'Roma']], nodes: [], unlock: { league: true, gymIds: [], completedInteractions: [] }, ...over })

describe('strade bloccate', () => {
  it('si riaprono soltanto quando tutte le condizioni sono soddisfatte', () => {
    const both = block({ unlock: { league: true, gymIds: [3], completedInteractions: ['codice'] } })
    expect(isRoadBlockActive(both, context({ leagueWon: true }))).toBe(true)
    expect(isRoadBlockActive(both, context({ leagueWon: true, gymIds: new Set([3]) }))).toBe(true)
    expect(isRoadBlockActive(both, context({ leagueWon: true, gymIds: new Set([3]), isCompleted: (id) => id === 'codice' }))).toBe(false)
  })
  it('senza condizioni restano chiuse finché la regia non le disattiva', () => {
    const permanent = block({ unlock: { league: false, gymIds: [], completedInteractions: [] } })
    expect(isRoadBlockActive(permanent, context({ leagueWon: true }))).toBe(true)
    expect(isRoadBlockActive({ ...permanent, enabled: false }, context())).toBe(false)
  })
  it('la mappa principale riconosce la strada in entrambi i versi', () => {
    expect(mainRoadBlock([block()], context(), 'Roma', 'Civitavecchia', MAIN_MAP_BLOCK_ID)?.id).toBe('b')
    expect(mainRoadBlock([block()], context(), 'Grosseto', 'Civitavecchia', MAIN_MAP_BLOCK_ID)).toBeUndefined()
    expect(mainRoadBlock([block()], context({ leagueWon: true }), 'Roma', 'Civitavecchia', MAIN_MAP_BLOCK_ID)).toBeUndefined()
  })
  it('nelle mappe locali un pallino chiuso blocca l’ingresso ma non l’uscita', () => {
    const map = getLocalMap('Civitavecchia')!
    const closed = 'n37'
    const neighbour = map.roads.find((road) => road.from === closed || road.to === closed)!
    const other = neighbour.from === closed ? neighbour.to : neighbour.from
    const blocked = localRoadBlocks([block({ mapId: 'Civitavecchia', roads: [], nodes: [closed] })], context(), 'Civitavecchia')
    expect(canMoveOnLocalMap(applyLocalRoadBlocks(map, blocked, other), other, closed, 1)).toBe(false)
    expect(canMoveOnLocalMap(applyLocalRoadBlocks(map, blocked, closed), closed, other, 1)).toBe(true)
    expect(localBlockFor(blocked, other, closed)?.id).toBe('b')
  })
  it('una strada locale chiusa sparisce solo dalla mappa percorribile', () => {
    const map = getLocalMap('Cagliari')!
    const blocked = localRoadBlocks([block({ mapId: 'Cagliari', roads: [['n16', 'n11']], unlock: { league: false, gymIds: [], completedInteractions: [] } })], context(), 'Cagliari')
    const walkable = applyLocalRoadBlocks(map, blocked, 'n11')
    expect(walkable.roads.length).toBe(map.roads.length - 1)
    expect(canMoveOnLocalMap(walkable, 'n11', 'n16', 1)).toBe(false)
    expect(map.roads.some((road) => [road.from, road.to].sort().join() === 'n11,n16')).toBe(true)
  })
})
