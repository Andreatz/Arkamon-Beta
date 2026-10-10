import { initialGameSave, isSaveRecord, normalizeGameSave, serializeGameState, type GameSaveState } from './gamePersistence'
import { validateCatalog } from '@/interactions/schema'
import type { InteractionCatalog, InteractionDefinition } from '@/interactions/types'
import { normalizeBattleArchive, type BattleArchive } from '@/components/battle/battleArchiveStore'

export const GAME_BACKUP_FORMAT = 'arkamon-campaign-backup'
export const GAME_BACKUP_VERSION = 1
export const MAX_GAME_BACKUP_BYTES = 5 * 1024 * 1024

export interface GameBackupPreview {
  readonly createdAt: string
  readonly version: 1
  readonly warnings: readonly string[]
  readonly players: readonly { name: string; team: number; deposit: number; coins: number; defeatedTrainers: number; location: string }[]
  readonly scene: string
  readonly battle: boolean
  readonly interactionCatalog?: InteractionCatalog
  readonly battleArchive?: BattleArchive
  /** A canonical validated file, revalidated at confirmation rather than trusting mutable UI data. */
  readonly source: string
}
export type GameBackupValidation = { ok: true; preview: GameBackupPreview } | { ok: false; error: string }

/** Public campaign data only. The audience host store, passwords and QR invitations are excluded. */
function portableState(state: GameSaveState): GameSaveState {
  const scene = (nav: GameSaveState['scenaCorrente'] | null) => {
    if (!nav) return null
    const payload = nav.payload
    if (!payload) return nav
    return { scena: nav.scena, payload: Object.fromEntries(Object.entries(payload).filter(([key]) =>
      ['luogo', 'luogoRitorno', 'giocatoreId', 'mappaId', 'evoluzioni'].includes(key))) }
  }
  const publicState = { ...state, scenaCorrente: scene(state.scenaCorrente)!, scenaPrecedente: scene(state.scenaPrecedente) }
  if (!state.battaglia?.checkpoint) return publicState
  const { audiencePending: _pending, audienceBattleId: _battleId, opponentTurnNumber: _turnNumber, ...checkpoint } = state.battaglia.checkpoint
  return { ...publicState, battaglia: { ...state.battaglia, checkpoint: {
    ...checkpoint,
    // Status and initiative have already been resolved before the audience step.
    phase: checkpoint.phase === 'audience' ? 'rival-move' : checkpoint.phase,
  } } }
}

function portableCampaignData(state: GameSaveState): Record<string, unknown> {
  const { audioMuted: _muted, ...campaign } = serializeGameState(portableState(state))
  return campaign
}

export function serializeGameBackup(state: GameSaveState, createdAt = new Date(), interactions?: InteractionDefinition[], battleArchive?: BattleArchive): string {
  const normalized = normalizeGameSave(serializeGameState(state), initialGameSave()).state
  return JSON.stringify({ format: GAME_BACKUP_FORMAT, version: GAME_BACKUP_VERSION, saveSchemaVersion: 1,
    createdAt: createdAt.toISOString(), campaign: portableCampaignData(normalized),
    ...(interactions === undefined ? {} : { interactionCatalog: { version: 1, interactions } }),
    ...(battleArchive === undefined ? {} : { battleArchive: normalizeBattleArchive(battleArchive) }),
  }, null, 2)
}

