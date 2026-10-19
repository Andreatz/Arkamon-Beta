import { describe, expect, it } from 'vitest'
import { prepareVisualTransaction, recoverPresentationStorage, VISUAL_JOURNAL_KEY } from './presentationTransaction'

const keys = ['arkamon-admin-theme', 'arkamon-vfx-authoring-v1', 'arkamon-presentation-project-v1']
function fixture() {
  const data = new Map(keys.map(key => [key, JSON.stringify({ key, revision: 'old' })]))
  data.set('arkamon-save', 'PRIVATE_CAMPAIGN_UNCHANGED')
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, removeItem: (key: string) => { data.delete(key) } }
  const next = keys.map(key => JSON.stringify({ key, revision: 'new' })) as [string, string, string]
  return { data, storage, next }
}
describe('visual project interrupted commits', () => {
  for (const writes of [0, 1, 2, 3]) it(`recovers a coherent project after interruption at write ${writes}`, () => {
    const { data, storage, next } = fixture()
    const entries = prepareVisualTransaction(storage, next)
    for (let i = 0; i < writes; i++) storage.setItem(entries[i].key, entries[i].after)
    expect(recoverPresentationStorage(storage).ok).toBe(true)
    for (const [index, key] of keys.entries()) expect(data.get(key)).toBe(writes === 3 ? next[index] : entries[index].before)
    expect(data.has(VISUAL_JOURNAL_KEY)).toBe(false)
    expect(data.get('arkamon-save')).toBe('PRIVATE_CAMPAIGN_UNCHANGED')
  })
  it('retains recovery evidence when storage refuses a recovery write', () => {
    const { data, storage, next } = fixture()
    prepareVisualTransaction(storage, next)
    expect(recoverPresentationStorage({ ...storage, setItem: () => { throw new Error('Quota') } }).ok).toBe(false)
    expect(data.has(VISUAL_JOURNAL_KEY)).toBe(true)
    expect(recoverPresentationStorage(storage).ok).toBe(true)
  })
  it('rejects a forged journal that tries to overwrite campaign storage', () => {
    const { storage, data, next } = fixture()
    const entries = prepareVisualTransaction(storage, next)
    entries[0].key = 'arkamon-save'
    data.set(VISUAL_JOURNAL_KEY, JSON.stringify({ version: 1, entries }))
    expect(recoverPresentationStorage(storage).ok).toBe(false)
    expect(data.get('arkamon-save')).toBe('PRIVATE_CAMPAIGN_UNCHANGED')
  })
})
