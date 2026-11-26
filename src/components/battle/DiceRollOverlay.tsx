import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { GameArt, hasGameArt } from '@/ui-system/GameArt'
import { animate, motion } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { assetUrl } from '@/utils/assetUrl'
import { AnimatedSprite } from '../vfx/AnimatedSprite'
import { BATTLE_DICE_EXIT_MS, getBattleDiceSequence } from './battleDiceAssets'
import { createBattleDiceReveal } from './battleDiceReveal'
import { playSfx } from '@/utils/soundManager'
import { EFFICACY_LABEL, diceCellWidth, type EfficacyTone } from './battleCinematics'
import './battleDice.css'

const useDiceLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface DiceRollDisplay {
  id: number
  side: 'A' | 'B'
  moveName: string
  rolls: number[]
  increment: number
  damage: number
  /** Efficacia della mossa, già risolta dal motore: colora il risultato. */
  tone?: EfficacyTone
}

interface DiceRollOverlayProps {
  roll: DiceRollDisplay
  forceFallback?: boolean
  onVisible?: () => void
  /** Design preview holds the real result artwork without a sound or battle action. */
  staticPreview?: boolean
}

export function DiceRollOverlay(props: DiceRollOverlayProps) {
  return <DiceRollPresentation key={props.roll.id} {...props} />
}

