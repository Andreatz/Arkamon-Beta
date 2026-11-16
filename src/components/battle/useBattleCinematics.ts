import { useEffect, useMemo, useRef, useState } from 'react'
import type { CameraRig } from '@/motion/useCameraRig'
import type { ScreenFx } from '@/motion/ScreenFx'
import { call, hold, par, seq, type Beat, type Playback } from '@/motion/director'
import { useDirector } from '@/motion/useDirector'
import {
  attackerShot, damageTrauma, efficacyTone, knockoutShot, outcomeShot, targetShot,
  type BattleSide, type EfficacyTone,
} from './battleCinematics'

export interface MoveBannerDisplay {
  id: number
  side: BattleSide
  name: string
  color: string
  suprema: boolean
}

export interface DamageNumberDisplay {
  id: number
  side: BattleSide
  amount: number
  tone: EfficacyTone
  ko: boolean
}

export interface BattleCinematics {
  /** Fascia con il nome della mossa, oppure `null`. */
  banner: MoveBannerDisplay | null
  /** Numero del danno sul bersaglio, oppure `null`. */
  damageNumber: DamageNumberDisplay | null
  /** Lato dell'Arkamon appena andato KO: attenua lo sfondo. */
  knockoutSide: BattleSide | null
  /** Inizio dell'azione: bande, nome della mossa e carrellata su chi attacca. */
  attackStart(options: { side: BattleSide; moveName: string; color: string; suprema?: boolean }): void
  /** Rilascio del colpo: stacco sul bersaglio. */
  release(targetSide: BattleSide): void
  /** Impatto dell'effetto, prima che il danno sia noto. */
  impact(): void
  /** Si torna alla panoramica per lasciare la scena ai dadi. */
  diceStart(): void
  /** Il danno è stato rivelato: numero, scossa proporzionale ed eventuale primo piano sul KO. */
  damageReveal(options: { targetSide: BattleSide; damage: number; hpMax: number; ko: boolean; multiplier: number }): void
  /** Fine dell'azione: via le bande, camera a riposo. */
  attackEnd(): void
  /** Esito della battaglia: camera sul lato vincitore. */
  outcome(winner: BattleSide): void
  /** Riattiva la regia dopo un esito: serve quando la stessa scena ospita un'altra battaglia. */
  resume(): void
  /** Riporta tutto a riposo senza animazione. */
  reset(): void
}

/**
 * Regia della battaglia. La scena la chiama nei momenti della sequenza
 * d'attacco già esistenti; qui dentro vivono soltanto cinepresa, effetti a
 * schermo intero e piccoli elementi scenici. Nessuna chiamata blocca o
 * modifica il flusso di gioco: se la regia è disattivata (editor dei layout,
 * anteprime) ogni metodo è inerte.
 */
