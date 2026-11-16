import type { AllenatoreDef, PokemonIstanza, StatoBattaglia } from '@/types'

export interface BattleVsSide {
  /** Ruolo, per esempio "Capopalestra" o "Arkamon selvatico". */
  kicker: string
  /** Nome del giocatore, dell'allenatore o della specie selvatica. */
  name: string
  speciesId: number
  pokemonName: string
  level: number
}

export interface BattleVsModel {
  player: BattleVsSide
  opponent: BattleVsSide
  wild: boolean
}

const KICKER: Record<AllenatoreDef['tipo'], string> = {
  NPC: 'Allenatore',
  PVP: 'Rivale',
  Capopalestra: 'Capopalestra',
  Superquattro: 'Superquattro',
  Campione: 'Campione',
}

const side = (kicker: string, name: string, pokemon: PokemonIstanza): BattleVsSide => ({
  kicker, name, speciesId: pokemon.specieId, pokemonName: pokemon.nome, level: pokemon.livello,
})

/**
 * Contenuto della scheda VS a partire dalla battaglia appena avviata.
 * Restituisce `null` se la battaglia non c'è ancora: la scheda mostra allora
 * soltanto il titolo.
 */
export function battleVsModel(
  battle: StatoBattaglia | null | undefined,
  playerName: string,
  playerLabel: string,
  findTrainer: (id: number) => AllenatoreDef | undefined,
): BattleVsModel | null {
  if (!battle?.pokemonA || !battle.pokemonB) return null
  const player = side(playerLabel, playerName || playerLabel, battle.pokemonA)
  if (battle.tipo === 'Selvatico') {
    return { player, opponent: side('Arkamon selvatico', battle.pokemonB.nome, battle.pokemonB), wild: true }
  }
  const trainer = battle.leagueOpponent ?? (battle.allenatoreId !== undefined ? findTrainer(battle.allenatoreId) : undefined)
  const kicker = trainer ? KICKER[trainer.tipo] ?? 'Allenatore' : battle.tipo === 'PVP' ? 'Rivale' : 'Allenatore'
  return { player, opponent: side(kicker, trainer?.nome ?? kicker, battle.pokemonB), wild: false }
}
