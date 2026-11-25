/**
 * Contenuti del gioco (decisioni dell'utente del 24 novembre 2026): le interazioni e le strade
 * bloccate fanno parte del gioco e restano modificabili dall'editor Admin. Ogni revisione aggiunge ai
 * cataloghi salvati soltanto le voci nuove: ciò che la regia ha modificato o eliminato resta com'è.
 */
import { newInteractionDefinition, MAIN_MAP_BLOCK_ID, type InteractionDefinition, type RoadBlockDefinition } from './types'

export const BUILT_IN_REVISION = 1

const lega = { league: true, gymIds: [], completedInteractions: [] }

/** Strade bloccate del documento INTERAZIONI e della mappa principale con le linee rosse. */
export const BUILT_IN_ROAD_BLOCKS: readonly RoadBlockDefinition[] = [
  // Linee rosse della mappa principale: si riaprono dopo la vittoria della Lega.
  { id: 'blocco-percorso-1-via-vittoria', mapId: MAIN_MAP_BLOCK_ID, title: 'Strada chiusa', enabled: true,
    message: 'La strada verso la Via Vittoria resterà chiusa per molto tempo.', roads: [['Percorso_1', 'Percorso_15']], nodes: [], unlock: lega },
  { id: 'blocco-grosseto-via-vittoria', mapId: MAIN_MAP_BLOCK_ID, title: 'Strada per Roma bloccata', enabled: true,
    message: 'Una forma di vita aliena è arrivata sul Percorso 15: tutti gli accessi sono stati chiusi.', roads: [['Grosseto', 'Percorso_15']], nodes: [], unlock: lega },
  { id: 'blocco-civitavecchia-roma', mapId: MAIN_MAP_BLOCK_ID, title: 'Strada chiusa per lavori', enabled: true,
    message: 'Il sindaco di Civitavecchia sta trasformando la strada per Roma in una grande pista ciclabile.', roads: [['Civitavecchia', 'Roma']], nodes: [], unlock: lega },
  // Gli stessi blocchi segnati sulle foto delle mappe locali («BLOCCO», «strada chiusa»).
  { id: 'blocco-percorso-1-punto-15', mapId: 'Percorso_1', title: 'Strada chiusa', enabled: true,
    message: 'La strada verso la Via Vittoria resterà chiusa per molto tempo.', roads: [], nodes: ['n48'], unlock: lega },
  { id: 'blocco-grosseto-punto-35', mapId: 'Grosseto', title: 'Strada per Roma bloccata', enabled: true,
    message: 'Gli accessi al Percorso 15 sono chiusi.', roads: [], nodes: ['n35'], unlock: lega },
  { id: 'blocco-civitavecchia-pista-ciclabile', mapId: 'Civitavecchia', title: 'Strada chiusa per lavori', enabled: true,
    message: 'Qui sorgerà la pista ciclabile verso Roma.', roads: [], nodes: ['n37', 'n45'], unlock: lega },
  // Porte dei luoghi leggendari: i Percorsi 3, 11 e 12 restano aperti, i passaggi si aprono dopo la Lega.
  ...([3, 11, 12] as const).map((route): RoadBlockDefinition => ({ id: `porta-leggendario-percorso-${route}`, mapId: MAIN_MAP_BLOCK_ID,
    title: 'Porta del leggendario chiusa', enabled: true, message: 'Il passaggio si aprirà dopo la vittoria della Lega.',
    roads: [[`Percorso_${route}`, `Leggendario_Percorso_${route}`]], nodes: [], unlock: lega })),
  // Nascondiglio del Team Towers: otto pallini chiusi fino al codice della postazione 111.
  { id: 'nascondiglio-strade-del-codice', mapId: 'Nascondiglio_Team_Towers', title: 'Accesso riservato', enabled: true,
    message: 'Le porte del quartier generale si aprono soltanto con il codice della postazione.',
    roads: [], nodes: ['n76', 'n116', 'n113', 'n118', 'n88', 'n68', 'n122', 'n119'],
    unlock: { league: false, gymIds: [], completedInteractions: ['nascondiglio-postazione-codice'] } },
  // Cagliari: «distruggere la strada tra 19 e 20».
  { id: 'cagliari-strada-distrutta', mapId: 'Cagliari', title: 'Strada distrutta', enabled: true,
    message: 'La strada fra questi due punti è crollata.', roads: [['n11', 'n16']], nodes: [], unlock: { league: false, gymIds: [], completedInteractions: [] } },
]

/** Interazioni del gioco. I combattimenti dei luogotenenti arriveranno con le coppie confermate. */
export const BUILT_IN_INTERACTIONS: readonly InteractionDefinition[] = [
  { ...newInteractionDefinition('Nascondiglio_Team_Towers', 'n111', 'nascondiglio-postazione-codice'),
    title: 'Postazione del codice',
    dialogue: 'Il tastierino accetta il codice alfanumerico: le porte del quartier generale si aprono.' },
]

/** Aggiunge le voci di una revisione più recente, senza toccare quelle già presenti (anche se modificate). */
export function withBuiltInContent<T extends { interactions: InteractionDefinition[]; roadBlocks: RoadBlockDefinition[] }>(catalog: T, savedRevision: number): T {
  if (savedRevision >= BUILT_IN_REVISION) return catalog
  const interactionIds = new Set(catalog.interactions.map((entry) => entry.id))
  const blockIds = new Set(catalog.roadBlocks.map((entry) => entry.id))
  return {
    ...catalog,
    interactions: [...catalog.interactions, ...structuredClone(BUILT_IN_INTERACTIONS.filter((entry) => !interactionIds.has(entry.id)))],
    roadBlocks: [...catalog.roadBlocks, ...structuredClone(BUILT_IN_ROAD_BLOCKS.filter((entry) => !blockIds.has(entry.id)))],
  }
}

/**
 * Un catalogo importato senza strade bloccate conserva quelle attuali: le interazioni del gioco da cui
 * dipende la loro riapertura (ad esempio la postazione del codice) vengono ripristinate se mancano.
 */
export function withRequiredBuiltIns(interactions: InteractionDefinition[], roadBlocks: readonly RoadBlockDefinition[]): InteractionDefinition[] {
  const present = new Set(interactions.map((entry) => entry.id))
  const needed = new Set(roadBlocks.flatMap((block) => block.unlock.completedInteractions))
  const missing = BUILT_IN_INTERACTIONS.filter((entry) => needed.has(entry.id) && !present.has(entry.id))
  return missing.length ? [...interactions, ...structuredClone(missing)] : interactions
}
