import { useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { motionTransition, resolveDuration } from '@/motion/tokens'
import type { CaptureStep } from './battleCapture'
import './battleCapture.css'

export type CapturePhase = 'throw' | 'absorb' | 'settle' | 'shake' | 'caught' | 'escaped'

export interface CaptureDisplay {
  id: number
  kind: 'dice' | 'master'
  phase: CapturePhase
  /** Numero di oscillazioni avviate: ogni valore nuovo fa ripartire il dondolio. */
  shake: number
  revealed: CaptureStep[]
  maxTotal: number | null
}

type Point = { x: number; y: number }

/** Durate a velocità normale: il sequenziatore le usa per attendere la fine di ogni fase. */
export const CAPTURE_TIMING = { throw: 620, absorb: 380, settle: 340, shake: 560 } as const

/** Le fasi in cui l'Arkamon selvatico è dentro la sfera. */
export function captureHidesTarget(capture: CaptureDisplay | null): boolean {
  return !!capture && capture.phase !== 'throw' && capture.phase !== 'escaped'
}

/**
 * Sfera di cattura, dadi delle oscillazioni ed esito. Vive nel mondo di
 * battaglia, quindi segue la cinepresa. Le coordinate sono percentuali del palco.
 */
export function BattleCaptureLayer({ capture, from, to }: { capture: CaptureDisplay | null; from: Point; to: Point }) {
  const settings = useGameMotionPreferences()
  const ground = { x: to.x, y: Math.min(92, to.y + 13) }
  return (
    <AnimatePresence>
      {capture && (
        <motion.div key={capture.id} className="battle-capture" data-battle-capture={capture.phase} data-capture-kind={capture.kind}
          aria-hidden="true" exit={{ opacity: 0, transition: motionTransition('fast', 'in', settings) }}>
          <CaptureOrb capture={capture} from={from} target={to} ground={ground} />
          {(capture.phase === 'absorb') && (
            <motion.span className="battle-capture__ring" style={{ left: `${to.x}%`, top: `${to.y}%` }}
              initial={{ x: '-50%', y: '-50%', scale: 0.2, opacity: 0.95 }} animate={{ scale: 2.4, opacity: 0 }}
              transition={motionTransition(CAPTURE_TIMING.absorb, 'out', settings)} />
          )}
          {capture.phase === 'escaped' && (
            <motion.span className="battle-capture__ring is-burst" style={{ left: `${ground.x}%`, top: `${ground.y}%` }}
              initial={{ x: '-50%', y: '-50%', scale: 0.4, opacity: 1 }} animate={{ scale: 3, opacity: 0 }}
              transition={motionTransition('slow', 'out', settings)} />
          )}
          {capture.phase === 'caught' && <CaughtStars at={ground} />}
          {/* Sopra la sfera, dove prima c'era l'Arkamon: lontano dall'HUD in basso. */}
          <CaptureDice capture={capture} at={{ x: to.x, y: Math.max(8, to.y - 6) }} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CaptureOrb({ capture, from, target, ground }: { capture: CaptureDisplay; from: Point; target: Point; ground: Point }) {
  const settings = useGameMotionPreferences()
  const { phase } = capture
  const apex = Math.max(4, Math.min(from.y, target.y) - 26)
  const animate = phase === 'throw'
    ? { left: [`${from.x}%`, `${(from.x + target.x) / 2}%`, `${target.x}%`], top: [`${from.y}%`, `${apex}%`, `${target.y}%`], rotate: [0, 360, 720], scale: [0.7, 1, 0.9], opacity: 1 }
    : phase === 'absorb'
      ? { left: `${target.x}%`, top: `${target.y}%`, rotate: 720, scale: [0.9, 1.25, 1], opacity: 1 }
      : phase === 'escaped'
        ? { left: `${ground.x}%`, top: `${ground.y}%`, rotate: 0, scale: 1.6, opacity: 0 }
        : phase === 'shake'
          ? { left: `${ground.x}%`, top: `${ground.y}%`, rotate: [0, -24, 18, -10, 4, 0], scale: 1, opacity: 1 }
          : { left: `${ground.x}%`, top: `${ground.y}%`, rotate: 0, scale: 1, opacity: 1 }
  const duration = phase === 'throw' ? CAPTURE_TIMING.throw
    : phase === 'absorb' ? CAPTURE_TIMING.absorb
      : phase === 'settle' ? CAPTURE_TIMING.settle
        : phase === 'shake' ? CAPTURE_TIMING.shake
          : 240
  return (
    <motion.div
      key={phase === 'shake' ? `shake-${capture.shake}` : 'orb'}
      className={`battle-capture__orb ${phase === 'caught' ? 'is-sealed' : ''}`}
      initial={false}
      animate={animate}
      transition={{
        duration: resolveDuration(duration, settings) / 1000,
        ease: phase === 'settle' ? [0.34, 1.56, 0.64, 1] : phase === 'throw' ? 'linear' : [0.16, 1, 0.3, 1],
        ...(phase === 'throw' ? { top: { duration: resolveDuration(duration, settings) / 1000, ease: [0.25, 0.1, 0.25, 1], times: [0, 0.45, 1] } } : {}),
      }}
      style={{ x: '-50%', y: '-50%' }}
    >
      <CaptureOrbArt kind={capture.kind} />
    </motion.div>
  )
}

/** Sfera originale di Arkamon: cristallo con fascia d'oro e runa centrale. */
function CaptureOrbArt({ kind }: { kind: 'dice' | 'master' }) {
  const id = useId().replace(/:/g, '')
  const master = kind === 'master'
  return (
    <svg viewBox="0 0 100 100" className="battle-capture__orb-art">
      <defs>
        <radialGradient id={`${id}-core`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor={master ? '#fde68a' : '#a5f3fc'} />
          <stop offset="55%" stopColor={master ? '#a855f7' : '#0e7490'} />
          <stop offset="100%" stopColor={master ? '#3b0764' : '#082f49'} />
        </radialGradient>
        <linearGradient id={`${id}-band`} x1="0" x2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill={`url(#${id}-core)`} stroke="#fde68a" strokeWidth="3" />
      <path d="M8 50 Q50 62 92 50" fill="none" stroke={`url(#${id}-band)`} strokeWidth="9" strokeLinecap="round" />
      <path d="M50 38 L60 52 L50 66 L40 52 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5" />
      <ellipse cx="34" cy="28" rx="11" ry="6" fill="#ffffff" opacity="0.55" transform="rotate(-30 34 28)" />
    </svg>
  )
}

function CaptureDice({ capture, at }: { capture: CaptureDisplay; at: Point }) {
  const settings = useGameMotionPreferences()
  const caught = capture.phase === 'caught'
  if (!caught && (capture.kind !== 'dice' || capture.revealed.length === 0)) return null
  const last = capture.revealed[capture.revealed.length - 1]
  return (
    <div className="battle-capture__dice arka-battle-font" style={{ left: `${at.x}%`, top: `${at.y}%` }} data-capture-total={last?.total}>
      {caught && (
        <motion.p className="battle-capture__label" initial={settings.reducedMotion ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: resolveDuration('slow', settings) / 1000, ease: [0.34, 1.56, 0.64, 1] }}>
          Catturato!
        </motion.p>
      )}
      {capture.kind === 'dice' && last && <div className="battle-capture__chips">
        {capture.revealed.map((step, index) => (
          <motion.span key={index} className={`battle-capture__chip ${step.holds ? '' : 'is-break'}`}
            initial={settings.reducedMotion ? false : { scale: 0.3, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: resolveDuration('base', settings) / 1000, ease: [0.34, 1.56, 0.64, 1] }}>
            {step.die}
          </motion.span>
        ))}
      </div>}
      {capture.kind === 'dice' && last && (
        <p className={`battle-capture__total ${last.holds ? '' : 'is-break'}`}>
          {last.total}<span> / {capture.maxTotal}</span>
        </p>
      )}
    </div>
  )
}

function CaughtStars({ at }: { at: Point }) {
  const settings = useGameMotionPreferences()
  if (settings.reducedMotion) return null
  return (
    <>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2
        return (
          <motion.span key={index} className="battle-capture__star" style={{ left: `${at.x}%`, top: `${at.y}%` }}
            initial={{ x: '-50%', y: '-50%', scale: 0.2, opacity: 1 }}
            animate={{ x: `calc(-50% + ${Math.cos(angle) * 9}vw)`, y: `calc(-50% + ${Math.sin(angle) * 9}vw)`, scale: 1, opacity: 0 }}
            transition={{ duration: resolveDuration(900, settings) / 1000, ease: [0.16, 1, 0.3, 1] }} />
        )
      })}
    </>
  )
}
