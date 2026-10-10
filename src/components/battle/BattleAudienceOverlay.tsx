import { useEffect, useRef } from 'react'
import { AudienceQrCode } from '@/audience/AudienceQrCode'
import type { AudienceRoundRequest, AudienceRound, AudienceTurnStatus } from '@/audience/types'
import { makeDialogBackgroundInert } from './modalFocus'
import './battleAudienceOverlay.css'

export function BattleAudienceOverlay({ request, round, status, remainingMs, error, joinUrl,
  onRetry, onCloseEarly, onFallback }: {
  request: AudienceRoundRequest
  round: AudienceRound | null
  status: AudienceTurnStatus
  remainingMs: number
  error: string | null
  joinUrl: string
  onRetry: () => void
  onCloseEarly: () => void | Promise<void>
  onFallback: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const firstButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!root.current) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const release = makeDialogBackgroundInert(root.current)
    firstButton.current?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = [...root.current!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')]
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    root.current.addEventListener('keydown', trap)
    const element = root.current
    return () => { element.removeEventListener('keydown', trap); release(); previous?.focus() }
  }, [])
  const counts = round?.turnKey === request.turnKey ? round.counts : [0, 0, 0]
  const total = counts.reduce((sum, value) => sum + value, 0)
  return <div ref={root} className="battle-audience-overlay" role="dialog" aria-modal="true" aria-label="Votazione del pubblico">
    <section className="battle-audience-card">
      <header><div><p className="battle-audience-channel">{request.channel === 'npc' ? 'Pubblico NPC' : 'Pubblico Capipalestra e PvP'}</p>
        <h2>Il pubblico sceglie la mossa</h2><p>{request.pokemon.name} · livello {request.pokemon.level} · {request.trainer.name}</p></div>
        <strong className="battle-audience-timer" role="timer" aria-label="Tempo di votazione">
          {status === 'opening' ? '…' : status === 'error' ? '!' : `${Math.max(0, Math.ceil(remainingMs / 1000))} s`}
        </strong></header>
      <div className="battle-audience-content"><div className="battle-audience-options">
        {request.options.map((option) => <div key={option.index} className="battle-audience-option">
          <div><strong>{option.name}</strong><span>{option.type} · {option.description}</span></div>
          <b>{counts[option.index]} {counts[option.index] === 1 ? 'voto' : 'voti'}</b>
        </div>)}
        <p role="status">{status === 'error' ? error ?? 'Collegamento interrotto. Riprova oppure continua senza votazione.'
          : status === 'opening' ? 'Apertura della votazione…' : `${total} ${total === 1 ? 'voto ricevuto' : 'voti ricevuti'}`}</p>
        <p className="battle-audience-rules">Un voto per turno, modificabile fino alla chiusura. In parità si sorteggia fra le mosse più votate; senza voti sceglie il rivale.</p>
      </div>{joinUrl && <aside><AudienceQrCode url={joinUrl} label="Inquadra per votare dal telefono" /></aside>}</div>
      <footer>{status === 'error' ? <button ref={firstButton} className="arka-button" onClick={onRetry}>Riprova collegamento</button>
        : <button ref={firstButton} className="arka-button" disabled={status !== 'open'} onClick={() => void onCloseEarly()}>Chiudi votazione</button>}
        <button className="arka-button-secondary" onClick={onFallback}>Continua senza votazione</button></footer>
    </section>
  </div>
}