/** Unknown files/versions fail closed; damaged campaign fields require explicit user acceptance. */
export function validateGameBackup(text: string): GameBackupValidation {
  if (new TextEncoder().encode(text).byteLength > MAX_GAME_BACKUP_BYTES) return { ok: false, error: 'Il file supera il limite di 5 MB per un backup della partita.' }
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { return { ok: false, error: 'Il file non contiene un backup JSON leggibile.' } }
  if (!isSaveRecord(parsed) || parsed.format !== GAME_BACKUP_FORMAT) return { ok: false, error: 'Questo file non è un backup di una partita Arkamon.' }
  if (parsed.version !== GAME_BACKUP_VERSION || parsed.saveSchemaVersion !== 1) return { ok: false, error: 'Questa versione del backup non è supportata. Non è stata modificata la partita.' }
  if (typeof parsed.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(parsed.createdAt) || !Number.isFinite(Date.parse(parsed.createdAt))) return { ok: false, error: 'Il backup non ha una data di creazione valida.' }
  const campaign = parsed.campaign
  if (!isSaveRecord(campaign) || !isSaveRecord(campaign.giocatore1) || !isSaveRecord(campaign.giocatore2)
    || !Array.isArray(campaign.giocatore1.squadra) || !Array.isArray(campaign.giocatore2.squadra)
    || !isSaveRecord(campaign.giocatore1.deposito) || !isSaveRecord(campaign.giocatore2.deposito)) {
    return { ok: false, error: 'Mancano i dati essenziali dei due giocatori. Il file non può essere ripristinato.' }
  }
  const recovered = normalizeGameSave(campaign, initialGameSave())
  const catalog = parsed.interactionCatalog === undefined ? undefined : validateCatalog(parsed.interactionCatalog)
  if (catalog?.error) return { ok: false, error: `Il catalogo delle interazioni non è valido: ${catalog.error}` }
  if (parsed.battleArchive !== undefined && (!isSaveRecord(parsed.battleArchive) || parsed.battleArchive.version !== 1 || !Array.isArray(parsed.battleArchive.matches))) {
    return { ok: false, error: 'Il formato dell’archivio battaglie non è supportato.' }
  }
  const archive = parsed.battleArchive === undefined ? undefined : normalizeBattleArchive(parsed.battleArchive)
  const state = portableState(recovered.state)
  const warnings = [...recovered.warnings]
  if (archive && isSaveRecord(parsed.battleArchive) && Array.isArray(parsed.battleArchive.matches) && archive.matches.length !== parsed.battleArchive.matches.length) {
    warnings.push('Rimossi dall’archivio i replay non validi o oltre il limite di venti battaglie.')
  }
  if (recovered.state.battaglia?.checkpoint?.audiencePending || recovered.state.battaglia?.checkpoint?.phase === 'audience') {
    warnings.push('La votazione remota non viene ripristinata. La battaglia riprende dalla scelta della mossa del rivale.')
  }
  const foreignKeys = Object.keys(campaign).filter((key) => !(key in serializeGameState(state)))
  if (foreignKeys.length) warnings.push('Ignorati campi estranei alla partita: impostazioni e collegamenti del pubblico restano esclusi.')
  const canonical = JSON.stringify({ format: GAME_BACKUP_FORMAT, version: GAME_BACKUP_VERSION, saveSchemaVersion: 1,
    createdAt: parsed.createdAt, campaign: portableCampaignData(state),
    ...(catalog?.catalog ? { interactionCatalog: catalog.catalog } : {}) })
  const canonicalWithArchive = archive ? JSON.stringify({ ...JSON.parse(canonical), battleArchive: archive }) : canonical
  return { ok: true, preview: {
    createdAt: parsed.createdAt, version: GAME_BACKUP_VERSION, warnings,
    players: [state.giocatore1, state.giocatore2].map((g) => ({ name: g.nome, team: g.squadra.length,
      deposit: Object.keys(g.deposito).length, coins: g.monete, defeatedTrainers: g.allenatoriSconfitti.size,
      location: state[g.id === 1 ? 'posizione1' : 'posizione2'].luogo ?? 'Mappa' })),
    scene: state.scenaCorrente.scena, battle: state.battaglia !== null, source: canonicalWithArchive,
    ...(catalog?.catalog ? { interactionCatalog: catalog.catalog } : {}),
    ...(archive ? { battleArchive: archive } : {}),
  } }
}

export function gameBackupFilename(date = new Date()): string {
  return `Arkamon-partita-${date.toISOString().replace(/[:.]/g, '-')}.json`
}

export function stateFromValidatedBackup(preview: GameBackupPreview): GameSaveState | null {
  const validation = validateGameBackup(preview.source)
  if (!validation.ok) return null
  const envelope = JSON.parse(validation.preview.source) as { campaign: unknown }
  return normalizeGameSave(envelope.campaign, initialGameSave()).state
}
