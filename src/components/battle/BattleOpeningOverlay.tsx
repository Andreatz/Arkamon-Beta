import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BattleDie } from './DiceRollOverlay'

export function BattleOpeningOverlay({ kind, value, title, result, onContinue }: {
  kind: 'coin' | 'die'; value: number; title: string; result: string; onContinue: () => void
}) {
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(Boolean(reduced && kind === 'coin'))
  return <div role="dialog" aria-modal="true" aria-label={title} className="absolute inset-0 z-[900] flex items-center justify-center bg-slate-950/85" onKeyDown={(e) => e.stopPropagation()}>
    <div className="flex max-w-lg flex-col items-center gap-6 rounded-2xl border border-amber-300 bg-slate-900 p-8 text-center text-white shadow-2xl">
      <h2 className="text-xl font-bold">{title}</h2>
      {kind === 'coin' ? <div style={{ perspective: 700 }}>
        <motion.div initial={{ rotateY: 0, y: 30 }} animate={{ rotateY: reduced ? 0 : 1800, y: [30, -35, 0] }} transition={{ duration: reduced ? 0 : 2.2, ease: 'easeOut' }} onAnimationComplete={() => setReady(true)} className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-amber-200 bg-gradient-to-br from-yellow-200 via-amber-500 to-yellow-800 text-5xl font-black text-amber-950 shadow-xl">{ready ? (value === 0 ? 'T' : 'C') : '✦'}</motion.div>
      </div> : <div className="w-32"><BattleDie value={value} forceFallback={false} onVisible={() => setReady(true)} /></div>}
      <p role="status" className="min-h-8 font-bold">{ready ? result : kind === 'coin' ? 'La moneta sta girando…' : 'Lancio del dado…'}</p>
      <button autoFocus disabled={!ready} onClick={onContinue} className="rounded-lg bg-amber-300 px-6 py-3 font-bold text-slate-950 disabled:opacity-40">Continua</button>
    </div>
  </div>
}
