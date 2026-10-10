import { ALLENATORI, INCONTRI, MAPPE } from '@/data'
import { getAdjacentMainMapNodes } from '@/data/mainMapRoads'
import { hasUnlockedSecretLocation, SECRET_LOCATION_ID } from '@/data/secretLocation'
import { interactionRequirementMessage, isInteractionComplete, type InteractionRuntimeState } from '@/interactions/runtime'
import type { InteractionDefinition } from '@/interactions/types'

export interface JournalObjective { title: string; detail: string; mapId?: string; nextStep?: string }
export function routeToLocation(from: string, target: string): string[] | null {
  if (from === target) return [from]
  const visited = new Set([from]), paths = [[from]]
  while (paths.length) {
    const path = paths.shift()!
    for (const next of getAdjacentMainMapNodes(path[path.length - 1])) {
      if (visited.has(next)) continue
      const candidate = [...path, next]
      if (next === target) return candidate
      visited.add(next); paths.push(candidate)
    }
  }
  return null
}
export function nextJournalObjective(state: InteractionRuntimeState, playerId: 1 | 2, definitions: InteractionDefinition[]): JournalObjective {
  const player = state[playerId === 1 ? 'giocatore1' : 'giocatore2']
  const world = state[playerId === 1 ? 'posizione1' : 'posizione2']
  const here = world.luogo ?? 'Pordenone'
  if (!player.squadra.length) return { title: 'Scegli il tuo starter', detail: 'Il laboratorio assegna uno starter diverso a ciascun giocatore.' }
  if (state.battaglia && state.giocatoreAttivo === playerId) return { title: 'Completa la battaglia in corso', detail: 'Il movimento torna disponibile dopo lo scontro.' }
  if (!player.squadra.some((pokemon) => pokemon.hp > 0)) return { title: 'Cura la squadra', detail: 'Visita il Centro Pokémon di una città prima di affrontare un incontro.' }
  const candidates = definitions.filter((definition) => definition.enabled && !definition.repeatable
    && !isInteractionComplete(state.interactionProgress, definition, playerId)
    && !interactionRequirementMessage(state, definition, playerId)
    && (definition.mapId !== SECRET_LOCATION_ID || hasUnlockedSecretLocation(player))
    && !(definition.action.kind === 'trainer' && player.allenatoriSconfitti.has(definition.action.trainerId))
    && !(definition.action.kind === 'bush' && player.cespugliVisitati.has(`${definition.mapId}:${definition.action.bush}`)))
  const nearest = candidates.map((definition) => ({ definition, route: routeToLocation(here, definition.mapId) }))
    .filter((entry) => !!entry.route).sort((a, b) => a.route!.length - b.route!.length)[0]
  if (nearest) return {
    title: nearest.definition.title, mapId: nearest.definition.mapId,
    detail: nearest.definition.mapId === here ? 'Raggiungi il pallino dell’interazione in questa mappa.' : `Tappa disponibile a ${nearest.definition.mapId.replace(/_/g, ' ')}.`,
    nextStep: nearest.route?.[1],
  }
  const gyms = ALLENATORI.filter((trainer) => trainer.tipo === 'Capopalestra' && !player.allenatoriSconfitti.has(trainer.id))
  const gym = gyms.map((trainer) => ({ trainer, route: routeToLocation(here, trainer.luogo) })).filter((entry) => !!entry.route)
    .sort((a, b) => a.route!.length - b.route!.length || a.trainer.id - b.trainer.id)[0]
  if (gym) return { title: `Palestra di ${gym.trainer.luogo}`, mapId: gym.trainer.luogo,
    detail: gym.trainer.luogo === here ? `${gym.trainer.nome} non è ancora stato sconfitto.` : 'La palestra più vicina fra quelle ancora da completare.', nextStep: gym.route?.[1] }
  if (hasUnlockedSecretLocation(player)) return { title: here === SECRET_LOCATION_ID ? 'Esplora il luogo segreto' : 'Il passaggio segreto è disponibile a Roma',
    mapId: here === SECRET_LOCATION_ID ? SECRET_LOCATION_ID : 'Roma', detail: 'Hai completato tutte le palestre. Le attività del luogo dipendono dai contenuti definiti dalla regia.', nextStep: routeToLocation(here, 'Roma')?.[1] }
  return { title: 'Esplora i luoghi disponibili', detail: 'Consulta nel diario gli incontri e gli allenatori ancora da affrontare.' }
}
export function journalLocations(state: InteractionRuntimeState, playerId: 1 | 2, definitions: InteractionDefinition[]) {
  const player = state[playerId === 1 ? 'giocatore1' : 'giocatore2']
  const world = state[playerId === 1 ? 'posizione1' : 'posizione2']
  const local = state[playerId === 1 ? 'posizioniLocali1' : 'posizioniLocali2']
  const documented = new Set(Object.keys(local))
  if (world.luogo) documented.add(world.luogo)
  player.cespugliVisitati.forEach((key) => documented.add(key.split(':')[0]))
  ALLENATORI.filter((trainer) => player.allenatoriSconfitti.has(trainer.id)).forEach((trainer) => documented.add(trainer.luogo))
  return [...MAPPE.map((map) => map.nome), ...(hasUnlockedSecretLocation(player) ? [SECRET_LOCATION_ID] : [])].map((mapId) => {
    const trainers = ALLENATORI.filter((trainer) => trainer.luogo === mapId)
    const bushes = [...new Set(INCONTRI.filter((entry) => entry.luogo === mapId).map((entry) => entry.cespuglio))]
    const interactions = definitions.filter((entry) => entry.mapId === mapId && entry.enabled && !entry.repeatable)
    return { mapId, documented: documented.has(mapId), current: world.luogo === mapId,
      trainersTotal: trainers.length, trainersCompleted: trainers.filter((trainer) => player.allenatoriSconfitti.has(trainer.id)).length,
      bushesTotal: bushes.length, bushesCompleted: bushes.filter((bush) => player.cespugliVisitati.has(`${mapId}:${bush}`)).length,
      interactionsTotal: interactions.length, interactionsCompleted: interactions.filter((entry) => isInteractionComplete(state.interactionProgress, entry, playerId)).length }
  })
}
