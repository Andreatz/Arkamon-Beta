/**
 * mappa-principale (Fase E.6) — versione griglia "macro" della mappa Italia.
 *
 * Espone le mappe-griglia gia migrate come uscite reali
 * (Percorso_1, Venezia, Piacenza). Le altre caselle sono `transito` placeholder e
 * verranno popolate in E.8 con i restanti percorsi/città.
 *
 * Resta accessibile la versione 2D classica (`MappaPrincipaleScene`) come
 * fallback finché tutte le mappe non sono migrate.
 */
import type { MappaGriglia } from '@/types'
import { T, U } from './_helpers'

const U_PERCORSO_1 = U('Percorso_1', 0, 6)
const U_VENEZIA = U('Venezia', 6, 8)
const U_PIACENZA = U('Piacenza', 1, 7)

export const MAPPA_PRINCIPALE_GRIGLIA: MappaGriglia = {
  id: 'mappa-principale',
  larghezza: 14,
  altezza: 8,
  background: '/maps/Mappa-Finale.jpg',
  spawnDefault: { x: 7, y: 4 },
  caselle: [
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, U_PERCORSO_1, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, U_VENEZIA, T, U_PIACENZA, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
}
