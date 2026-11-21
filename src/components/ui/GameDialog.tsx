import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { makeDialogBackgroundInert } from '@/components/battle/modalFocus'
import { DialogNavigationContext, type DialogBackHandler } from './DialogNavigation'
import './studioArtwork.css'
import './menuArtworkFallback.css'
import './gameDialogMotion.css'
import '@/ui-system/primitives.css'
import { getAnimationDuration, useGamePreferences } from '@/settings/gamePreferences'

/**
 * Finché almeno un dialogo è aperto la scena presentata arretra dietro di esso
 * (`html[data-arka-dialog-open]`, vedi gameDialogMotion.css). Il contatore regge i dialoghi annidati.
 */
let openDialogs = 0
function holdStageBehindDialog(): () => void {
  openDialogs += 1
  document.documentElement.setAttribute('data-arka-dialog-open', '')
  let released = false
  return () => {
    if (released) return
    released = true
    openDialogs = Math.max(0, openDialogs - 1)
    if (!openDialogs) document.documentElement.removeAttribute('data-arka-dialog-open')
  }
}

function prefersStillDialogs(): boolean {
  const preference = useGamePreferences.getState().reducedMotion
  if (preference !== 'system') return preference === 'on'
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * Animazione di chiusura: qualunque cosa chiuda il dialogo (comando, Esc o la scena),
 * una copia inerte e nascosta ai lettori di schermo scende e svanisce, poi si rimuove.
 */
function playDialogExit(overlay: HTMLElement | null): void {
  if (!overlay?.isConnected || prefersStillDialogs()) return
  const ghost = overlay.cloneNode(true) as HTMLElement
  ghost.removeAttribute('data-game-dialog')
  ghost.setAttribute('aria-hidden', 'true')
  ghost.setAttribute('inert', '')
  ghost.classList.add('arka-dialog-ghost')
  ghost.querySelectorAll('[role="dialog"]').forEach(node => node.removeAttribute('role'))
  ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'))
  document.body.appendChild(ghost)
  const remove = () => ghost.remove()
  ghost.addEventListener('animationend', event => { if (event.target === ghost) remove() })
  window.setTimeout(remove, getAnimationDuration(320) + 80)
}

export function GameDialog({ title, onClose, children, className = '', showCloseButton = true }: { title: string; onClose: () => void; children: ReactNode; className?: string; showCloseButton?: boolean }) {
  const root = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  const back = useRef<DialogBackHandler | null>(null)
  close.current = onClose
  useEffect(() => {
    const dialog = root.current
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const release = makeDialogBackgroundInert(dialog)
    const releaseStage = holdStageBehindDialog()
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],summary,[tabindex]'))
      .filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[hidden],[inert]')
        && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden')
      .sort((a, b) => (a.tabIndex || Number.MAX_SAFE_INTEGER) - (b.tabIndex || Number.MAX_SAFE_INTEGER))
    ;(focusables()[0] ?? dialog).focus()
    const keys = (event: KeyboardEvent) => {
      if (dialog.closest('[inert]')) return
      if (event.target instanceof Element && event.target.closest('[data-battle-log-dialog]')) return
      if (event.key === 'Escape') { if (back.current?.(event)) return; event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const items = focusables(), current = items.indexOf(document.activeElement as HTMLElement)
      const next = event.shiftKey ? (current <= 0 ? items.length - 1 : current - 1) : (current + 1) % items.length
      event.preventDefault(); (items[next] ?? dialog).focus()
    }
    const refocus = (event: FocusEvent) => {
      if (dialog.closest('[inert]')) return
      if (event.target instanceof Element && event.target.closest('[data-battle-log-dialog]')) return
      if (event.target instanceof Node && !dialog.contains(event.target)) (focusables()[0] ?? dialog).focus()
    }
    document.addEventListener('keydown', keys, true)
    document.addEventListener('focusin', refocus)
    const overlay = dialog.parentElement
    return () => { playDialogExit(overlay); document.removeEventListener('keydown', keys, true); document.removeEventListener('focusin', refocus); release(); releaseStage(); if (previous?.isConnected) previous.focus() }
  }, [])
  return createPortal(<div className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-black/75 p-3" data-game-dialog>
    <section ref={root} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`arka-ds-panel arka-ds-dialog flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col !p-0 ${className}`}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--arka-ui-line)] px-5 py-3"><h2 className="arka-ds-title arka-ds-dialog-title">{title}</h2>{showCloseButton && <button type="button" onClick={onClose} className="studio-dialog-close" data-menu-artwork="css" aria-label="Chiudi"><span aria-hidden="true">×</span></button>}</header>
      <div className="min-h-0 overflow-y-auto px-5 py-4"><DialogNavigationContext.Provider value={handler => { back.current = handler; return () => { if (back.current === handler) back.current = null } }}>{children}</DialogNavigationContext.Provider></div>
    </section>
  </div>, document.body)
}
