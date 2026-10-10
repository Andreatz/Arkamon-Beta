import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '@/store/gameStore'
import { exitChallenge } from './challengeRuntime'

export function ChallengeBanner() {
  const context = useGameStore((state) => state.challengeContext)
  const [confirm, setConfirm] = useState(false), [error, setError] = useState('')
  if (!context) return null
  return createPortal(<aside aria-label="Sfida in corso" className="fixed left-1/2 top-2 z-[950] w-[min(90vw,34rem)] -translate-x-1/2 rounded-lg border border-cyan-300 bg-slate-950/95 p-2 text-center text-sm text-white shadow-xl">
    <strong>{context.session.mode === 'fanta' ? 'Fanta-Team' : 'Sfida a seed'} · Seed {context.session.seed}</strong>
    <p className="text-xs text-slate-300">Campagna conservata separatamente · regole v1</p>
    {confirm ? <div className="mt-2 flex flex-wrap justify-center gap-2"><span>Abbandonare la sfida? Il tentativo non entra in classifica.</span>
      <button className="rounded bg-red-800 px-3 py-2" onClick={() => { const result = exitChallenge(); if (!result.ok) setError(result.message) }}>Conferma uscita</button>
      <button className="rounded border px-3 py-2" onClick={() => setConfirm(false)}>Annulla</button></div>
      : <button className="mt-1 rounded border border-cyan-300 px-3 py-1" onClick={() => setConfirm(true)}>Torna alla campagna</button>}
    {error && <p role="alert">{error}</p>}
  </aside>, document.body)
}
