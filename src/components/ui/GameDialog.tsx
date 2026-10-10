import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { makeDialogBackgroundInert } from '@/components/battle/modalFocus'

export function GameDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const root = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const dialog = root.current
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const release = makeDialogBackgroundInert(dialog)
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')).filter((node) => !node.hidden && node.getClientRects().length)
    focusables()[0]?.focus()
    const keys = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-battle-log-dialog]')) return
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const items = focusables(), current = items.indexOf(document.activeElement as HTMLElement)
      const next = event.shiftKey ? (current <= 0 ? items.length - 1 : current - 1) : (current + 1) % items.length
      event.preventDefault(); (items[next] ?? dialog).focus()
    }
    const refocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-battle-log-dialog]')) return
      if (event.target instanceof Node && !dialog.contains(event.target)) (focusables()[0] ?? dialog).focus()
    }
    document.addEventListener('keydown', keys, true)
    document.addEventListener('focusin', refocus)
    return () => { document.removeEventListener('keydown', keys, true); document.removeEventListener('focusin', refocus); release(); if (previous?.isConnected) previous.focus() }
  }, [])
  return createPortal(<div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-3" data-game-dialog>
    <section ref={root} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col rounded-xl border border-violet-400 bg-slate-950 text-white shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-600 p-4"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="rounded border border-slate-400 px-3 py-2">Chiudi</button></header>
      <div className="min-h-0 overflow-y-auto p-4">{children}</div>
    </section>
  </div>, document.body)
}
