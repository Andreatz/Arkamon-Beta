import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { resolveDuration } from '@/motion/tokens'
import { assetUrl } from '@/utils/assetUrl'
import { getSplashArtwork } from '@/player-ui/reference/splashArtwork'
import { splashFocusPosition } from './splashFocus'
import './supremeCutIn.css'

export interface SupremeCutInDisplay {
  id: number
  side: 'A' | 'B'
  speciesId: number
  pokemonName: string
  moveName: string
  color: string
}

/** Durata dello stacco a velocità normale (entrata, tenuta, uscita). */
export const SUPREME_CUT_IN_MS = 1250

/**
 * Stacco a tutto schermo della Mossa Suprema: l'illustrazione dell'Arkamon
 * entra in una fascia diagonale con linee di velocità nel colore del tipo.
 * È scenico: il nome della mossa resta nei messaggi e nella Cronaca.
 */
export function SupremeCutIn({ display }: { display: SupremeCutInDisplay | null }) {
  const settings = useGameMotionPreferences()
  const enter = resolveDuration(300, settings) / 1000
  return (
    <AnimatePresence>
      {display && (
        <SupremeCutInBody key={display.id} display={display} enter={enter} />
      )}
    </AnimatePresence>
  )
}

function SupremeCutInBody({ display, enter }: { display: SupremeCutInDisplay; enter: number }) {
  const artwork = getSplashArtwork(display.speciesId)
  const fromLeft = display.side === 'A'
  const source = artwork ? assetUrl(artwork.src) : assetUrl(`/sprites/front_sprites/${display.speciesId}.png`)
  return (
    <motion.div
      className="supreme-cut-in"
      data-supreme-cut-in={display.side}
      aria-hidden="true"
      style={{ '--supreme-color': display.color } as CSSProperties}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: enter * 0.8 } }}
    >
      <motion.div className="supreme-cut-in__dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: enter }} />
      <motion.div
        className={`supreme-cut-in__band ${fromLeft ? 'is-left' : 'is-right'}`}
        initial={{ x: fromLeft ? '-110%' : '110%' }}
        animate={{ x: '0%' }}
        exit={{ x: fromLeft ? '110%' : '-110%', transition: { duration: enter * 0.9, ease: [0.7, 0, 0.84, 0] } }}
        transition={{ duration: enter, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="supreme-cut-in__lines" />
        <motion.img
          className={`supreme-cut-in__art ${artwork ? '' : 'is-sprite'}`}
          src={source}
          alt=""
          draggable={false}
          style={{ objectPosition: splashFocusPosition(artwork) }}
          initial={{ scale: 1.18, x: fromLeft ? '-4%' : '4%' }}
          animate={{ scale: 1.04, x: fromLeft ? '3%' : '-3%' }}
          transition={{ duration: enter * 4.2, ease: 'linear' }}
        />
      </motion.div>
      <motion.div
        className={`supreme-cut-in__text arka-battle-font ${fromLeft ? 'is-left' : 'is-right'}`}
        initial={{ opacity: 0, x: fromLeft ? '18%' : '-18%' }}
        animate={{ opacity: 1, x: '0%' }}
        transition={{ duration: enter, delay: enter * 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="supreme-cut-in__kicker">Mossa Suprema</span>
        <span className="supreme-cut-in__move">{display.moveName}</span>
        <span className="supreme-cut-in__name">{display.pokemonName}</span>
      </motion.div>
    </motion.div>
  )
}
