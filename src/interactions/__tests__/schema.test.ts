import { describe, expect, it } from 'vitest'
import { getLocalMap } from '@/data/localMaps'
import { newInteractionDefinition } from '../types'
import { normalizeInteractionProgress, validateCatalog, validateInteraction } from '../schema'
import { exportTiledInteractions, importTiledInteractions } from '../tiledAdapter'

function entry(id = 'first-step') {
  const map = getLocalMap('Venezia')!
  return { ...newInteractionDefinition(map.id, map.startNode, id), title: 'Tappa di prova' }
}
describe('catalogo interazioni e adattatore Tiled', () => {
  it('il catalogo vuoto è valido e non aggiunge contenuti al luogo segreto', () => {
    expect(validateCatalog({ version: 1, interactions: [] }).catalog?.interactions).toEqual([])
    const item = { ...entry(), mapId: 'Percorso_15', nodeId: getLocalMap('Percorso_15')!.startNode }
    expect(validateInteraction(item)).toBeNull()
  })
  it.each([
    { nodeId: 'absent' }, { mapId: 'absent' }, { title: '' }, { reward: { coins: -1, items: {} } },
    { reward: { coins: 1, items: { unknown: 1 } } }, { cost: { coins: .5, items: {} } },
    { requirements: { ...entry().requirements, minLevel: 101 } },
    { action: { kind: 'encounter', speciesId: 999, level: 5 } },
    { action: { kind: 'encounter', speciesId: 1, level: 4 } },
    { action: { kind: 'bush', bush: 'Z' } },
    { repeatable: true, reward: { coins: 1, items: {} } },
  ])('rifiuta valori non eseguibili: %j', (patch) => expect(validateInteraction({ ...entry(), ...patch })).not.toBeNull())
  it('rifiuta ID duplicati, prerequisiti assenti e dipendenze circolari', () => {
    expect(validateCatalog({ version: 1, interactions: [entry(), entry()] }).error).toMatch(/stesso identificatore/)
    const first = { ...entry(), requirements: { ...entry().requirements, completedInteractions: ['second-step'] } }
    expect(validateCatalog({ version: 1, interactions: [first] }).error).toMatch(/assente/)
    const second = { ...entry('second-step'), requirements: { ...entry().requirements, completedInteractions: ['first-step'] } }
    expect(validateCatalog({ version: 1, interactions: [first, second] }).error).toMatch(/ciclo/)
  })
  it('consente catene di missioni in luoghi differenti senza condividerne accidentalmente gli oggetti', () => {
    const first = entry()
    const second = { ...entry('second-step'), mapId: 'Roma', nodeId: getLocalMap('Roma')!.startNode, requirements: { ...entry().requirements, completedInteractions: [first.id] } }
    const result = validateCatalog({ version: 1, interactions: [first, second] })
    expect(result.error).toBeUndefined()
    result.catalog!.interactions[0].reward.coins = 99
    expect(first.reward.coins).toBe(0)
  })
  it('Tiled roundtrip conserva mappe, nodi e definizioni; spostare un oggetto non riscrive le strade', () => {
    const map = getLocalMap('Venezia')!
    const original = JSON.stringify(map)
    const item = entry()
    const exported = JSON.parse(exportTiledInteractions(map, [item]))
    exported.layers[1].objects[0].x = -999
    const result = importTiledInteractions(JSON.stringify(exported), [])
    expect(result.interactions).toEqual([item])
    expect(JSON.stringify(map)).toBe(original)
  })
  it('Tiled importa il luogo selezionato e conserva le configurazioni delle altre città', () => {
    const other = { ...entry('other'), mapId: 'Roma', nodeId: getLocalMap('Roma')!.startNode }
    const result = importTiledInteractions(exportTiledInteractions(getLocalMap('Venezia')!, [entry()]), [other])
    expect(result.interactions?.map((item) => item.id)).toEqual(['other', 'first-step'])
    expect(importTiledInteractions('{', []).error).toBeDefined()
  })
  it('recupera solo progressi e cronache con riferimenti validi', () => {
    const result = normalizeInteractionProgress({ completed1: ['first-step', 'first-step', 9, '<invalid>'], log1: [{ interactionId: 'first-step', title: 'Titolo', mapId: 'Venezia', nodeId: getLocalMap('Venezia')!.startNode, message: 'Testo' }, { interactionId: 'bad', title: 'X', mapId: 'absent', nodeId: 'none', message: 'X' }], pendingBattle: { interactionId: 'bad', playerId: 1, title: 'X', mapId: 'absent', nodeId: 'none', scope: 'player', reward: { coins: 1, items: {} } } })
    expect(result.completed1).toEqual(['first-step']); expect(result.log1).toHaveLength(1); expect(result.pendingBattle).toBeNull()
  })
})
