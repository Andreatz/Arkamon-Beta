import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { hasOwnedPokemon } from '@/engine/pokemonOwnership'
import { useGameMotionPreferences, useGamePreferences } from '@/settings/gamePreferences'
import { ArkaButton } from '@/ui-system/primitives'
import { FIRST_TURN_TUTORIAL, shouldShowTutorial } from './firstTurnTutorial'
import './firstTurnTutorial.css'

/**
 * Audit fase 8: tre schede brevi sulla mappa principale alla prima partita.
 * Non blocca la mappa; si chiude con «Salta» o all'ultima scheda e si può rivedere
 * dalle Impostazioni.
 */
export function FirstTurnTutorial() {
  const done = useGamePreferences((state) => state.tutorialDone)
  const setPreferences = useGamePreferences((state) => state.setPreferences)
  const scene = useGameStore((state) => state.scenaCorrente.scena)
  const startersComplete = useGameStore((state) => hasOwnedPokemon(state.giocatore1) && hasOwnedPokemon(state.giocatore2))
  const { reducedMotion, speed } = useGameMotionPreferences()
  const [index, setIndex] = useState(0)
  const visible = shouldShowTutorial(done, scene, startersComplete)
  const step = FIRST_TURN_TUTORIAL[index]
  const last = index === FIRST_TURN_TUTORIAL.length - 1
  const close = () => { setPreferences({ tutorialDone: true }); setIndex(0) }

  return <AnimatePresence>
    {visible && <motion.aside key="first-turn-tutorial" className="first-turn-tutorial arka-ds-panel" role="dialog" aria-modal="false" aria-labelledby="first-turn-tutorial-title"
      data-tutorial-step={step.id}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .26 / speed }}>
      <p className="first-turn-tutorial__kicker">Primo turno · {index + 1} di {FIRST_TURN_TUTORIAL.length}</p>
      <h2 id="first-turn-tutorial-title">{step.title}</h2>
      <p className="first-turn-tutorial__body">{step.body}</p>
      <ol className="first-turn-tutorial__dots" aria-hidden="true">{FIRST_TURN_TUTORIAL.map((entry, i) => <li key={entry.id} data-active={i === index || undefined} />)}</ol>
      <div className="first-turn-tutorial__actions">
        <ArkaButton tone="ghost" onClick={close}>Salta</ArkaButton>
        {index > 0 && <ArkaButton onClick={() => setIndex(index - 1)}>Indietro</ArkaButton>}
        <ArkaButton tone="primary" onClick={() => (last ? close() : setIndex(index + 1))}>{last ? 'Inizia a giocare' : 'Avanti'}</ArkaButton>
      </div>
    </motion.aside>}
  </AnimatePresence>
}
