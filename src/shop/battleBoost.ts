import { getAllenatore } from '@/data'
import { roundHalfUp } from '@/engine/battleEngine'
import type { RisultatoMossa, StatoBattaglia } from '@/types'

/** Boost danno del Database: +25% ai danni dei tuoi Arkamon per il resto della sfida. */
export const BOOST_DANNO = 1.25

/**
 * I Boost non valgono contro capipalestra, rivale, Superquattro e "team cattivi"
 * (i Mascherati e i loro seguaci). Restano gli incontri selvatici e gli altri NPC.
 */
export function boostBlockedReason(battle: StatoBattaglia | null | undefined): string | null {
  if (!battle) return 'Serve una battaglia in corso.'
  if (battle.leagueBattle || battle.leagueOpponent) return 'I Boost non valgono nella Lega.'
  if (battle.tipo === 'Selvatico') return null
  const trainer = battle.allenatoreId !== undefined ? getAllenatore(battle.allenatoreId) : undefined
  if (!trainer || trainer.tipo !== 'NPC') return 'I Boost non valgono contro capipalestra, rivale e Superquattro.'
  if (/mascherat|seguace/i.test(trainer.nome)) return 'I Boost non valgono contro i Mascherati e i loro seguaci.'
  return null
}

/** Applica il Boost danno a un attacco già calcolato (le mosse senza danno restano invariate). */
export function applyDamageBoost(result: RisultatoMossa): RisultatoMossa {
  if (result.dannoFinale <= 0 || result.mossa.soloStato) return result
  const dannoFinale = roundHalfUp(result.dannoFinale * BOOST_DANNO)
  const difensoreSvenuto = result.difensore.hp - dannoFinale <= 0
  const messaggi = result.messaggi.map(message => message === `${result.difensore.nome} subisce ${result.dannoFinale} danni.`
    ? `${result.difensore.nome} subisce ${dannoFinale} danni (Boost danno +25%).` : message)
  if (difensoreSvenuto && !result.difensoreSvenuto) messaggi.push(`${result.difensore.nome} non può più combattere!`)
  return { ...result, dannoFinale, difensoreSvenuto, messaggi }
}