export function useBattleCinematics({ rig, fx, enabled }: { rig: CameraRig; fx: ScreenFx; enabled: boolean }): BattleCinematics {
  const director = useDirector('Regia della battaglia')
  const [banner, setBanner] = useState<MoveBannerDisplay | null>(null)
  const [damageNumber, setDamageNumber] = useState<DamageNumberDisplay | null>(null)
  const [knockoutSide, setKnockoutSide] = useState<BattleSide | null>(null)
  const runtime = useRef<{ playback: Playback | null; id: number; enabled: boolean; suprema: boolean; knockout: boolean; concluded: boolean }>(
    { playback: null, id: 0, enabled, suprema: false, knockout: false, concluded: false },
  )
  runtime.current.enabled = enabled

  const controls = useMemo(() => {
    const state = runtime.current
    const { camera } = rig
    const play = (beat: Beat) => {
      state.playback?.cancel()
      const playback = director.play(beat)
      state.playback = playback
      // Un errore di presentazione non deve mai fermare la battaglia.
      void playback.finished.catch(() => undefined).then(() => { if (state.playback === playback) state.playback = null })
    }
    const reset = () => {
      state.playback?.cancel()
      state.playback = null
      state.suprema = false
      state.knockout = false
      state.concluded = false
      setBanner(null); setDamageNumber(null); setKnockoutSide(null)
      fx.clear()
      void camera.reset(0)
    }
    return {
      attackStart({ side, moveName, color, suprema = false }: { side: BattleSide; moveName: string; color: string; suprema?: boolean }) {
        if (!state.enabled || state.concluded) return
        state.suprema = suprema
        state.knockout = false
        setDamageNumber(null); setKnockoutSide(null)
        setBanner({ id: ++state.id, side, name: moveName, color, suprema })
        play(par(
          call(() => fx.letterbox(true)),
          call(() => camera.to(attackerShot(side, suprema))),
          call(() => (suprema ? fx.flash({ ms: 320, peak: 0.55 }) : undefined)),
        ))
      },
      release(targetSide: BattleSide) {
        if (!state.enabled || state.concluded) return
        play(call(() => camera.to(targetShot(targetSide, state.suprema))))
      },
      impact() {
        if (!state.enabled || state.concluded) return
        void camera.punch({ zoom: state.suprema ? 1.07 : 1.04, ms: 170 })
      },
      diceStart() {
        if (!state.enabled || state.concluded) return
        setBanner(null)
        play(call(() => camera.reset(360)))
      },
      damageReveal({ targetSide, damage, hpMax, ko, multiplier }: { targetSide: BattleSide; damage: number; hpMax: number; ko: boolean; multiplier: number }) {
        if (!state.enabled || state.concluded) return
        const trauma = damageTrauma(damage, hpMax, ko)
        state.knockout = ko
        if (damage > 0) setDamageNumber({ id: ++state.id, side: targetSide, amount: damage, tone: efficacyTone(multiplier), ko })
        play(par(
          // Il numero resta il tempo di leggerlo, poi lascia libero il bersaglio.
          seq(hold(1200), call(() => { setDamageNumber(null) })),
          seq(
            par(
              call(() => { camera.impact(trauma) }),
              call(() => (trauma > 0 ? fx.flash({ ms: 180, peak: 0.18 + 0.4 * trauma }) : undefined)),
            ),
            ko
              ? seq(hold(140), call(() => { setKnockoutSide(targetSide) }), call(() => camera.to(knockoutShot(targetSide))))
              : hold(0),
          ),
        ))
      },
      attackEnd() {
        if (!state.enabled || state.concluded) return
        const lingering = state.knockout
        state.suprema = false
        state.knockout = false
        setBanner(null)
        play(seq(
          // Dopo un KO l'inquadratura resta un istante sul caduto prima di riaprirsi.
          hold(lingering ? 320 : 0),
          call(() => { setDamageNumber(null); setKnockoutSide(null) }),
          par(call(() => fx.letterbox(false)), call(() => camera.reset(420))),
        ))
      },
      outcome(winner: BattleSide) {
        if (!state.enabled) return
        // Da qui in poi nessuna battuta d'azione arrivata in ritardo può riaprire bande o inquadrature.
        state.concluded = true
        state.suprema = false
        state.knockout = false
        setBanner(null); setDamageNumber(null); setKnockoutSide(null)
        play(seq(
          call(() => fx.letterbox(false)),
          hold(180),
          call(() => camera.to(outcomeShot(winner))),
          call(() => { fx.clear() }),
        ))
      },
      resume() { state.concluded = false },
      reset,
    }
    // Cinepresa, effetti e sequenziatore sono stabili per tutta la vita della scena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [director, fx, rig])

  // Entrando nell'editor dei layout o in un'anteprima il mondo deve restare fermo.
  useEffect(() => { if (!enabled) controls.reset() }, [enabled, controls])

  return useMemo(() => ({ banner, damageNumber, knockoutSide, ...controls }), [banner, damageNumber, knockoutSide, controls])
}
