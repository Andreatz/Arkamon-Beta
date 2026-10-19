/** A visual project is independent from campaign checkpoints. The envelope is
 * written last; startup recovers either all previous or all new visual keys. */
export const VISUAL_JOURNAL_KEY = 'arkamon-presentation-journal-v1'
const keys = ['arkamon-admin-theme', 'arkamon-vfx-authoring-v1', 'arkamon-presentation-project-v1'] as const
export interface VisualEntry { key: string; before: string | null; after: string }
interface VisualJournal { version: 1; entries: VisualEntry[] }
export type VisualStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
function parse(raw: string): VisualJournal {
  const value = JSON.parse(raw) as VisualJournal
  if (value?.version !== 1 || !Array.isArray(value.entries) || value.entries.length !== keys.length) throw new Error('Journal visivo non valido.')
  for (const [index, entry] of value.entries.entries()) {
    if (entry?.key !== keys[index] || entry.before !== null && typeof entry.before !== 'string' || typeof entry.after !== 'string') throw new Error('Journal visivo non valido.')
    for (const text of [entry.before, entry.after]) if (text !== null && (!JSON.parse(text) || typeof JSON.parse(text) !== 'object')) throw new Error('Dati del journal visivo non validi.')
  }
  return value
}
export function prepareVisualTransaction(storage: VisualStorage, next: [string, string, string]): VisualEntry[] {
  if (storage.getItem(VISUAL_JOURNAL_KEY)) throw new Error('Un progetto visivo interrotto richiede il recupero al riavvio.')
  const entries = keys.map((key, index) => ({ key, before: storage.getItem(key), after: next[index] }))
  const raw = JSON.stringify({ version: 1, entries })
  parse(raw)
  storage.setItem(VISUAL_JOURNAL_KEY, raw)
  return entries
}
export function rollbackVisualTransaction(storage: VisualStorage, entries: VisualEntry[]): void {
  // Restore the commit marker first so an interruption during rollback also
  // selects the previous project, never a mixture of the two.
  for (const entry of [...entries].reverse()) {
    if (entry.before === null) storage.removeItem(entry.key)
    else storage.setItem(entry.key, entry.before)
  }
  storage.removeItem(VISUAL_JOURNAL_KEY)
}
export function recoverPresentationStorage(storage?: VisualStorage): { ok: boolean; error: string | null } {
  if (!storage && typeof localStorage === 'undefined') return { ok: true, error: null }
  const target = storage ?? localStorage
  try {
    const raw = target.getItem(VISUAL_JOURNAL_KEY)
    if (!raw) return { ok: true, error: null }
    const journal = parse(raw), marker = journal.entries[journal.entries.length - 1]
    if (target.getItem(marker.key) === marker.after) {
      for (const entry of journal.entries) target.setItem(entry.key, entry.after)
      target.removeItem(VISUAL_JOURNAL_KEY)
    } else rollbackVisualTransaction(target, journal.entries)
    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'Recupero del progetto visivo in attesa. Libera spazio e riapri il gioco; il journal è conservato. La campagna non viene modificata.' }
  }
}
