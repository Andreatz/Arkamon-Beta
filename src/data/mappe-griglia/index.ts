/**
 * Registry delle mappe-griglia (Fase E.6).
 * Aggiungi qui ogni nuova mappa man mano che la migri al sistema overworld.
 */
import type { MappaGriglia } from '@/types'
import { PERCORSO_1 } from './Percorso_1'
import { VENEZIA } from './Venezia'
import { MAPPA_PRINCIPALE_GRIGLIA } from './mappa-principale'

export const MAPPE_GRIGLIA: Record<string, MappaGriglia> = {
  [PERCORSO_1.id]: PERCORSO_1,
  [VENEZIA.id]: VENEZIA,
  [MAPPA_PRINCIPALE_GRIGLIA.id]: MAPPA_PRINCIPALE_GRIGLIA,
}

/** Ritorna la `MappaGriglia` con id dato, o `null` se non registrata. */
export function getMappaGriglia(id: string): MappaGriglia | null {
  return MAPPE_GRIGLIA[id] ?? null
}

export { PERCORSO_1, VENEZIA, MAPPA_PRINCIPALE_GRIGLIA }
