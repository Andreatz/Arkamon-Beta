import { DATABASE_TRAINERS_VERSION, GAME_DATA_VERSION, LOCATION_RENAME_VERSION, migrateLegacyInteraction } from '@/data/trainerMigration'
import { renameLegacyLocalMap } from '@/data/locationRename'
import type { InteractionDefinition } from './types'

/** Cataloghi salvati o esportati prima del Database: allenatori storici convertiti una sola volta. */
export function migrateCatalogPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const record = value as { dataVersion?: unknown; interactions?: unknown }
  if (record.dataVersion === GAME_DATA_VERSION || !Array.isArray(record.interactions)) return value
  const version = typeof record.dataVersion === 'number' ? record.dataVersion : 0
  const interactions = record.interactions.map((entry) => {
    const candidate = entry as InteractionDefinition
    if (!candidate || typeof candidate !== 'object' || !candidate.action || !candidate.requirements || !Array.isArray(candidate.requirements.gymIds)) return entry
    const trainers = version < DATABASE_TRAINERS_VERSION ? migrateLegacyInteraction(candidate) : candidate
    // Le interazioni stanno sui pallini delle pitture: seguono la mappa locale rinominata.
    return version < LOCATION_RENAME_VERSION && typeof trainers.mapId === 'string' ? { ...trainers, mapId: renameLegacyLocalMap(trainers.mapId) } : trainers
  })
  return { ...record, dataVersion: GAME_DATA_VERSION, interactions }
}
