import { determinaIniziativa } from '@/engine/battleEngine'
import type { BattleCheckpoint, Lato, StatoBattaglia } from '@/types'

const phases = new Set<BattleCheckpoint['phase']>([
  'player', 'opponent', 'rival-move', 'pass-player', 'pass-rival', 'switch', 'ended',
])

/** Old saves retain their opening side; new checkpoints keep that separate from the current turn. */
export function restoreBattleCheckpoint(battle: StatoBattaglia): BattleCheckpoint {
  const saved = battle.checkpoint
  const baseline = determinaIniziativa(
    battle.pokemonA.livello, battle.pokemonB.livello,
    () => battle.turnoCorrente === 'B' ? 1 : 0,
  )
  const fallback: BattleCheckpoint = {
    version: 1,
    initialPriority: baseline,
    actedThisRound: [],
    phase: battle.turnoCorrente === 'A' ? 'player' : battle.tipo === 'PVP' ? 'pass-rival' : 'opponent',
    openingComplete: false,
    outcome: null,
    evolutions: [],
    rivalMessages: [],
  }
  if (!saved || saved.version !== 1 || !phases.has(saved.phase)
    || !['A', 'B'].includes(saved.initialPriority)
    || (saved.phase === 'ended' && saved.outcome !== 'vittoria' && saved.outcome !== 'sconfitta')
    || (saved.phase === 'switch' && (!saved.switchRequest
      || !['passaAdA', 'passaAB'].includes(saved.switchRequest.prossimoPasso)))) return fallback
  return {
    ...fallback,
    initialPriority: saved.initialPriority,
    phase: saved.phase,
    openingComplete: saved.phase === 'ended' || saved.openingComplete === true,
    outcome: saved.phase === 'ended' ? saved.outcome : null,
    actedThisRound: [...new Set((Array.isArray(saved.actedThisRound) ? saved.actedThisRound : [])
      .filter((side): side is Lato => side === 'A' || side === 'B'))],
    switchRequest: saved.phase === 'switch' ? saved.switchRequest : undefined,
    evolutions: (Array.isArray(saved.evolutions) ? saved.evolutions : []).filter((evolution) =>
      evolution && typeof evolution.istanzaId === 'string'
      && Number.isInteger(evolution.oldSpecieId) && Number.isInteger(evolution.newSpecieId)),
    rivalMessages: (Array.isArray(saved.rivalMessages) ? saved.rivalMessages : []).filter((message) => typeof message === 'string'),
  }
}

/** Serialize only control points. Functions, timers and native playback are intentionally absent. */
export function settledBattleCheckpoint(options: {
  initialPriority: Lato
  actedThisRound: Set<Lato>
  turnA: boolean
  pvp: boolean
  chooseRivalMove: boolean
  passDirection?: 'A→B' | 'B→A'
  switchRequest?: BattleCheckpoint['switchRequest']
  outcome: BattleCheckpoint['outcome']
  openingComplete: boolean
  evolutions: BattleCheckpoint['evolutions']
  rivalMessages: string[]
}): BattleCheckpoint {
  const phase = options.outcome ? 'ended'
    : options.switchRequest ? 'switch'
    : options.passDirection === 'A→B' ? 'pass-rival'
    : options.passDirection === 'B→A' ? 'pass-player'
    : options.pvp && options.chooseRivalMove ? 'rival-move'
    : options.turnA ? 'player' : 'opponent'
  return {
    version: 1,
    initialPriority: options.initialPriority,
    actedThisRound: [...options.actedThisRound],
    phase,
    openingComplete: options.openingComplete,
    outcome: options.outcome,
    switchRequest: options.switchRequest,
    evolutions: options.evolutions,
    rivalMessages: options.rivalMessages,
  }
}
