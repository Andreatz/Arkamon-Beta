import { useCallback, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from '../vfx/AnimatedSprite'
import { getBattleDiceSequence } from './battleDiceAssets'
import './battleDice.css'

export interface DiceRollDisplay {
  id: number
  side: 'A' | 'B'
  moveName: string
  rolls: number[]
  increment: number
  damage: number
}

export function DiceRollOverlay({ roll, forceFallback = false }: {
  roll: DiceRollDisplay
  forceFallback?: boolean
}) {
  const reducedMotion = Boolean(useReducedMotion())
  const total = roll.rolls.reduce((sum, value) => sum + value, 0)
  const gridStyle = {
    '--battle-dice-columns': Math.max(1, Math.min(roll.rolls.length, 6)),
    '--battle-dice-mobile-columns': Math.max(1, Math.min(roll.rolls.length, roll.rolls.length > 9 ? 4 : 3)),
    '--battle-dice-cell-width': roll.rolls.length > 12 ? '80px' : '106px',
    '--battle-dice-mobile-cell-width': roll.rolls.length > 12 ? '50px' : '94px',
  } as CSSProperties

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.88, y: -18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: reducedMotion ? 0 : 0.22 }}
        className="battle-dice-panel rounded-md border border-white/20 bg-slate-950/90 px-5 py-4 text-center text-white shadow-2xl backdrop-blur-sm"
      >
        <p className="text-[11px] font-black uppercase text-blue-300 arka-letter-outline">
          {roll.side === 'A' ? 'Lancio giocatore' : 'Lancio avversario'}
        </p>
        <h3 className="mt-1 text-lg font-black">{roll.moveName}</h3>
        <div className="battle-dice-grid" style={gridStyle}>
          {roll.rolls.map((value, index) => (
            <BattleDie key={`${roll.id}-${index}-${value}`} value={value} forceFallback={forceFallback} />
          ))}
        </div>
        <p className="mt-3 text-xs font-bold leading-relaxed text-slate-200">
          Dadi: {roll.rolls.join(' + ')}
          {roll.increment > 0 ? ` + ${roll.increment}` : ''}
          {' = '}{total + roll.increment}
        </p>
        <p className="mt-1 text-base font-black text-rose-300">Danno finale: {roll.damage}</p>
      </motion.div>
    </div>
  )
}

function BattleDie({ value, forceFallback }: { value: number; forceFallback: boolean }) {
  const [phase, setPhase] = useState<'intro' | 'result'>('intro')
  const [failed, setFailed] = useState(false)
  const reducedMotion = Boolean(useReducedMotion())
  const revealResult = useCallback(() => setPhase('result'), [])
  const showFallback = useCallback(() => setFailed(true), [])
  const sequence = getBattleDiceSequence(value)
  const showingResult = reducedMotion || phase === 'result'
  const segment = sequence && (showingResult ? sequence.result : sequence.intro)

  return (
    <div className="battle-die" role="img" aria-label={`Dado: ${value}`}>
      {failed || forceFallback || !segment ? (
        <span className="battle-die-fallback" aria-hidden="true">{value}</span>
      ) : (
        <div className="battle-die-sprite">
          <AnimatedSprite
            key={`${value}-${showingResult ? 'result' : 'intro'}`}
            src={assetUrl(segment.src)}
            {...segment.sprite}
            width={segment.sprite.frameWidth}
            height={segment.sprite.frameHeight}
            responsive
            className="battle-die-frames"
            loop={false}
            onComplete={showingResult ? undefined : revealResult}
            onError={showFallback}
          />
        </div>
      )}
    </div>
  )
}
