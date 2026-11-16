import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { heldActions, INITIAL_PAD_STATE, KEY_FOR_ACTION, nearestInDirection, stepPad, type PadAction, type PadDirection, type PadSnapshot } from './gamepadInput'
import '@/motion/ui/liveInterface.css'

const FOCUSABLE = 'button:not(:disabled), a[href], select:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/** Zona attiva: l'ultimo dialogo aperto, altrimenti il palco del gioco. */
function activeScope(): HTMLElement {
  const dialogs = document.querySelectorAll<HTMLElement>('[data-game-dialog]')
  return dialogs[dialogs.length - 1] ?? document.querySelector<HTMLElement>('.arka-stage') ?? document.body
}

function focusables(scope: HTMLElement): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter(element => !element.closest('[inert], [hidden], [aria-hidden="true"]') && element.getClientRects().length > 0)
}

function focusedIn(scope: HTMLElement): HTMLElement | null {
  const active = document.activeElement
  return active instanceof HTMLElement && active !== document.body && scope.contains(active) ? active : null
}

/** Sposta il fuoco geometricamente quando nessun componente ha gestito la freccia. */
function moveFocus(direction: PadDirection) {
  const scope = activeScope()
  const items = focusables(scope)
  const current = focusedIn(scope)
  if (!current) { items[0]?.focus(); return }
  const others = items.filter(item => item !== current)
  const index = nearestInDirection(current.getBoundingClientRect(), others.map(item => item.getBoundingClientRect()), direction)
  others[index]?.focus()
  others[index]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}

function pressKey(key: string): boolean {
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }))
  return event.defaultPrevented
}

function rumble(pads: Gamepad[], strength: number) {
  for (const pad of pads) {
    const actuator = (pad as Gamepad & { vibrationActuator?: { playEffect?: (type: string, params: object) => Promise<unknown> } }).vibrationActuator
    void actuator?.playEffect?.('dual-rumble', { duration: 45, weakMagnitude: strength, strongMagnitude: strength / 3 })?.catch(() => {})
  }
}

function perform(action: PadAction, pads: Gamepad[]) {
  if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
    // Prima i componenti che gestiscono già le frecce (SpatialNavigation, griglie, cursori).
    if (!pressKey(KEY_FOR_ACTION[action]!)) moveFocus(action)
    return
  }
  if (action === 'confirm') {
    const scope = activeScope()
    const current = focusedIn(scope)
    if (!current) { focusables(scope)[0]?.focus(); return }
    rumble(pads, 0.35)
    if (current instanceof HTMLSelectElement || current instanceof HTMLTextAreaElement
      || (current instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit'].includes(current.type))) return
    current.click()
    return
  }
  if (action === 'back') { rumble(pads, 0.2); pressKey('Escape'); return }
  if (action === 'menu') {
    if (document.querySelector('[data-game-dialog]')) { pressKey('Escape'); return }
    document.querySelector<HTMLElement>('[data-player-tools-launcher]')?.click()
    return
  }
  pressKey(KEY_FOR_ACTION[action]!)
}

const snapshot = (pad: Gamepad): PadSnapshot => ({ buttons: pad.buttons.map(button => button.pressed), axes: pad.axes })

/**
 * Ponte fra gamepad e interfaccia (audit, sezione 6): croce o levetta muovono la
 * selezione, A conferma, B indietro, Start apre il menù, LB / RB cambiano scheda.
 * Mentre si usa il gamepad `html[data-input-mode="gamepad"]` e compaiono i suggerimenti.
 */
export function GamepadBridge() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return
    let frame = 0
    let state = INITIAL_PAD_STATE
    let usingPad = false
    const setMode = (gamepad: boolean) => {
      if (usingPad === gamepad) return
      usingPad = gamepad
      setActive(gamepad)
      if (gamepad) document.documentElement.setAttribute('data-input-mode', 'gamepad')
      else document.documentElement.removeAttribute('data-input-mode')
    }
    const connected = () => [...navigator.getGamepads()].filter((pad): pad is Gamepad => !!pad && pad.connected)
    const loop = () => {
      const pads = connected()
      if (!pads.length) { frame = 0; state = INITIAL_PAD_STATE; return }
      const step = stepPad(state, heldActions(pads.map(snapshot)), performance.now())
      state = step.state
      if (step.fired.length) setMode(true)
      for (const action of step.fired) perform(action, pads)
      frame = requestAnimationFrame(loop)
    }
    const start = () => { if (!frame) frame = requestAnimationFrame(loop) }
    // Mouse e tastiera vera riportano l'interfaccia alla modalità normale.
    const leave = (event: Event) => { if (event.isTrusted) setMode(false) }
    window.addEventListener('gamepadconnected', start)
    window.addEventListener('pointerdown', leave, true)
    window.addEventListener('mousemove', leave, true)
    window.addEventListener('keydown', leave, true)
    if (connected().length) start()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('gamepadconnected', start)
      window.removeEventListener('pointerdown', leave, true)
      window.removeEventListener('mousemove', leave, true)
      window.removeEventListener('keydown', leave, true)
      document.documentElement.removeAttribute('data-input-mode')
    }
  }, [])

  if (!active || typeof document === 'undefined') return null
  return createPortal(<div className="arka-gamepad-hints" role="note" aria-label="Comandi del gamepad">
    <span><b>A</b>Conferma</span><span><b>B</b>Indietro</span><span><b>☰</b>Menù</span><span><b>LB</b><b>RB</b>Schede</span>
  </div>, document.body)
}
