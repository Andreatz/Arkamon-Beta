import { create } from 'zustand'
import { serializeGameBackup, validateGameBackup } from './gameBackup'
import type { GameSaveState } from './gamePersistence'

export const AUTO_BACKUP_STORAGE_KEY = 'arkamon-automatic-backups-v1'
export interface RecoveryCopy { createdAt: string; backup: string }
interface WriteStatus {
  error: string | null
  retry: (() => boolean) | null
  cancel: (() => void) | null
  local: boolean
  backupWarning: string | null
  clear: () => void
}
/** Volatile diagnostics must never trigger another write to the failed storage. */
export const useSaveWriteStatus = create<WriteStatus>((set) => ({
  error: null, retry: null, cancel: null, local: false, backupWarning: null,
  clear: () => set({ error: null, retry: null, cancel: null, local: false }),
}))
export function reportSaveFailure(retry: () => boolean, local = false, cancel?: () => void) {
  useSaveWriteStatus.setState({ error: 'Il browser non ha salvato questa operazione. I progressi già salvati restano intatti.', retry, cancel: cancel ?? null, local })
}
export function readRecoveryCopies(storage?: Pick<Storage, 'getItem'>): RecoveryCopy[] {
  try {
    const value = JSON.parse((storage ?? localStorage).getItem(AUTO_BACKUP_STORAGE_KEY) ?? 'null')
    if (value?.version !== 1 || !Array.isArray(value.copies)) return []
    return value.copies.slice(0, 8).filter((entry: unknown): entry is RecoveryCopy => {
      if (!entry || typeof entry !== 'object') return false
      const copy = entry as RecoveryCopy
      return typeof copy.createdAt === 'string' && Number.isFinite(Date.parse(copy.createdAt)) && typeof copy.backup === 'string' && validateGameBackup(copy.backup).ok
    }).slice(0, 2)
  } catch { return [] }
}
/** Preserve the previous valid checkpoint, never an unreadable disk envelope. */
export function rememberRecoveryCopy(previous: GameSaveState, storage?: Pick<Storage, 'getItem' | 'setItem'>): void {
  try {
    const target = storage ?? localStorage
    const backup = serializeGameBackup(previous)
    const copies = readRecoveryCopies(target)
    const campaign = JSON.stringify(JSON.parse(backup).campaign)
    if (copies[0] && JSON.stringify(JSON.parse(copies[0].backup).campaign) === campaign) return
    target.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify({ version: 1, copies: [{ createdAt: new Date().toISOString(), backup }, ...copies].slice(0, 2) }))
    useSaveWriteStatus.setState({ backupWarning: null })
  } catch {
    // A backup quota error must not prevent an otherwise writable primary save.
    useSaveWriteStatus.setState({ backupWarning: 'La copia automatica non è disponibile. Scarica un backup della partita.' })
  }
}
