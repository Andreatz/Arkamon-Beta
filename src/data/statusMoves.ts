import rules from './statusMoveRules.json'
import type { MossaDef } from '@/types'

export interface StatusMoveRule { testo: string; effetto: string; valore: number | null }
export const STATUS_MOVE_RULES: Readonly<Record<string, StatusMoveRule>> = rules.regole

/**
 * Le mosse Status del Database portano solo il nome della regola: effetto e valore
 * arrivano da statusMoveRules.json, così si possono ritoccare senza toccare il codice.
 */
export function resolveStatusMove(move: MossaDef): MossaDef {
  if (!move.soloStato || !move.regolaStato) return move
  const rule = STATUS_MOVE_RULES[move.regolaStato]
  if (!rule) return move
  return { ...move, effetto: rule.effetto, valoreEffetto: rule.valore }
}
