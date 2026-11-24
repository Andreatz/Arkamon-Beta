import { GAME_DATA_VERSION } from '@/data/trainerMigration'
import { migrateCatalogPayload } from './catalogMigration'
export { migrateCatalogPayload } from './catalogMigration'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { InteractionDefinition, RoadBlockDefinition } from './types'
import { validateCatalog, validateInteraction, validateRoadBlock } from './schema'
import { BUILT_IN_INTERACTIONS, BUILT_IN_REVISION, BUILT_IN_ROAD_BLOCKS, withBuiltInContent, withRequiredBuiltIns } from './builtInCatalog'
import { isCampaignWritable, readCampaignCheckpoint, removeCampaignCheckpoint, sessionOwnershipMessage, writeCampaignCheckpoint } from '@/session/sessionOwnership'
import { interactionRecoveryMessage, useInteractionRecoveryStatus } from './interactionRecovery'

export const INTERACTION_STORAGE_KEY = 'arkamon-interactions-v1'
interface InteractionState {
  interactions: InteractionDefinition[]
  /** Strade bloccate del gioco e della regia (24 novembre 2026). */
  roadBlocks: RoadBlockDefinition[]
  saveRoadBlock: (block: RoadBlockDefinition) => string | null
  removeRoadBlock: (id: string) => string | null
  saveInteraction: (interaction: InteractionDefinition) => string | null
  removeInteraction: (id: string) => string | null
  importCatalog: (json: string) => string | null
  replaceDamagedCatalog: (json: string) => string | null
  exportCatalog: () => string
}
/** Write the validated catalog before publishing it to subscribers. Quota errors leave both copies unchanged. */
type CatalogPatch = Pick<InteractionState, 'interactions' | 'roadBlocks'>
function commitCatalog(interactions: InteractionDefinition[], roadBlocks: RoadBlockDefinition[], set: (patch: CatalogPatch) => void, replaceDamaged = false): string | null {
  if (!isCampaignWritable()) return sessionOwnershipMessage()
  const recovery = useInteractionRecoveryStatus.getState().recovery
  if (recovery && !replaceDamaged) return interactionRecoveryMessage
  const options = useInteractionStore.persist.getOptions()
  const storage = options.storage
  if (!storage) return 'Il salvataggio delle interazioni non è disponibile in questo browser. La configurazione precedente è stata conservata.'
  try {
    if (recovery && readCampaignCheckpoint(INTERACTION_STORAGE_KEY) !== recovery.raw) return 'Il catalogo originale è cambiato. Rileggi la sessione prima di scegliere il recupero.'
    const result = storage.setItem(options.name ?? INTERACTION_STORAGE_KEY, { state: { interactions, roadBlocks, dataVersion: GAME_DATA_VERSION, builtInRevision: BUILT_IN_REVISION }, version: options.version ?? 0 })
    // This catalog uses synchronous browser storage. Never publish an unconfirmed asynchronous write.
    if (result instanceof Promise) {
      void result.catch(() => {})
      return 'Il salvataggio delle interazioni richiede un archivio locale disponibile. La configurazione precedente è stata conservata.'
    }
    useInteractionStore.persist.setOptions({ storage: { ...storage, setItem: () => undefined } })
    try { set({ interactions, roadBlocks }) } finally { useInteractionStore.persist.setOptions({ storage }) }
    useInteractionRecoveryStatus.setState({ recovery: null })
    return null
  } catch {
    return 'Non è stato possibile salvare le interazioni: lo spazio del browser è esaurito o bloccato. La configurazione precedente è stata conservata; scarica un catalogo prima di liberare spazio.'
  }
}
function recordRecovery(error: string) {
  let raw: string | null = null
  try { raw = readCampaignCheckpoint(INTERACTION_STORAGE_KEY) } catch { /* Storage may be unavailable at its getter. */ }
  // A denied getter does not prove that a damaged catalog exists; the campaign's
  // failed-write flow already handles unavailable storage without inventing one.
  if (raw === null) return
  useInteractionRecoveryStatus.setState({ recovery: { error, raw } })
}
function readStoredCatalog(key: string): string | null {
  const raw = readCampaignCheckpoint(key)
  if (raw !== null) {
    try { JSON.parse(raw) }
    catch {
      // Route unreadable JSON through merge too, so an existing in-memory
      // catalog is quarantined without rewriting the original bytes.
      return JSON.stringify({ state: { interactions: null }, version: 0 })
    }
  }
  return raw
}
/** Un file senza strade bloccate (cataloghi precedenti, Tiled) conserva quelle già presenti. */
function prepareImportedCatalog(value: unknown, currentBlocks: RoadBlockDefinition[]): { payload: unknown; revision: number } {
  const migrated = migrateCatalogPayload(value)
  if (!migrated || typeof migrated !== 'object' || Array.isArray(migrated)) return { payload: migrated, revision: BUILT_IN_REVISION }
  const record = migrated as { roadBlocks?: unknown; builtInRevision?: unknown }
  const hasBlocks = record.roadBlocks !== undefined
  return {
    payload: hasBlocks || !Array.isArray((record as { interactions?: unknown }).interactions) ? migrated
      : { ...record, roadBlocks: currentBlocks, interactions: withRequiredBuiltIns((record as { interactions: InteractionDefinition[] }).interactions, currentBlocks) },
    // Un file senza revisione precede i contenuti del gioco: le voci predefinite mancanti si aggiungono.
    revision: typeof record.builtInRevision === 'number' ? record.builtInRevision : hasBlocks ? BUILT_IN_REVISION : 0,
  }
}

