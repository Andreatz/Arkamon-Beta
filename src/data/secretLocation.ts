import { ALLENATORI } from '@data/index'
import type { PosizioneAvatar, StatoGiocatore } from '@/types'

export const SECRET_LOCATION_ID = 'Percorso_15'
export const SECRET_LOCATION_ORIGIN = 'Roma'

/** The original eight badges remain valid for existing campaigns. */
export const SECRET_LOCATION_GYM_IDS = [203, 302, 303, 305, 306, 307, 309, 311]
const DATABASE_GYM_IDS = ALLENATORI
  .filter((trainer) => trainer.tipo === 'Capopalestra' && trainer.idDatabase !== undefined)
  .sort((a, b) => a.idDatabase! - b.idDatabase!)
  .map((trainer) => trainer.id)

export function gymMedalTrack(defeated: ReadonlySet<number>): readonly number[] {
  const count = (ids: number[]) => ids.filter((id) => defeated.has(id)).length
  return count(DATABASE_GYM_IDS) > count(SECRET_LOCATION_GYM_IDS) ? DATABASE_GYM_IDS : SECRET_LOCATION_GYM_IDS
}

export function countGymMedals(player: Pick<StatoGiocatore, 'allenatoriSconfitti'>): number {
  return gymMedalTrack(player.allenatoriSconfitti).filter((id) => player.allenatoriSconfitti.has(id)).length
}

export function hasUnlockedSecretLocation(giocatore: Pick<StatoGiocatore, 'allenatoriSconfitti'>): boolean {
  return countGymMedals(giocatore) >= SECRET_LOCATION_GYM_IDS.length
}

export function isSecretLocationPosition(posizione: PosizioneAvatar): boolean {
  return posizione.mappaId === 'mappa-principale' && posizione.luogo === SECRET_LOCATION_ID
}

/** This hidden edge has no arbitrary coordinate on the illustrated world map. */
export function isSecretLocationConnection(from: string, to: string): boolean {
  return (from === SECRET_LOCATION_ORIGIN && to === SECRET_LOCATION_ID)
    || (from === SECRET_LOCATION_ID && to === SECRET_LOCATION_ORIGIN)
}

export function canAccessSecretLocation(
  giocatore: Pick<StatoGiocatore, 'allenatoriSconfitti'>,
  posizione: PosizioneAvatar,
): boolean {
  return hasUnlockedSecretLocation(giocatore) && isSecretLocationPosition(posizione)
}
