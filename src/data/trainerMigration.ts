import { getAllenatore } from './index'
import type { InteractionDefinition } from '@/interactions/types'

/**
 * Migrazione degli allenatori storici (prima del Database del 16 novembre 2026).
 * Il Database riusa gli ID 201–340 per persone diverse: i vecchi riferimenti vanno
 * convertiti una sola volta, riconoscendo i salvataggi senza `dataVersion`.
 */
export const GAME_DATA_VERSION = 2

/** ID del vecchio catalogo (31 allenatori). */
export const LEGACY_TRAINER_IDS: ReadonlySet<number> = new Set([
  201, 202, 203, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266,
  301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311,
])

/**
 * Vecchie palestre → nuove palestre. Stessa città quando esiste (Venezia, Milano, Torino,
 * Cagliari, Palermo, Napoli); Civitavecchia e Roma, che non hanno più una palestra,
 * passano a Grosseto e Foggia. Il numero di medaglie resta identico.
 */
export const LEGACY_GYM_MAP: Readonly<Record<number, number>> = {
  203: 203, 302: 220, 303: 233, 305: 242, 306: 253, 307: 258, 309: 296, 311: 287,
}

/** Medaglie convertite; le sconfitte di NPC storici non hanno un equivalente e si azzerano. */
export function migrateDefeatedTrainers(defeated: ReadonlySet<number>): Set<number> {
  const next = new Set<number>()
  for (const id of defeated) {
    if (LEGACY_GYM_MAP[id] !== undefined) next.add(LEGACY_GYM_MAP[id])
    else if (!LEGACY_TRAINER_IDS.has(id)) next.add(id)
  }
  return next
}

export function migrateTrainerReference(id: number | undefined): number | undefined {
  return id === undefined ? undefined : LEGACY_GYM_MAP[id]
}

/**
 * Interazioni dell'Admin: i capipalestra restano collegati se la nuova palestra è nello
 * stesso luogo; gli altri allenatori diventano dialoghi disattivati da riassegnare.
 */
export function migrateLegacyInteraction(entry: InteractionDefinition): InteractionDefinition {
  const gymIds = entry.requirements.gymIds.map((id) => LEGACY_GYM_MAP[id]).filter((id): id is number => id !== undefined)
  let next: InteractionDefinition = { ...entry, requirements: { ...entry.requirements, gymIds } }
  if (entry.action.kind !== 'trainer') return next
  const mapped = LEGACY_GYM_MAP[entry.action.trainerId]
  if (mapped !== undefined && getAllenatore(mapped)?.luogo === entry.mapId) {
    return { ...next, action: { ...entry.action, trainerId: mapped } }
  }
  next = {
    ...next, enabled: false, repeatable: false,
    title: `Da riassegnare · ${entry.title}`.slice(0, 120),
    dialogue: `${entry.dialogue}${entry.dialogue ? '\n\n' : ''}[Allenatore storico ${entry.action.trainerId} non più presente dopo l’import del Database: scegli un nuovo allenatore.]`.slice(0, 4000),
    action: { kind: 'dialogue' },
  }
  return next
}