export const useInteractionStore = create<InteractionState>()(persist((set, get) => ({
  interactions: structuredClone([...BUILT_IN_INTERACTIONS]),
  roadBlocks: structuredClone([...BUILT_IN_ROAD_BLOCKS]),
  saveInteraction: (interaction) => {
    const error = validateInteraction(interaction)
    if (error) return error
    const existing = get().interactions
    const next = existing.some((entry) => entry.id === interaction.id)
      ? existing.map((entry) => entry.id === interaction.id ? interaction : entry) : [...existing, interaction]
    const validated = validateCatalog({ version: 1, interactions: next, roadBlocks: get().roadBlocks }, { legacyInteractions: existing })
    if (validated.error) return validated.error
    return commitCatalog(validated.catalog!.interactions, get().roadBlocks, set)
  },
  removeInteraction: (id) => {
    if (get().interactions.some((entry) => entry.requirements.completedInteractions.includes(id))) return 'Questa interazione è richiesta da una tappa successiva: rimuovi prima quel requisito.'
    if (get().roadBlocks.some((block) => block.unlock.completedInteractions.includes(id))) return 'Questa interazione riapre una strada bloccata: rimuovi prima quella condizione.'
    return commitCatalog(get().interactions.filter((entry) => entry.id !== id), get().roadBlocks, set)
  },
  saveRoadBlock: (block) => {
    const error = validateRoadBlock(block, get().interactions)
    if (error) return error
    const existing = get().roadBlocks
    const next = existing.some((entry) => entry.id === block.id) ? existing.map((entry) => entry.id === block.id ? block : entry) : [...existing, block]
    const validated = validateCatalog({ version: 1, interactions: get().interactions, roadBlocks: next }, { allowLegacyRepeatableRequirements: true })
    if (validated.error) return validated.error
    return commitCatalog(get().interactions, validated.catalog!.roadBlocks ?? [], set)
  },
  removeRoadBlock: (id) => commitCatalog(get().interactions, get().roadBlocks.filter((entry) => entry.id !== id), set),
  importCatalog: (json) => {
    try {
      const prepared = prepareImportedCatalog(JSON.parse(json), get().roadBlocks)
      const validated = validateCatalog(prepared.payload)
      if (validated.error) return validated.error
      const catalog = withBuiltInContent({ interactions: validated.catalog!.interactions, roadBlocks: validated.catalog!.roadBlocks ?? [] }, prepared.revision)
      return commitCatalog(catalog.interactions, catalog.roadBlocks, set)
    } catch { return 'Il file non contiene un JSON valido.' }
  },
  replaceDamagedCatalog: (json) => {
    if (!useInteractionRecoveryStatus.getState().recovery) return 'Non è presente un catalogo da recuperare.'
    try {
      const prepared = prepareImportedCatalog(JSON.parse(json), get().roadBlocks)
      const validated = validateCatalog(prepared.payload)
      if (validated.error) return validated.error
      const catalog = withBuiltInContent({ interactions: validated.catalog!.interactions, roadBlocks: validated.catalog!.roadBlocks ?? [] }, prepared.revision)
      return commitCatalog(catalog.interactions, catalog.roadBlocks, set, true)
    } catch { return 'Il file non contiene un JSON valido.' }
  },
  exportCatalog: () => {
    const recovery = useInteractionRecoveryStatus.getState().recovery
    if (recovery) {
      if (recovery.raw !== null) return recovery.raw
      throw new Error('L’archivio originale non è leggibile. Rileggi la sessione prima di esportarlo.')
    }
    return JSON.stringify({ version: 1, dataVersion: GAME_DATA_VERSION, builtInRevision: BUILT_IN_REVISION, interactions: get().interactions, roadBlocks: get().roadBlocks }, null, 2)
  },
}), {
  name: INTERACTION_STORAGE_KEY,
  storage: createJSONStorage(() => ({ getItem: readStoredCatalog, setItem: writeCampaignCheckpoint, removeItem: removeCampaignCheckpoint })),
  partialize: (state) => ({ interactions: state.interactions, roadBlocks: state.roadBlocks, dataVersion: GAME_DATA_VERSION, builtInRevision: BUILT_IN_REVISION }),
  onRehydrateStorage: () => (_state, error) => {
    if (error) recordRecovery('Il catalogo salvato non è leggibile. Le interazioni restano sospese e l’originale viene conservato.')
  },
  merge: (saved, current) => {
    const hasInteractions = saved && typeof saved === 'object' && 'interactions' in saved
    const raw = readCampaignCheckpoint(INTERACTION_STORAGE_KEY)
    const record = (saved ?? {}) as { dataVersion?: unknown; roadBlocks?: unknown; builtInRevision?: unknown }
    const payload = migrateCatalogPayload({ version: 1, dataVersion: record.dataVersion, interactions: hasInteractions ? saved.interactions : raw === null ? [] : null,
      roadBlocks: Array.isArray(record.roadBlocks) ? record.roadBlocks : [] })
    const validated = validateCatalog(payload, { allowLegacyRepeatableRequirements: true })
    if (!validated.catalog) {
      recordRecovery(validated.error ?? 'Il catalogo salvato non è valido.')
      return { ...current, interactions: [], roadBlocks: [] }
    }
    useInteractionRecoveryStatus.setState({ recovery: null })
    // I cataloghi precedenti ai contenuti del gioco ricevono una sola volta le voci predefinite.
    const revision = typeof record.builtInRevision === 'number' ? record.builtInRevision : 0
    const catalog = withBuiltInContent({ interactions: validated.catalog.interactions, roadBlocks: validated.catalog.roadBlocks ?? [] }, revision)
    return { ...current, interactions: catalog.interactions, roadBlocks: catalog.roadBlocks }
  },
}))
