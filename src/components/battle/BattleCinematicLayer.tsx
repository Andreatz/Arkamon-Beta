import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { motionTransition } from '@/motion/tokens'
import { EFFICACY_LABEL } from './battleCinematics'
import type { DamageNumberDisplay, MoveBannerDisplay } from './useBattleCinematics'
import './battleCinematics.css'

/**
 * Fascia con il nome della mossa: entra dal lato di chi attacca.
 * È un elemento scenico (i messaggi e la Cronaca restano la fonte testuale),
 * quindi è nascosto alle tecnologie assistive.
 */
export function BattleMoveBanner({ banner }: { banner: MoveBannerDisplay | null }) {
  const settings = useGameMotionPreferences()
  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.id}
          aria-hidden="true"
          data-battle-move-banner={banner.side}
          className={`battle-move-banner arka-battle-font ${banner.suprema ? 'is-supreme' : ''}`}
          style={{ '--battle-move-color': banner.color } as CSSProperties}
          initial={settings.reducedMotion ? { opacity: 0 } : { opacity: 0, x: banner.side === 'A' ? '-22%' : '22%', scaleX: 0.86 }}
          animate={{ opacity: 1, x: '0%', scaleX: 1 }}
          exit={settings.reducedMotion ? { opacity: 0 } : { opacity: 0, x: banner.side === 'A' ? '10%' : '-10%' }}
          transition={motionTransition(banner.suprema ? 'slow' : 'base', 'out', settings)}
        >
          {banner.suprema && <span className="battle-move-banner__kicker">Mossa Suprema</span>}
          <span className="battle-move-banner__name">{banner.name}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Numero del danno: salta sopra il bersaglio quando i dadi lo rivelano.
 * `position` è il centro del bersaglio in percentuale del mondo di battaglia.
 */
export function BattleDamageNumber({ display, position }: { display: DamageNumberDisplay | null; position: { x: number; y: number } | null }) {
  const settings = useGameMotionPreferences()
  const label = display ? EFFICACY_LABEL[display.tone] : null
  return (
    <AnimatePresence>
      {display && position && (
        <motion.div
          key={display.id}
          aria-hidden="true"
          data-battle-damage-number={display.side}
          className={`battle-damage-number arka-battle-font is-${display.tone} ${display.ko ? 'is-ko' : ''}`}
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
          initial={settings.reducedMotion ? { opacity: 0, x: '-50%', y: '-50%' } : { opacity: 0, x: '-50%', y: '-10%', scale: 0.4 }}
          animate={settings.reducedMotion ? { opacity: 1, x: '-50%', y: '-50%' } : { opacity: 1, x: '-50%', y: ['-10%', '-95%', '-80%'], scale: [0.4, 1.3, 1] }}
          exit={{ opacity: 0, transition: motionTransition('fast', 'in', settings) }}
          transition={{ ...motionTransition('slow', 'out', settings), times: [0, 0.55, 1] }}
        >
          <span className="battle-damage-number__amount">−{display.amount}</span>
          {label && <span className="battle-damage-number__label">{label}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
