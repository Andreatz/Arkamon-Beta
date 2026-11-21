import type { InteractionAction, InteractionDefinition } from './types'
import { newInteractionDefinition } from './types'

/**
 * Audit fase 8: catalogo di base, perché una partita nuova sia giocabile senza preparazione.
 * Copre Venezia (accoglienza, Arkastore, Infermeria, due allenatori, Capopalestra) e il
 * Percorso 1 (cartello, tre cespugli, due allenatori). I pallini sono scelti sugli edifici
 * delle foto: mercato, chiesa, piazza San Marco, accampamento, rovine, grande quercia.
 * Il GM può modificarlo, sostituirlo o cancellarlo dalla console Interazioni.
 */
export const DEFAULT_INTERACTION_PREFIX = 'base-'

interface DefaultEntry {
  id: string
  mapId: 'Venezia' | 'Percorso_1'
  nodeId: string
  title: string
  dialogue: string
  action: InteractionAction
  repeatable?: boolean
  gymIds?: number[]
}

const ENTRIES: readonly DefaultEntry[] = [
  { id: 'venezia-benvenuto', mapId: 'Venezia', nodeId: 'n56', title: 'Benvenuti a Venezia', repeatable: true, action: { kind: 'dialogue' },
    dialogue: 'Una guida vi accoglie al pontile: «Benvenuti a Venezia! L’Infermeria Arka è davanti alla grande chiesa, il mercato con l’Arkastore è a nord-ovest e la Palestra vi aspetta in piazza San Marco. Ogni turno potete fare due movimenti, oppure un movimento e un’interazione».' },
  { id: 'venezia-infermeria', mapId: 'Venezia', nodeId: 'n52', title: 'Infermeria Arka', repeatable: true, action: { kind: 'heal' },
    dialogue: 'L’infermiera sorride: «Lasciate qui i vostri Arkamon, tornano in forze in un attimo».' },
  { id: 'venezia-arkastore', mapId: 'Venezia', nodeId: 'n35', title: 'Arkastore del mercato', repeatable: true, action: { kind: 'shop' },
    dialogue: 'Fra le bancarelle colorate c’è l’Arkastore: Sacchettini, cure e strumenti per il viaggio.' },
  { id: 'venezia-mascherato-1', mapId: 'Venezia', nodeId: 'n44', title: 'Sfida del Mascherato', action: { kind: 'trainer', trainerId: 201 },
    dialogue: 'Un allenatore in maschera blocca il ponte: «Nessuno attraversa senza una battaglia!».' },
  { id: 'venezia-mascherato-2', mapId: 'Venezia', nodeId: 'n22', title: 'Il secondo Mascherato', action: { kind: 'trainer', trainerId: 202 },
    dialogue: 'Davanti alla basilica, un’altra maschera vi sbarra la strada: «La piazza si guadagna!».' },
  { id: 'venezia-palestra', mapId: 'Venezia', nodeId: 'n26', title: 'Palestra di Venezia', action: { kind: 'trainer', trainerId: 203 },
    dialogue: 'La Capopalestra vi attende sotto le cupole di San Marco: «Mostratemi quanto siete cresciuti dal vostro primo passo».' },
  { id: 'percorso-1-cartello', mapId: 'Percorso_1', nodeId: 'n11', title: 'Cartello del Percorso 1', repeatable: true, action: { kind: 'dialogue' },
    dialogue: 'Il cartello dice: «Percorso 1. Nei cespugli alti vivono Arkamon selvatici: indeboliteli e usate un Sacchettino per catturarli. Attenzione agli allenatori del bosco!».' },
  { id: 'percorso-1-cespuglio-quercia', mapId: 'Percorso_1', nodeId: 'n30', title: 'Erba alta della grande quercia', action: { kind: 'bush', bush: 'A' },
    dialogue: 'L’erba attorno alla quercia secolare si muove…' },
  { id: 'percorso-1-cespuglio-tronco', mapId: 'Percorso_1', nodeId: 'n22', title: 'Cespuglio del tronco caduto', action: { kind: 'bush', bush: 'B' },
    dialogue: 'Qualcosa fruga fra i funghi vicino al tronco.' },
  { id: 'percorso-1-cespuglio-cascata', mapId: 'Percorso_1', nodeId: 'n42', title: 'Canneto della cascata', action: { kind: 'bush', bush: 'C' },
    dialogue: 'Fra le canne, accanto alla cascata, spunta un paio d’occhi.' },
  { id: 'percorso-1-alvise', mapId: 'Percorso_1', nodeId: 'n36', title: 'Alvise all’accampamento', action: { kind: 'trainer', trainerId: 204 },
    dialogue: 'Alvise si alza dal fuoco: «Un allenatore di passaggio? Vediamo cosa sai fare!».' },
  { id: 'percorso-1-bianca', mapId: 'Percorso_1', nodeId: 'n31', title: 'Bianca alle rovine', action: { kind: 'trainer', trainerId: 205 },
    dialogue: 'Bianca esce da dietro un arco di pietra: «Queste rovine sono il mio campo di allenamento».' },
]

export function defaultInteractionCatalog(): InteractionDefinition[] {
  return ENTRIES.map((entry) => {
    const base = newInteractionDefinition(entry.mapId, entry.nodeId, `${DEFAULT_INTERACTION_PREFIX}${entry.id}`)
    return {
      ...base,
      title: entry.title,
      dialogue: entry.dialogue,
      repeatable: entry.repeatable ?? false,
      action: entry.action,
      requirements: { ...base.requirements, gymIds: entry.gymIds ?? [] },
    }
  })
}

/**
 * Aggiunge le voci di base mancanti senza toccare quelle del GM: una voce predefinita viene
 * saltata se il suo identificatore esiste già o se il pallino ha già un'interazione.
 */
export function mergeDefaultInteractions(existing: readonly InteractionDefinition[]): InteractionDefinition[] {
  const ids = new Set(existing.map((entry) => entry.id))
  const nodes = new Set(existing.map((entry) => `${entry.mapId}/${entry.nodeId}`))
  const additions = defaultInteractionCatalog().filter((entry) => !ids.has(entry.id) && !nodes.has(`${entry.mapId}/${entry.nodeId}`))
  return [...existing, ...additions]
}
