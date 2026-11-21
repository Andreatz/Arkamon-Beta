import { useEffect, useRef, useState } from 'react'
import type { RisultatoMossa } from '@/types'
import type { DiceRollDisplay } from '@/components/battle/DiceRollOverlay'
import { BATTLE_DICE_EXIT_GRACE_MS, BATTLE_DICE_ROLL_VISIBLE_MS, battleDiceDismissDelayMs } from '@/components/battle/battleDiceAssets'
import { efficacyTone } from '@/components/battle/battleCinematics'
import { getAnimationDuration } from '@/settings/gamePreferences'

type DiceCallbacks = { id: number; onVisible: () => void; onComplete: () => void }

/**
 * Audit fase 10: carta dei dadi della battaglia, estratta da BattagliaScene.
 * - `show` apre la carta per un risultato; `onVisible` scatta quando i dadi sono leggibili
 *   (rivelazione del danno), `onComplete` quando la carta è uscita del tutto (fase 4);
 * - `reveal` va chiamato dall'overlay quando i dadi sono visibili;
 * - `onExitComplete` va passato all'AnimatePresence che contiene l'overlay.
 * I timer vengono annullati allo smontaggio della scena.
 */
export function useBattleDiceRoll(reducedMotion: boolean) {
  const [diceRoll, setDiceRoll] = useState<DiceRollDisplay | null>(null)
  const [publicDiceId, setPublicDiceId] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const exitRef = useRef<(() => void) | null>(null)
  const idRef = useRef(0)
  const callbacksRef = useRef<DiceCallbacks | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    callbacksRef.current = null
  }, [])

  const show = (risultato: RisultatoMossa, side: 'A' | 'B', onVisible: () => void, onComplete: () => void) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const id = ++idRef.current
    callbacksRef.current = { id, onVisible, onComplete }
    setDiceRoll({
      id,
      side,
      moveName: risultato.suprema ? `${risultato.mossa.nome} · Suprema` : risultato.mossa.nome,
      rolls: risultato.tiriDado,
      increment: risultato.incremento,
      damage: risultato.dannoFinale,
      tone: efficacyTone(risultato.moltiplicatoreTipo),
    })
  }

  const reveal = (id: number) => {
    const callbacks = callbacksRef.current
    if (!callbacks || callbacks.id !== id || timerRef.current !== null) return
    setPublicDiceId(id)
    callbacks.onVisible()
    timerRef.current = window.setTimeout(() => {
      if (callbacksRef.current !== callbacks) return
      setDiceRoll(null)
      const finish = () => {
        if (callbacksRef.current !== callbacks) return
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
        timerRef.current = null
        callbacksRef.current = null
        exitRef.current = null
        callbacks.onComplete()
      }
      // Audit fase 4: la carta esce del tutto prima che i messaggi del turno compaiano.
      // La fine dell'uscita sblocca il turno; il timer è una rete di sicurezza per una scheda
      // in background, dove le animazioni possono restare ferme.
      const exitMs = getAnimationDuration(battleDiceDismissDelayMs(reducedMotion))
      if (exitMs <= 0) { finish(); return }
      exitRef.current = finish
      timerRef.current = window.setTimeout(finish, exitMs + BATTLE_DICE_EXIT_GRACE_MS)
    }, getAnimationDuration(BATTLE_DICE_ROLL_VISIBLE_MS))
  }

  const onExitComplete = () => exitRef.current?.()

  return { diceRoll, publicDiceId, show, reveal, onExitComplete }
}
