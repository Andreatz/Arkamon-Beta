export type { LocalMapPoint, LocalMapNode, LocalMapRoad, LocalMapDefinition } from './localMaps/types'
import type { LocalMapDefinition } from './localMaps/types'
import { Cagliari } from './localMaps/Cagliari'
import { Foggia } from './localMaps/Foggia'
import { Milano } from './localMaps/Milano'
import { Napoli } from './localMaps/Napoli'
import { Palermo } from './localMaps/Palermo'
import { Percorso1 } from './localMaps/Percorso_1'
import { Percorso14 } from './localMaps/Percorso_14'
import { Percorso15 } from './localMaps/Percorso_15'
import { ViaVittoria2 } from './localMaps/Via_Vittoria_2'
import { Percorso2 } from './localMaps/Percorso_2'
import { Percorso4 } from './localMaps/Percorso_4'
import { Piacenza } from './localMaps/Piacenza'
import { ReggioCalabria } from './localMaps/ReggioCalabria'
import { Roma } from './localMaps/Roma'
import { Torino } from './localMaps/Torino'
import { Venezia } from './localMaps/Venezia'
import { Percorso9 } from './localMaps/Percorso_9'
import { Percorso10 } from './localMaps/Percorso_10'
import { Percorso12 } from './localMaps/Percorso_12'
import { Pescara } from './localMaps/Pescara'
import { ViaVittoria3 } from './localMaps/Via_Vittoria_3'
import { Civitavecchia } from './localMaps/Civitavecchia'
import { Grosseto } from './localMaps/Grosseto'
import { LeggendarioPercorso3 } from './localMaps/Leggendario_Percorso_3'
import { LeggendarioPercorso11 } from './localMaps/Leggendario_Percorso_11'
import { LeggendarioPercorso12 } from './localMaps/Leggendario_Percorso_12'
import { NascondiglioTeamTowers } from './localMaps/Nascondiglio_Team_Towers'
import { Percorso5 } from './localMaps/Percorso_5'
import { Percorso6 } from './localMaps/Percorso_6'
import { Percorso7 } from './localMaps/Percorso_7'
import { Percorso8 } from './localMaps/Percorso_8'

// Coordinate, identificatori e strade conservati; un modulo per ciascuna foto.
export const LOCAL_MAPS: Readonly<Record<string, LocalMapDefinition>> = {
  'Cagliari': Cagliari,
  'Foggia': Foggia,
  'Milano': Milano,
  'Napoli': Napoli,
  'Palermo': Palermo,
  'Percorso_1': Percorso1,
  'Percorso_14': Percorso14,
  'Percorso_15': Percorso15,
  // Seconda mappa di Via Vittoria: registrata per l'editor delle interazioni, non ancora raggiungibile.
  'Via_Vittoria_2': ViaVittoria2,
  'Percorso_2': Percorso2,
  'Percorso_4': Percorso4,
  'Piacenza': Piacenza,
  'ReggioCalabria': ReggioCalabria,
  'Roma': Roma,
  'Torino': Torino,
  'Venezia': Venezia,
  // Reti del 23 novembre 2026 dalle foto «Interazioni»: città, Percorsi 5–8 e luoghi nascosti.
  'Civitavecchia': Civitavecchia,
  'Grosseto': Grosseto,
  'Leggendario_Percorso_3': LeggendarioPercorso3,
  'Leggendario_Percorso_11': LeggendarioPercorso11,
  'Leggendario_Percorso_12': LeggendarioPercorso12,
  'Nascondiglio_Team_Towers': NascondiglioTeamTowers,
  'Percorso_5': Percorso5,
  'Percorso_6': Percorso6,
  'Percorso_7': Percorso7,
  'Percorso_8': Percorso8,
  // Reti del 24 novembre 2026: Percorsi 9, 10 e 12, Pescara e terza mappa di Via Vittoria.
  'Percorso_9': Percorso9,
  'Percorso_10': Percorso10,
  'Percorso_12': Percorso12,
  'Pescara': Pescara,
  'Via_Vittoria_3': ViaVittoria3,
}

export function getLocalMap(id: string): LocalMapDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(LOCAL_MAPS, id) ? LOCAL_MAPS[id] : undefined
}
