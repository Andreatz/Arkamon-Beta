import { useCallback, useRef, useState, type ReactNode } from 'react'
import { GameDialog } from './GameDialog'
import { GameButton } from './GameButton'

export interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Azione distruttiva: il pulsante di conferma prende il tono di pericolo. */
  danger?: boolean
}

/**
 * Conferma in stile di gioco al posto di `window.confirm` (audit, sezione 4).
 * `confirm(opzioni)` restituisce una promessa: vero se il giocatore conferma, falso se annulla
 * o chiude con Esc. Il dialogo va reso con l'elemento `dialog` restituito dall'hook.
 */
export function useConfirmDialog(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [request, setRequest] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const settle = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setRequest(null)
  }, [])
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    resolver.current?.(false)
    resolver.current = resolve
    setRequest(options)
  }), [])
  const dialog = request ? <GameDialog title={request.title} onClose={() => settle(false)} className="arka-confirm-dialog max-w-lg">
    <div className="flex flex-col gap-5" data-confirm-dialog>
      <p className="text-base leading-relaxed text-slate-200">{request.message}</p>
      <div className="flex flex-wrap justify-end gap-3">
        <GameButton onClick={() => settle(false)}>{request.cancelLabel ?? 'Annulla'}</GameButton>
        <GameButton tone={request.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>{request.confirmLabel ?? 'Conferma'}</GameButton>
      </div>
    </div>
  </GameDialog> : null
  return [confirm, dialog]
}
