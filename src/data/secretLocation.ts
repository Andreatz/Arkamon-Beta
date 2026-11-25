import { ALLENATORI } from '@data/index'
import type { PosizioneAvatar, StatoGiocatore } from '@/types'
import { placeLabel } from '@/utils/placeLabel'

/**
 * Luoghi nascosti: non hanno un nodo sulla mappa principale illustrata e si raggiungono con un
 * passaggio dal luogo d'origine (un movimento). Decisione dell'utente del 18 novembre 2026:
 * - Roma sblocca la mappa della Lega dopo le otto medaglie (era il luogo segreto «Percorso_15»);
 * - i Percorsi 3, 11 e 12 portano ciascuno a un luogo leggendario, il Percorso 9 al nascondiglio
 *   del Team Towers. Per ora solo la struttura, ad accesso libero: leggendari, allenatori, premi e
 *   reti di nodi arriveranno con le definizioni dell'utente.
 * Gli identificatori evitano «Lega» e «Nascondiglio» da soli, così gli allenatori del Database con
 * quei luoghi non vi vengono collegati automaticamente.
 */
export interface HiddenLocation {
  id: string
  /** Luogo da cui parte (e a cui ritorna) il passaggio. */
  origin: string
  /** Richiede tutte le medaglie delle palestre. */
  requiresAllGyms: boolean
}

export const HIDDEN_LOCATIONS: readonly HiddenLocation[] = [
  { id: 'Lega_Roma', origin: 'Roma', requiresAllGyms: true },
  { id: 'Leggendario_Percorso_3', origin: 'Percorso_3', requiresAllGyms: false },
  { id: 'Nascondiglio_Team_Towers', origin: 'Percorso_9', requiresAllGyms: false },
  { id: 'Leggendario_Percorso_11', origin: 'Percorso_11', requiresAllGyms: false },
  { id: 'Leggendario_Percorso_12', origin: 'Percorso_12', requiresAllGyms: false },
]

/** Luogo della Lega di Roma (era il luogo segreto «Percorso_15» fino al 18 novembre 2026). */
export const SECRET_LOCATION_ID = 'Lega_Roma'
export const SECRET_LOCATION_ORIGIN = 'Roma'

/** The unlock follows the actual gym roster, including the final gym in Rome. */
export const SECRET_LOCATION_GYM_IDS = ALLENATORI
  .filter((allenatore) => allenatore.tipo === 'Capopalestra')
  .map((allenatore) => allenatore.id)

export function getHiddenLocation(id: string | undefined): HiddenLocation | undefined {
  return id ? HIDDEN_LOCATIONS.find((entry) => entry.id === id) : undefined
}

export function isHiddenLocation(id: string | undefined): boolean {
  return getHiddenLocation(id) !== undefined
}

/** Il passaggio che parte da un luogo della mappa principale, se esiste. */
export function hiddenLocationFrom(origin: string | undefined): HiddenLocation | undefined {
  return origin ? HIDDEN_LOCATIONS.find((entry) => entry.origin === origin) : undefined
}

export function hiddenLocationLabel(id: string): string {
  return placeLabel(id)
}

export function hasUnlockedSecretLocation(giocatore: Pick<StatoGiocatore, 'allenatoriSconfitti'>): boolean {
  return SECRET_LOCATION_GYM_IDS.length > 0
    && SECRET_LOCATION_GYM_IDS.every((id) => giocatore.allenatoriSconfitti.has(id))
}

/** Il giocatore può entrare nel luogo nascosto indicato (requisito delle medaglie dove previsto). */
export function canEnterHiddenLocation(giocatore: Pick<StatoGiocatore, 'allenatoriSconfitti'>, id: string): boolean {
  const location = getHiddenLocation(id)
  return !!location && (!location.requiresAllGyms || hasUnlockedSecretLocation(giocatore))
}

export function isSecretLocationPosition(posizione: PosizioneAvatar): boolean {
  return posizione.mappaId === 'mappa-principale' && isHiddenLocation(posizione.luogo)
}

/** These hidden edges have no arbitrary coordinate on the illustrated world map. */
export function isSecretLocationConnection(from: string, to: string): boolean {
  return HIDDEN_LOCATIONS.some((entry) => (from === entry.origin && to === entry.id)
    || (from === entry.id && to === entry.origin))
}

/** Il giocatore si trova in un luogo nascosto (quello indicato, se passato) e vi ha accesso. */
export function canAccessSecretLocation(
  giocatore: Pick<StatoGiocatore, 'allenatoriSconfitti'>,
  posizione: PosizioneAvatar,
  luogo: string | undefined = posizione.luogo,
): boolean {
  return isSecretLocationPosition(posizione) && posizione.luogo === luogo
    && canEnterHiddenLocation(giocatore, posizione.luogo ?? '')
}
