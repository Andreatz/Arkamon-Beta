/** Lightweight entry points shared by scenes without loading the tools interface. */
export const PLAYER_UI_SCREENS = ['partita', 'squadra', 'deposito', 'arkadex', 'analisi', 'borsa'] as const
export type PlayerUiScreen = typeof PLAYER_UI_SCREENS[number] | 'negozio'
/** Audit fase 3: schermate nella barra di navigazione. L'Analisi è confluita nella scheda «Dettagli» della Squadra;
 *  la schermata resta raggiungibile dal Deposito per i compagni in riserva e dai collegamenti diretti. */
export const PLAYER_UI_NAV_SCREENS = ['partita', 'squadra', 'deposito', 'arkadex', 'borsa'] as const
/** Historical entry points remain valid and open the corresponding Register tab. */
export type PlayerUiAuxiliary = 'register' | 'race' | 'recap' | 'journal' | 'backup' | 'settings' | 'chronicles' | 'match' | 'challenges'
export interface PlayerUiOpenRequest { screen: PlayerUiScreen; playerId?: 1 | 2; instanceId?: string; shopInteractionId?: string }
export const PLAYER_UI_OPEN_EVENT = 'arkamon:open-player-ui'

export function isPlayerUiScreen(value: unknown): value is PlayerUiScreen {
  return value === 'negozio' || (typeof value === 'string' && PLAYER_UI_SCREENS.some(screen => screen === value))
}

/** Opening the window does not navigate or change the active game player. */
export function openPlayerUi(screen: PlayerUiScreen, options: Omit<PlayerUiOpenRequest, 'screen'> = {}): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<PlayerUiOpenRequest>(PLAYER_UI_OPEN_EVENT, { detail: { screen, ...options } }))
}
