import { useGameStore } from '@/store/gameStore'
import { stateFromValidatedBackup, serializeGameBackup, validateGameBackup, type GameBackupPreview } from './gameBackup'
import { GAME_SAVE_STORAGE_KEY, PREVIOUS_BACKUP_STORAGE_KEY, serializeGameState } from './gamePersistence'
import { INTERACTION_STORAGE_KEY, useInteractionStore } from '@/interactions/interactionStore'
import { BATTLE_ARCHIVE_STORAGE_KEY, useBattleArchiveStore } from '@/components/battle/battleArchiveStore'

type BackupStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export type GameBackupRestoreResult = { ok: true; previousBackup: string } | { ok: false; error: string }

/** Write durable data first, then publish one in-memory state update. Failed writes leave the game untouched. */
export function restoreGameBackup(preview: GameBackupPreview, storage?: BackupStorage): GameBackupRestoreResult {
  if (useGameStore.getState().challengeContext) return { ok: false, error: 'Torna alla campagna prima di ripristinare un backup.' }
  const restored = stateFromValidatedBackup(preview)
  if (!restored) return { ok: false, error: 'Il backup non è più valido. Riapri il file e controlla l’anteprima.' }
  const revalidated = validateGameBackup(preview.source)
  if (!revalidated.ok) return { ok: false, error: revalidated.error }
  const catalog = revalidated.preview.interactionCatalog
  const archive = revalidated.preview.battleArchive
  const state = useGameStore.getState()
  restored.audioMuted = state.audioMuted
  const previousBackup = serializeGameBackup(state, new Date(), useInteractionStore.getState().interactions, useBattleArchiveStore.getState())
  let target: BackupStorage
  const previousValues = new Map<string, string | null>()
  const written: string[] = []
  try {
    target = storage ?? localStorage
    for (const key of [PREVIOUS_BACKUP_STORAGE_KEY, GAME_SAVE_STORAGE_KEY, ...(catalog ? [INTERACTION_STORAGE_KEY] : []), ...(archive ? [BATTLE_ARCHIVE_STORAGE_KEY] : [])]) {
      previousValues.set(key, target.getItem(key))
    }
    // Keep a downloadable copy of the displaced campaign before overwriting it.
    target.setItem(PREVIOUS_BACKUP_STORAGE_KEY, previousBackup)
    written.push(PREVIOUS_BACKUP_STORAGE_KEY)
    if (catalog) {
      target.setItem(INTERACTION_STORAGE_KEY, JSON.stringify({ state: { interactions: catalog.interactions }, version: 0 }))
      written.push(INTERACTION_STORAGE_KEY)
    }
    if (archive) {
      target.setItem(BATTLE_ARCHIVE_STORAGE_KEY, JSON.stringify({ state: archive, version: 1 }))
      written.push(BATTLE_ARCHIVE_STORAGE_KEY)
    }
    target.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify({ state: serializeGameState(restored), version: 0 }))
  } catch {
    // localStorage writes are atomic per key. Undo preceding keys if the final campaign write fails.
    for (const key of written.reverse()) {
      try {
        const value = previousValues.get(key)
        if (value === null || value === undefined) (storage ?? localStorage).removeItem(key)
        else (storage ?? localStorage).setItem(key, value)
      } catch { /* The unchanged in-memory campaign remains available for export if storage became unavailable. */ }
    }
    return { ok: false, error: 'Spazio di salvataggio non disponibile. La partita attuale non è stata sostituita; libera spazio o scarica prima un backup.' }
  }
  const options = useGameStore.persist.getOptions()
  const persistence = options.storage
  const interactionPersistence = useInteractionStore.persist.getOptions().storage
  const archivePersistence = useBattleArchiveStore.persist.getOptions().storage
  if (persistence) {
    // Zustand normally writes after notifying subscribers. The durable write above is already complete.
    useGameStore.persist.setOptions({ storage: { ...persistence, setItem: () => undefined } })
  }
  if (catalog && interactionPersistence) useInteractionStore.persist.setOptions({ storage: { ...interactionPersistence, setItem: () => undefined } })
  if (archive && archivePersistence) useBattleArchiveStore.persist.setOptions({ storage: { ...archivePersistence, setItem: () => undefined } })
  try {
    if (catalog) useInteractionStore.setState({ interactions: catalog.interactions })
    if (archive) useBattleArchiveStore.setState({ ...archive, storageWarning: null })
    useGameStore.setState({ ...restored, campaignRevision: state.campaignRevision + 1, saveRecoveryWarnings: [...preview.warnings] })
  } finally {
    if (persistence) useGameStore.persist.setOptions({ storage: persistence })
    if (catalog && interactionPersistence) useInteractionStore.persist.setOptions({ storage: interactionPersistence })
    if (archive && archivePersistence) useBattleArchiveStore.persist.setOptions({ storage: archivePersistence })
  }
  return { ok: true, previousBackup }
}

export function readPreviousGameBackup(storage?: BackupStorage): string | null {
  try { return (storage ?? localStorage).getItem(PREVIOUS_BACKUP_STORAGE_KEY) } catch { return null }
}

export function downloadGameBackup(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
