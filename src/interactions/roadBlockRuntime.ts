import type { LeagueState } from '@/league/leagueModel'
import type { RoadBlockContext } from '@/engine/roadBlocks'
import type { StatoGiocatore } from '@/types'
import { isInteractionComplete } from './runtime'
import type { InteractionProgress } from './types'

export interface RoadBlockState {
  giocatore1: Pick<StatoGiocatore, 'allenatoriSconfitti'>
  giocatore2: Pick<StatoGiocatore, 'allenatoriSconfitti'>
  interactionProgress: InteractionProgress
  league: Pick<LeagueState, 'players' | 'winner'>
}

/** Le condizioni di riapertura riguardano sempre il giocatore che si muove. */
export function roadBlockContextFor(state: RoadBlockState, playerId: 1 | 2): RoadBlockContext {
  return {
    gymIds: state[playerId === 1 ? 'giocatore1' : 'giocatore2'].allenatoriSconfitti,
    leagueWon: state.league.players[playerId].status === 'completed' || state.league.winner?.playerId === playerId,
    isCompleted: (id) => isInteractionComplete(state.interactionProgress, { id, scope: 'player' }, playerId),
  }
}
