import { motion } from 'framer-motion'
import { VFX_Z_INDEX } from './MoveVfxLayer'
import type { VfxTravel } from './types'

/** Sotto questa durata non c'è tempo per vedere un viaggio: l'effetto resta un'esplosione sul bersaglio. */
export const MIN_TRAVEL_MS = 120

export interface VfxTravelPlan {
  travel: Exclude<VfxTravel, 'burst'>
  from: { x: number; y: number }
  to: { x: number; y: number }
  /** Millisecondi (già scalati per la velocità) fra la partenza e l'arrivo sul bersaglio. */
  arriveMs: number
}

/**
 * Audit fase 5: decide se e come mostrare il percorso attaccante → bersaglio.
 * Restituisce `null` per esplosioni sul posto, effetti su sé stessi, movimento ridotto
 * o impatti troppo ravvicinati per essere letti.
 */
export function planVfxTravel(options: {
  travel: VfxTravel
  target?: 'opponent' | 'self'
  reducedMotion: boolean
  impactMs: number
  from: { x: number; y: number }
  to: { x: number; y: number }
}): VfxTravelPlan | null {
  const { travel, target, reducedMotion, impactMs, from, to } = options
  if (travel === 'burst' || target === 'self' || reducedMotion) return null
  if (!(impactMs >= MIN_TRAVEL_MS)) return null
  return { travel, from, to, arriveMs: impactMs }
}

/**
 * Scia in CSS/SVG che collega attaccante e bersaglio con il colore del tipo e arriva
 * esattamente all'istante d'impatto. Funziona con qualunque sprite di effetto: quando
 * arriveranno sprite dedicati di proiettili o raggi potrà essere sostituita.
 */
export function VfxTravelTrail({ side, plan, color, effectId }: { side: 'A' | 'B'; plan: VfxTravelPlan; color: string; effectId: number }) {
  const seconds = plan.arriveMs / 1000
  const { from, to } = plan
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: VFX_Z_INDEX['over-pokemon'], color }}
      data-vfx-travel={plan.travel}
      data-vfx-travel-side={side}
      data-move-vfx-event={effectId}
      aria-hidden="true"
    >
      {plan.travel === 'beam' ? (
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color})` }}>
          <motion.line
            x1={from.x} y1={from.y}
            stroke="currentColor" strokeLinecap="round" strokeWidth={10} vectorEffect="non-scaling-stroke"
            initial={{ x2: from.x, y2: from.y, opacity: 0.2 }}
            animate={{ x2: to.x, y2: to.y, opacity: [0.2, 1, 0] }}
            transition={{
              x2: { duration: seconds, ease: 'easeOut' },
              y2: { duration: seconds, ease: 'easeOut' },
              opacity: { duration: seconds + 0.16, times: [0, seconds / (seconds + 0.16), 1] },
            }}
          />
          <motion.line
            x1={from.x} y1={from.y}
            stroke="white" strokeLinecap="round" strokeWidth={3} vectorEffect="non-scaling-stroke"
            initial={{ x2: from.x, y2: from.y, opacity: 0.4 }}
            animate={{ x2: to.x, y2: to.y, opacity: [0.4, 1, 0] }}
            transition={{
              x2: { duration: seconds, ease: 'easeOut' },
              y2: { duration: seconds, ease: 'easeOut' },
              opacity: { duration: seconds + 0.16, times: [0, seconds / (seconds + 0.16), 1] },
            }}
          />
        </svg>
      ) : (
        <motion.span
          className="absolute block rounded-full"
          style={{
            width: 54, height: 54, marginLeft: -27, marginTop: -27,
            backgroundImage: `radial-gradient(circle, #ffffff 0 22%, ${color} 46%, color-mix(in srgb, ${color} 0%, transparent) 72%)`,
            boxShadow: `0 0 22px 8px ${color}`,
          }}
          initial={{ left: `${from.x}%`, top: `${from.y}%`, opacity: 0, scale: 0.6 }}
          animate={{ left: `${to.x}%`, top: `${to.y}%`, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.15, 1.6] }}
          transition={{
            left: { duration: seconds, ease: 'easeIn' },
            top: { duration: seconds, ease: 'easeIn' },
            opacity: { duration: seconds + 0.12, times: [0, 0.15, 0.85, 1] },
            scale: { duration: seconds + 0.12, times: [0, 0.4, 0.85, 1] },
          }}
        />
      )}
    </div>
  )
}