function DiceRollPresentation({ roll, forceFallback = false, onVisible, staticPreview = false }: DiceRollOverlayProps) {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const [damageVisible, setDamageVisible] = useState(staticPreview)
  const revealRef = useRef<ReturnType<typeof createBattleDiceReveal> | null>(null)
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible
  const diceCount = roll.rolls.length
  const side = roll.side

  useDiceLayoutEffect(() => {
    if (staticPreview) return
    const reveal = createBattleDiceReveal({
      diceCount,
      scheduleAfterPaint: (callback) => {
        let secondFrame = 0
        const firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(callback)
        })
        return () => {
          cancelAnimationFrame(firstFrame)
          cancelAnimationFrame(secondFrame)
        }
      },
      onReveal: () => {
        playSfx('dice.land')
        setDamageVisible(true)
        onVisibleRef.current?.()
      },
    })
    revealRef.current = reveal
    // I dadi rotolano mentre il vassoio entra; si fermano (e suonano) alla rivelazione.
    const stopRoll = playSfx('dice.roll', { pan: side === 'A' ? -0.2 : 0.2 })
    if (reducedMotion) reveal.panelVisible()
    return () => {
      stopRoll()
      reveal.cancel()
      if (revealRef.current === reveal) revealRef.current = null
    }
  }, [diceCount, reducedMotion, staticPreview, side])
  const total = roll.rolls.reduce((sum, value) => sum + value, 0)
  // Pochi dadi diventano grandi: sono il momento centrale del turno.
  const cell = diceCellWidth(roll.rolls.length)
  const gridStyle = {
    '--battle-dice-columns': Math.max(1, Math.min(roll.rolls.length, 6)),
    '--battle-dice-mobile-columns': Math.max(1, Math.min(roll.rolls.length, roll.rolls.length > 9 ? 4 : 3)),
    '--battle-dice-cell-width': `${cell.desktop}px`,
    '--battle-dice-mobile-cell-width': `${cell.mobile}px`,
  } as CSSProperties
  const tone = roll.tone ?? 'normal'
  const toneLabel = EFFICACY_LABEL[tone]

  const tray = hasGameArt('battle-dice-tray')
  return (
    <div
      className="battle-dice-layer pointer-events-none absolute inset-0 z-[var(--battle-z-dice)] flex items-center justify-center"
      data-dice-roll-id={roll.id}
      data-dice-revealed={damageVisible}
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.72, y: -28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: reducedMotion ? 0 : BATTLE_DICE_EXIT_MS / 1000 / speed }}
        onAnimationComplete={() => revealRef.current?.panelVisible()}
        className="battle-dice-panel rounded-md border border-white/20 px-5 py-4 text-center text-white shadow-2xl"
        data-dice-tray={tray || undefined}
      >
        {/* Fase U6: il vassoio dipinto del lotto 3 al posto del pannello rettangolare. */}
        {tray && <GameArt id="battle-dice-tray" className="battle-dice-tray" data-ui-asset-decoration="" />}
        <p className="battle-dice-kicker font-black uppercase text-blue-300 arka-letter-outline">
          {roll.side === 'A' ? 'Lancio giocatore' : 'Lancio avversario'}
        </p>
        <h3 className="battle-dice-move mt-1 font-black">{roll.moveName}</h3>
        <div className="battle-dice-grid" style={gridStyle}>
          {roll.rolls.map((value, index) => (
            <BattleDie
              key={`${roll.id}-${index}-${value}`}
              value={value}
              staticPreview={staticPreview}
              forceFallback={forceFallback}
              onVisible={() => revealRef.current?.dieVisible(index)}
            />
          ))}
        </div>
        <p className="battle-dice-sum mt-3 font-bold leading-relaxed text-slate-200">
          Dadi: {roll.rolls.join(' + ')}
          {roll.increment > 0 ? ` + ${roll.increment}` : ''}
          {' = '}{total + roll.increment}
        </p>
        <div className="battle-dice-result mt-1 min-h-6" data-dice-tone={tone} aria-live="polite">
          {damageVisible ? (
            <>
              <DiceDamageCounter value={roll.damage} animated={!staticPreview} />
              <p className="battle-dice-result-label font-black">Danno finale: {roll.damage}</p>
              {toneLabel && <p className="battle-dice-result-tone font-black uppercase">{toneLabel}</p>}
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Totale in grande con conteggio. È decorativo: il valore testuale accessibile
 * resta la riga "Danno finale", che non cambia durante l'animazione.
 */
function DiceDamageCounter({ value, animated }: { value: number; animated: boolean }) {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const element = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const node = element.current
    if (!node || !animated || reducedMotion || value <= 0) return
    const control = animate(0, value, {
      duration: Math.min(0.7, 0.25 + value * 0.012) / speed,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (current) => { node.textContent = String(Math.round(current)) },
    })
    return () => { control.stop(); node.textContent = String(value) }
  }, [animated, reducedMotion, speed, value])
  return (
    <motion.span
      ref={element}
      aria-hidden="true"
      className="battle-dice-total arka-battle-font"
      initial={animated && !reducedMotion ? { scale: 0.5, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.26 / speed, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {value}
    </motion.span>
  )
}

export function BattleDie({ value, forceFallback, onVisible, staticPreview = false }: {
  value: number
  forceFallback: boolean
  onVisible: () => void
  staticPreview?: boolean
}) {
  const [phase, setPhase] = useState<'intro' | 'result'>('intro')
  const [failed, setFailed] = useState(false)
  const { reducedMotion } = useGameMotionPreferences()
  const revealResult = useCallback(() => setPhase('result'), [])
  const showFallback = useCallback(() => setFailed(true), [])
  const sequence = getBattleDiceSequence(value)
  const showingResult = staticPreview || reducedMotion || phase === 'result'
  const segment = sequence && (showingResult ? sequence.result : sequence.intro)
  const showingFallback = failed || forceFallback || !segment
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible
  const notifyVisible = useCallback(() => onVisibleRef.current(), [])

  useEffect(() => {
    if (!showingFallback) return
    const frame = requestAnimationFrame(notifyVisible)
    return () => cancelAnimationFrame(frame)
  }, [showingFallback, notifyVisible])

  return (
    <div className="battle-die" role="img" aria-label={`Dado: ${value}`}>
      {showingFallback ? (
        <span className="battle-die-fallback" aria-hidden="true">{value}</span>
      ) : (
        <div className="battle-die-sprite">
          <AnimatedSprite
            key={`${value}-${showingResult ? 'result' : 'intro'}`}
            src={assetUrl(segment.src)}
            {...segment.sprite}
            {...(staticPreview ? { frameCount: 1, paused: true } : {})}
            width={segment.sprite.frameWidth}
            height={segment.sprite.frameHeight}
            responsive
            className="battle-die-frames"
            loop={false}
            waitForLoad
            onStart={showingResult ? notifyVisible : undefined}
            onComplete={showingResult ? undefined : revealResult}
            onError={showFallback}
          />
        </div>
      )}
    </div>
  )
}
