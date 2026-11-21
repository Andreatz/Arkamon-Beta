import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { getAnimationDuration, useGameMotionPreferences } from '@/settings/gamePreferences'
import { CreaturePortrait } from '@/player-ui/kit'
import type { PokemonIstanza } from '@/types'
import './turnChangeBanner.css'

/** Audit fase 6: durata della fascia «Tocca a …» a velocità normale. */
export const TURN_BANNER_MS = 1200
// La mappa principale ha già la propria fascia «Turno di…» legata alla cinepresa: qui servono le mappe locali.
const OVERWORLD_SCENES = new Set(['citta', 'percorso'])

/** Il compagno in testa alla squadra (il primo non esausto), mostrato accanto al nome. */
export function leadPokemon(squad: readonly PokemonIstanza[]): PokemonIstanza | null {
  return squad.find((pokemon) => pokemon.hp > 0) ?? squad[0] ?? null
}

/** Decide se un cambio di turno merita la fascia: solo sulle mappe e solo per un vero passaggio. */
export function shouldAnnounceTurn(previous: 1 | 2 | null, next: 1 | 2, scene: string): boolean {
  return previous !== null && previous !== next && OVERWORLD_SCENES.has(scene)
}

/**
 * Fascia a tutta larghezza che annuncia il cambio di giocatore sulle mappe.
 * Non blocca l'input: è solo un segnale da leggere anche da lontano.
 */
export function TurnChangeBanner() {
  const active = useGameStore((state) => state.turnoOverworld.giocatoreAttivo)
  const scene = useGameStore((state) => state.scenaCorrente.scena)
  const name = useGameStore((state) => (active === 1 ? state.giocatore1.nome : state.giocatore2.nome))
  const lead = useGameStore((state) => leadPokemon(active === 1 ? state.giocatore1.squadra : state.giocatore2.squadra))
  const { reducedMotion, speed } = useGameMotionPreferences()
  const previous = useRef<1 | 2 | null>(null)
  const [shown, setShown] = useState<{ id: number; player: 1 | 2; name: string; lead: PokemonIstanza | null } | null>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = active
    if (!shouldAnnounceTurn(before, active, scene)) return
    setShown({ id: Date.now(), player: active, name, lead })
    const timer = window.setTimeout(() => setShown(null), getAnimationDuration(TURN_BANNER_MS))
    return () => window.clearTimeout(timer)
    // Il nome cambia solo con il giocatore: non deve ripresentare la fascia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, scene])

  return <AnimatePresence>
    {shown && <motion.div key={shown.id} className="turn-change-banner" role="status" aria-live="polite" data-turn-player={shown.player}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.2 }} animate={{ opacity: 1, scaleY: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.4 }} transition={{ duration: reducedMotion ? 0 : 0.22 / speed }}>
      <motion.span className="turn-change-banner__text arka-battle-font" initial={reducedMotion ? false : { x: '-12%', opacity: 0 }} animate={{ x: '0%', opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.32 / speed, delay: reducedMotion ? 0 : 0.08 / speed }}>
        {shown.lead && <CreaturePortrait pokemon={shown.lead} className="turn-change-banner__portrait" />}
        <small>G{shown.player}</small> Tocca a {shown.name}
      </motion.span>
    </motion.div>}
  </AnimatePresence>
}
