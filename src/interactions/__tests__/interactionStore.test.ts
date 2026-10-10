import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocalMap } from '@/data/localMaps'
import { INTERACTION_STORAGE_KEY, useInteractionStore } from '../interactionStore'
import { newInteractionDefinition } from '../types'
const storageState = vi.hoisted(() => {
  const values = new Map<string, string>()
  const control = { fail: false, writes: 0, values }
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { control.writes += 1; if (control.fail) throw new Error('QuotaExceededError'); values.set(key, value) },
    removeItem: (key: string) => values.delete(key),
  })
  return control
})
function entry(id: string) {
  const map = getLocalMap('Venezia')!
  return { ...newInteractionDefinition(map.id, map.startNode, id), title: id }
}
describe('catalogo: pubblicazione soltanto dopo il salvataggio duraturo', () => {
  beforeEach(() => {
    storageState.fail = false
    useInteractionStore.setState({ interactions: [] })
    storageState.writes = 0
    useInteractionStore.getState().saveInteraction(entry('previous'))
  })
  it.each(['save', 'import', 'remove'] as const)('%s con archivio pieno conserva catalogo memoria e file, senza lanciare errori UI', (action) => {
    const before = useInteractionStore.getState().interactions
    const file = storageState.values.get(INTERACTION_STORAGE_KEY)
    storageState.fail = true
    const store = useInteractionStore.getState()
    const message = action === 'save' ? store.saveInteraction(entry('new'))
      : action === 'remove' ? store.removeInteraction('previous')
      : store.importCatalog(JSON.stringify({ version: 1, interactions: [entry('imported')] }))
    expect(message).toMatch(/spazio.*esaurito o bloccato/)
    expect(useInteractionStore.getState().interactions).toBe(before)
    expect(storageState.values.get(INTERACTION_STORAGE_KEY)).toBe(file)
    storageState.fail = false
  })
  it('i subscriber vedono il catalogo solo quando la sua stessa versione è già scritta, con una sola scrittura', () => {
    storageState.writes = 0
    const observations: string[][] = []
    const release = useInteractionStore.subscribe((state) => {
      const file = JSON.parse(storageState.values.get(INTERACTION_STORAGE_KEY)!)
      expect(file.state.interactions).toEqual(state.interactions)
      observations.push(state.interactions.map((item) => item.id))
    })
    expect(useInteractionStore.getState().saveInteraction(entry('next'))).toBeNull()
    release()
    expect(observations).toEqual([['previous', 'next']])
    expect(storageState.writes).toBe(1)
  })
  it('un’importazione non valida non modifica il catalogo né scrive nell’archivio', () => {
    storageState.writes = 0
    const previous = useInteractionStore.getState().interactions
    expect(useInteractionStore.getState().importCatalog('{')).toMatch(/JSON/)
    expect(useInteractionStore.getState().importCatalog(JSON.stringify({ version: 1, interactions: [entry('duplicate'), entry('duplicate')] }))).toMatch(/stesso identificatore/)
    expect(useInteractionStore.getState().interactions).toBe(previous)
    expect(storageState.writes).toBe(0)
  })
})
