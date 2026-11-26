import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { BattleChronicle } from '@/types'
import { battleOutcomeSummary } from './battleOutcomeSummary'
import { motion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { GameArt, gameArtUrl } from '@/ui-system/GameArt'
import { getAnimationDuration, useGameMotionPreferences } from '@/settings/gamePreferences'
import { AnimatedNumber } from '@/motion/ui/AnimatedNumber'
import { flyCoins } from '@/motion/ui/coinFlight'
import { playSfx } from '@/utils/soundManager'

/** Il livello si annuncia dopo la fanfara di vittoria, che parte quando compare la scheda. */
const LEVEL_UP_AFTER_FANFARE_MS = 2600
import './battleRpg.css'

/** Audit fase 6: intervallo fra una riga del riepilogo e la successiva (ms, a velocità normale). */
export const RESULT_ROW_STAGGER_MS = 260

/**
 * Valore che parte da `from` e, dopo `delayMs`, conta fino a `to`.
 * Con il movimento ridotto mostra subito il valore finale.
 */
function CountUp({ from, to, delayMs, format, onDone }: { from: number; to: number; delayMs: number; format?: (value: number) => string; onDone?: () => void }) {
  const { reducedMotion } = useGameMotionPreferences()
  const [value, setValue] = useState(reducedMotion ? to : from)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (reducedMotion) { setValue(to); return }
    const timer = window.setTimeout(() => { setValue(to); done.current?.() }, getAnimationDuration(delayMs))
    return () => window.clearTimeout(timer)
  }, [from, to, delayMs, reducedMotion])
  return <AnimatedNumber value={value} format={format} />
}

/** Riga del riepilogo che entra dopo le precedenti. */
function ResultRow({ index, children, className, as = 'p' }: { index: number; children: ReactNode; className?: string; as?: 'p' | 'li' | 'div' }) {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const Tag = as === 'li' ? motion.li : as === 'div' ? motion.div : motion.p
  return <Tag className={className} initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: reducedMotion ? 0 : .28 / speed, delay: reducedMotion ? 0 : index * RESULT_ROW_STAGGER_MS / 1000 / speed }}>{children}</Tag>
}

/**
 * Scheda di fine battaglia. Sostituisce il box messaggi, quindi riporta anche
 * le ultime righe (`messages`) che altrimenti resterebbero coperte.
 * Audit fase 6: le righe entrano in sequenza, livelli e monete contano fino al valore
 * finale e le monete guadagnate volano verso il menù Partita (il borsellino).
 */
export function BattleResultCard({ chronicle, outcome, gymVictory = false, messages = [], coinDelta = 0 }: { chronicle: BattleChronicle; outcome: string | null; gymVictory?: boolean; messages?: readonly string[]; coinDelta?: number }) {
  const summary = battleOutcomeSummary(chronicle)
  const { reducedMotion, speed } = useGameMotionPreferences()
  const coinRef = useRef<HTMLSpanElement>(null)
  let row = 1
  const levelRows = summary.levels.map((level) => ({ level, index: ++row }))
  const coinIndex = coinDelta !== 0 ? ++row : -1
  const coinDelayMs = coinIndex * RESULT_ROW_STAGGER_MS + 200
  const sealed = outcome === 'cattura' || gymVictory
  return <section className="battle-result-card" aria-label="Risultato della battaglia" data-battle-result-card data-result-outcome={gymVictory ? 'palestra' : outcome ?? undefined}>
    {sealed && <motion.img src={gymVictory ? assetUrl('/ui/player-kit/reward-badge.svg') : gameArtUrl('item-sacchettino') ?? assetUrl('/ui/player-kit/item-sphere.svg')}
      alt="" aria-hidden="true" className="battle-result-seal" initial={reducedMotion ? false : { scale: .4, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 13, duration: .6 / speed }} />}
    {sealed && !reducedMotion && <span className="battle-result-seal-burst" aria-hidden="true" />}
    <motion.h2 initial={reducedMotion ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducedMotion ? 0 : .32 / speed }}>
      {gymVictory ? 'Palestra superata!' : outcome === 'vittoria' ? 'Vittoria!' : outcome === 'sconfitta' ? 'Squadra sconfitta' : outcome === 'cattura' ? 'Arkamon catturato!' : 'Battaglia conclusa'}
    </motion.h2>
    <ResultRow index={1}>{summary.partial ? 'Negli ultimi eventi: ' : ''}{summary.enemyKOs} KO avversari · {summary.playerKOs} KO in squadra</ResultRow>
    {levelRows.length > 0 && <ul aria-label="Livelli guadagnati">{levelRows.map(({ level, index }) => <ResultRow as="li" key={`${level.name}-${index}`} index={index} className="battle-result-level">
      <span>{level.name} · Lv. </span>
      <CountUp from={level.before} to={level.after} delayMs={index * RESULT_ROW_STAGGER_MS + 160} onDone={index === levelRows[0].index ? () => playSfx('jingle.levelup', { delayMs: LEVEL_UP_AFTER_FANFARE_MS }) : undefined} />
      <span className="battle-result-level-gain" aria-hidden="true">+{level.after - level.before}</span>
    </ResultRow>)}</ul>}
    {coinDelta !== 0 && <ResultRow as="div" index={coinIndex} className="battle-result-coins">
      <span ref={coinRef} className="battle-result-coins__icon"><GameArt id="coin" /></span>
      <span className="battle-result-coins__value" data-delta={coinDelta > 0 ? 'gain' : 'loss'}>
        {coinDelta > 0 ? '+' : '−'}<CountUp from={0} to={Math.abs(coinDelta)} delayMs={coinDelayMs}
          onDone={() => { if (coinDelta > 0) flyCoins(coinRef.current, document.querySelector('[data-battle-wallet], button[aria-label="Partita"]'), Math.min(12, 4 + Math.round(coinDelta / 200))) }} /> ₳
        <span className="sr-only">{coinDelta > 0 ? ' guadagnati' : ' persi'}</span>
      </span>
    </ResultRow>}
    {messages.length > 0 && <div className="battle-result-messages" role="status" aria-live="polite">{messages.slice(-3).map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}</div>}
    <p className="battle-result-progress">Premi Prosegui: la squadra verrà curata completamente.</p>
  </section>
}
