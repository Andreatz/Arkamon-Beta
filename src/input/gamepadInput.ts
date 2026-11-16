/**
 * Gamepad: logica pura (mappatura "standard" del browser, ripetizione, scelta del fuoco).
 * Il ponte con il DOM è GamepadBridge.tsx.
 */

export type PadAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back' | 'menu' | 'prev-tab' | 'next-tab'
export type PadDirection = 'up' | 'down' | 'left' | 'right'

export interface PadSnapshot {
  buttons: readonly boolean[]
  axes: readonly number[]
}

/** Pulsanti della mappatura standard: A, B, LB, RB, Start e croce direzionale. */
const BUTTONS: readonly [number, PadAction][] = [
  [0, 'confirm'], [1, 'back'], [4, 'prev-tab'], [5, 'next-tab'], [9, 'menu'],
  [12, 'up'], [13, 'down'], [14, 'left'], [15, 'right'],
]
/** Zona morta della levetta sinistra. */
export const STICK_THRESHOLD = 0.55
/** Prima ripetizione di una direzione tenuta premuta, poi una ogni intervallo. */
export const REPEAT_DELAY_MS = 380
export const REPEAT_INTERVAL_MS = 110

const DIRECTIONS = new Set<PadAction>(['up', 'down', 'left', 'right'])

/** Azioni tenute premute in questo istante (più gamepad si sommano). */
export function heldActions(snapshots: readonly PadSnapshot[]): Set<PadAction> {
  const held = new Set<PadAction>()
  for (const pad of snapshots) {
    for (const [index, action] of BUTTONS) if (pad.buttons[index]) held.add(action)
    const [x = 0, y = 0] = pad.axes
    if (x <= -STICK_THRESHOLD) held.add('left')
    if (x >= STICK_THRESHOLD) held.add('right')
    if (y <= -STICK_THRESHOLD) held.add('up')
    if (y >= STICK_THRESHOLD) held.add('down')
  }
  return held
}

export interface PadState {
  /** Istante della pressione e dell'ultima ripetizione di ogni azione tenuta. */
  readonly pressed: ReadonlyMap<PadAction, { since: number; last: number }>
}

export const INITIAL_PAD_STATE: PadState = { pressed: new Map() }

/**
 * Avanza di un fotogramma: un'azione scatta alla pressione; le direzioni tenute
 * ripetono dopo REPEAT_DELAY_MS ogni REPEAT_INTERVAL_MS. Rilasciare azzera.
 */
export function stepPad(state: PadState, held: ReadonlySet<PadAction>, now: number): { state: PadState; fired: PadAction[] } {
  const pressed = new Map<PadAction, { since: number; last: number }>()
  const fired: PadAction[] = []
  for (const action of held) {
    const previous = state.pressed.get(action)
    if (!previous) {
      fired.push(action)
      pressed.set(action, { since: now, last: now })
      continue
    }
    if (DIRECTIONS.has(action) && now - previous.since >= REPEAT_DELAY_MS && now - previous.last >= REPEAT_INTERVAL_MS) {
      fired.push(action)
      pressed.set(action, { since: previous.since, last: now })
      continue
    }
    pressed.set(action, previous)
  }
  return { state: { pressed }, fired }
}

export interface FocusRect { left: number; top: number; width: number; height: number }

/**
 * Indice del candidato più vicino nella direzione data, oppure -1. Conta la distanza
 * lungo la direzione più il doppio dello scarto laterale, così la selezione resta in riga.
 */
export function nearestInDirection(from: FocusRect, candidates: readonly FocusRect[], direction: PadDirection): number {
  const cx = from.left + from.width / 2, cy = from.top + from.height / 2
  let best = -1, bestScore = Infinity
  candidates.forEach((rect, index) => {
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2
    const dx = x - cx, dy = y - cy
    const along = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy
    const across = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx)
    if (along <= 1) return
    const score = along + across * 2
    if (score < bestScore) { bestScore = score; best = index }
  })
  return best
}

/** Tasto equivalente usato per i componenti che già gestiscono la tastiera. */
export const KEY_FOR_ACTION: Partial<Record<PadAction, string>> = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  back: 'Escape', 'prev-tab': 'PageUp', 'next-tab': 'PageDown',
}
