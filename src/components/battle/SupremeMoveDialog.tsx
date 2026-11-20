import { useEffect, useId, useRef } from 'react'
import { èMossaCura, èMossaSoloStato } from '@/engine/battleEngine'
import type { MossaDef } from '@/types'
import { makeDialogBackgroundInert } from './modalFocus'
import { ArkaButton, ArkaModalFrame } from '@/ui-system/primitives'

interface SupremeMoveDialogProps {
  moves: { mossa: MossaDef; idx: 0 | 1 | 2 }[]
  level: number
  recoil: number
  pokemonName: string
  onChoose: (idx: 0 | 1 | 2) => void
  onClose: () => void
}

/** Selects an attack; the battle scene still resolves status, damage and recoil. */
export function SupremeMoveDialog({ moves, level, recoil, pokemonName, onChoose, onClose }: SupremeMoveDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const releaseDialogRef = useRef<(() => void) | null>(null)
  const dismissedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const attacks = moves.filter(({ mossa }) => !èMossaCura(mossa) && !èMossaSoloStato(mossa))

  const dismiss = () => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    releaseDialogRef.current?.()
    onCloseRef.current()
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const restoreBackground = makeDialogBackgroundInert(dialog)
    let released = false
    const buttons = () => Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
    const focusFirst = () => (buttons()[0] ?? dialog).focus()
    const trapFocus = (event: FocusEvent) => {
      if (!released && event.target instanceof Node && !dialog.contains(event.target)) focusFirst()
    }
    const trapKeyboard = (event: KeyboardEvent) => {
      if (released) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        dismiss()
        return
      }
      if (event.key !== 'Tab') return
      event.preventDefault()
      event.stopPropagation()
      const choices = buttons()
      if (choices.length === 0) {
        dialog.focus({ preventScroll: true })
        return
      }
      const current = choices.findIndex((button) => button === document.activeElement)
      const next = current < 0
        ? event.shiftKey ? choices.length - 1 : 0
        : (current + (event.shiftKey ? -1 : 1) + choices.length) % choices.length
      // Let keyboard focus reveal an off-screen choice inside the scrollable panel.
      choices[next].focus()
    }
    document.addEventListener('focusin', trapFocus)
    document.addEventListener('keydown', trapKeyboard, true)
    const releaseDialog = () => {
      if (released) return
      released = true
      document.removeEventListener('focusin', trapFocus)
      document.removeEventListener('keydown', trapKeyboard, true)
      restoreBackground()
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
    releaseDialogRef.current = releaseDialog
    // Keep the cost and title visible on opening; Tab reveals the first attack.
    dialog.focus({ preventScroll: true })
    return () => {
      releaseDialog()
      if (releaseDialogRef.current === releaseDialog) releaseDialogRef.current = null
    }
    // Callback refs keep Escape current without replaying background/focus isolation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (idx: 0 | 1 | 2) => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    // Release before the action can open its status die or another modal.
    releaseDialogRef.current?.()
    onChoose(idx)
  }

  // Audit fase 2: finestra costruita con i componenti del design system (pannello blu e oro, pulsanti comuni).
  return (
    <ArkaModalFrame
      ref={dialogRef}
      tabIndex={-1}
      titleId={titleId}
      descriptionId={descriptionId}
      kicker={`${pokemonName} · Livello ${level}`}
      title="Mossa Suprema"
      description={<>Scegli l’attacco: <strong>danno ×2</strong>. Contraccolpo: <strong>{recoil} HP</strong> al livello attuale (50% degli HP massimi).</>}
      className="z-[900] outline-none"
      onKeyDown={(event) => event.stopPropagation()}
      footer={<ArkaButton onClick={dismiss}>Annulla</ArkaButton>}
    >
      <p className="arka-ds-note text-center">
        Se il bersaglio va KO, {pokemonName} guadagna prima esperienza e livelli. Il contraccolpo si calcola poi sugli HP massimi aggiornati.
      </p>
      <div className="arka-ds-modal-actions">
        {attacks.map(({ mossa, idx }) => (
          <ArkaButton key={idx} tone="primary" size="lg" onClick={() => choose(idx)}>{mossa.nome}</ArkaButton>
        ))}
        {attacks.length === 0 && <p role="status" className="arka-ds-note text-center">Nessun attacco disponibile.</p>}
      </div>
    </ArkaModalFrame>
  )
}
