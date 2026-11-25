/**
 * Rinomina dei luoghi del 18 novembre 2026 (decisione dell'utente):
 * Molisnt diventa Percorso 13, Percorso 13 diventa Percorso 14, Percorso 14 diventa Percorso 15
 * (Via Vittoria, la strada fra Pescara e Roma) e il vecchio luogo segreto raggiunto da Roma
 * diventa la Lega di Roma. I dati del Database usano già i nomi nuovi.
 *
 * La rinomina segue l'identità del luogo: posizioni, mappe locali e interazioni restano dove
 * il giocatore le aveva lasciate. I cespugli visitati seguono invece i dati del Database e non
 * si rinominano: chi aveva esplorato i cespugli del «Percorso 13» del foglio li ritrova esplorati.
 */

/** Luoghi della mappa principale e delle scene. */
export const LEGACY_LOCATION_RENAME: Readonly<Record<string, string>> = {
  Molisnt: 'Percorso_13',
  Percorso_13: 'Percorso_14',
  Percorso_14: 'Percorso_15',
  Percorso_15: 'Lega_Roma',
}

/**
 * Mappe locali dipinte: la rete del vecchio luogo segreto (pittura «Percorso_15-1») è la seconda
 * mappa di Via Vittoria, in attesa del collegamento con la prima.
 */
export const LEGACY_LOCAL_MAP_RENAME: Readonly<Record<string, string>> = {
  Molisnt: 'Percorso_13',
  Percorso_13: 'Percorso_14',
  Percorso_14: 'Percorso_15',
  Percorso_15: 'Via_Vittoria_2',
}

export const renameLegacyLocation = (id: string): string => LEGACY_LOCATION_RENAME[id] ?? id
export const renameLegacyLocalMap = (id: string): string => LEGACY_LOCAL_MAP_RENAME[id] ?? id

/** Chiavi delle strade della mappa principale: «Grosseto__Percorso_14» → «Grosseto__Percorso_15». */
export function renameLegacyRoadKey(key: string): string {
  return key.split('__').map(renameLegacyLocation).join('__')
}

type RawRecord = Record<string, unknown>
const isRecord = (value: unknown): value is RawRecord => !!value && typeof value === 'object' && !Array.isArray(value)

function renameNavigation(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.payload)) return value
  const payload: RawRecord = { ...value.payload }
  if (typeof payload.luogo === 'string') payload.luogo = renameLegacyLocation(payload.luogo)
  if (typeof payload.luogoRitorno === 'string') payload.luogoRitorno = renameLegacyLocation(payload.luogoRitorno)
  return { ...value, payload }
}

function renameLocalPositions(value: unknown): unknown {
  if (!isRecord(value)) return value
  return Object.fromEntries(Object.entries(value).map(([mapId, nodeId]) => [renameLegacyLocalMap(mapId), nodeId]))
}

function renamePosition(value: unknown): unknown {
  if (!isRecord(value)) return value
  const next: RawRecord = { ...value }
  if (typeof next.luogo === 'string') next.luogo = renameLegacyLocation(next.luogo)
  if (typeof next.mappaId === 'string' && next.mappaId !== 'mappa-principale') next.mappaId = renameLegacyLocation(next.mappaId)
  return next
}

/**
 * Applica la rinomina a un salvataggio grezzo (prima della normalizzazione, che valida le
 * posizioni contro le mappe attuali). Funzione pura: restituisce una copia.
 */
export function renameLegacySaveLocations(raw: RawRecord): RawRecord {
  const next: RawRecord = { ...raw }
  for (const key of ['posizione1', 'posizione2'] as const) next[key] = renamePosition(next[key])
  for (const key of ['posizioniLocali1', 'posizioniLocali2'] as const) next[key] = renameLocalPositions(next[key])
  next.scenaCorrente = renameNavigation(next.scenaCorrente)
  next.scenaPrecedente = renameNavigation(next.scenaPrecedente)
  if (isRecord(next.battaglia) && typeof next.battaglia.luogoRitorno === 'string')
    next.battaglia = { ...next.battaglia, luogoRitorno: renameLegacyLocation(next.battaglia.luogoRitorno) }
  if (isRecord(next.fallbackLocationActivity) && typeof next.fallbackLocationActivity.location === 'string')
    next.fallbackLocationActivity = { ...next.fallbackLocationActivity, location: renameLegacyLocation(next.fallbackLocationActivity.location) }
  return next
}

/**
 * Tema Admin salvato prima della rinomina: le posizioni dei nodi e i tracciati delle strade sono
 * indicizzati per nome. Un tema vecchio si riconosce dal nodo «Molisnt» (sempre presente nei
 * temi completi di allora); un tema nuovo non lo contiene, quindi la rinomina non si ripete.
 */
export function hasLegacyThemeLocations(
  nodes: Record<string, unknown> | undefined,
  roads: Record<string, unknown> | undefined,
): boolean {
  return (!!nodes && Object.prototype.hasOwnProperty.call(nodes, 'Molisnt'))
    || (!!roads && Object.keys(roads).some((key) => key.split('__').includes('Molisnt')))
}

export function renameLegacyThemeKeys<T>(record: Record<string, T> | undefined, rename: (key: string) => string): Record<string, T> | undefined {
  if (!record) return record
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [rename(key), value]))
}
