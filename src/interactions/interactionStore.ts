import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { InteractionDefinition } from './types'
import { validateCatalog, validateInteraction } from './schema'

export const INTERACTION_STORAGE_KEY = 'arkamon-interactions-v1'
interface InteractionState {
  interactions: InteractionDefinition[]
  saveInteraction: (interaction: InteractionDefinition) => string | null
  removeInteraction: (id: string) => string | null
  importCatalog: (json: string) => string | null
  exportCatalog: () => string
}
/** Write the validated catalog before publishing it to subscribers. Quota errors leave both copies unchanged. */
function commitCatalog(interactions: InteractionDefinition[], set: (patch: Pick<InteractionState, 'interactions'>) => void): string | null {
  const options = useInteractionStore.persist.getOptions()
  const storage = options.storage
  if (!storage) return 'Il salvataggio delle interazioni non è disponibile in questo browser. La configurazione precedente è stata conservata.'
  try {
    const result = storage.setItem(options.name ?? INTERACTION_STORAGE_KEY, { state: { interactions }, version: options.version ?? 0 })
    // This catalog uses synchronous browser storage. Never publish an unconfirmed asynchronous write.
    if (result instanceof Promise) {
      void result.catch(() => {})
      return 'Il salvataggio delle interazioni richiede un archivio locale disponibile. La configurazione precedente è stata conservata.'
    }
    useInteractionStore.persist.setOptions({ storage: { ...storage, setItem: () => undefined } })
    try { set({ interactions }) } finally { useInteractionStore.persist.setOptions({ storage }) }
    return null
  } catch {
    return 'Non è stato possibile salvare le interazioni: lo spazio del browser è esaurito o bloccato. La configurazione precedente è stata conservata; scarica un catalogo prima di liberare spazio.'
  }
}
export const useInteractionStore = create<InteractionState>()(persist((set, get) => ({
  interactions: [],
  saveInteraction: (interaction) => {
    const error = validateInteraction(interaction)
    if (error) return error
    const existing = get().interactions
    const next = existing.some((entry) => entry.id === interaction.id)
      ? existing.map((entry) => entry.id === interaction.id ? interaction : entry) : [...existing, interaction]
    const validated = validateCatalog({ version: 1, interactions: next })
    if (validated.error) return validated.error
    return commitCatalog(validated.catalog!.interactions, set)
  },
  removeInteraction: (id) => {
    if (get().interactions.some((entry) => entry.requirements.completedInteractions.includes(id))) return 'Questa interazione è richiesta da una tappa successiva: rimuovi prima quel requisito.'
    return commitCatalog(get().interactions.filter((entry) => entry.id !== id), set)
  },
  importCatalog: (json) => {
    try {
      const validated = validateCatalog(JSON.parse(json))
      if (validated.error) return validated.error
      return commitCatalog(validated.catalog!.interactions, set)
    } catch { return 'Il file non contiene un JSON valido.' }
  },
  exportCatalog: () => JSON.stringify({ version: 1, interactions: get().interactions }, null, 2),
}), {
  name: INTERACTION_STORAGE_KEY,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ interactions: state.interactions }),
  merge: (saved, current) => {
    const interactions = saved && typeof saved === 'object' && 'interactions' in saved ? saved.interactions : []
    return { ...current, interactions: validateCatalog({ version: 1, interactions }).catalog?.interactions ?? [] }
  },
}))
