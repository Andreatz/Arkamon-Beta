/** Direzione dell'animazione fra due viste del Menù Partita (logica pura). */

export type NavigationDirection = 'forward' | 'back' | 'flip'

export interface NavigationView {
  /** Schermata principale o strumento ausiliario mostrato. */
  pane: string
  playerId: 1 | 2
}

/**
 * - cambio giocatore: `flip` (il pannello si ribalta);
 * - fra schede principali: avanti o indietro secondo l'ordine della barra;
 * - verso uno strumento (Registro, Impostazioni…) si va avanti, tornando si va indietro.
 */
export function navigationDirection(previous: NavigationView, next: NavigationView, order: readonly string[]): NavigationDirection | undefined {
  if (previous.playerId !== next.playerId) return 'flip'
  if (previous.pane === next.pane) return undefined
  const from = order.indexOf(previous.pane)
  const to = order.indexOf(next.pane)
  if (from >= 0 && to >= 0) return to > from ? 'forward' : 'back'
  if (from >= 0) return 'forward'
  if (to >= 0) return 'back'
  return 'forward'
}
