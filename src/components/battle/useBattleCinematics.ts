import { useEffect, useMemo, useRef, useState } from 'react'
import type { CameraRig } from '@/motion/useCameraRig'
import type { ScreenFx } from '@/motion/ScreenFx'
import { call, hold, par, seq, wait, when, type Beat, type Playback } from '@/motion/director'
import { useDirector } from '@/motion/useDirector'
import {
  attackerShot, damageTrauma, efficacyTone, knockoutShot, outcomeShot, targetShot,
  type BattleSide, type EfficacyTone,
} from './battleCinematics'
import { CAPTURE_TIMING, type CaptureDisplay } from './BattleCaptureLayer'
import type { CapturePlan } from './battleCapture'
import { SUPREME_CUT_IN_MS, type SupremeCutInDisplay } from './SupremeCutIn'

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
  /** Stacco a tutto schermo della Mossa Suprema, oppure `null`. */
  cutIn: SupremeCutInDisplay | null
  /** Sfera di cattura in scena, oppure `null`. */
  captureDisplay: CaptureDisplay | null
  /**
   * Inizio dell'azione: bande, nome della mossa e carrellata su chi attacca.
   * Si risolve quando l'attacco può partire: subito, oppure a fine stacco per
   * la Suprema. Si risolve sempre, anche se la regia viene interrotta.
   */
  attackStart(options: { side: BattleSide; moveName: string; color: string; suprema?: boolean; speciesId?: number; pokemonName?: string }): Promise<void>
  /** Cattura: lancio, oscillazioni con i dadi, esito. Si risolve sempre a fine presentazione. */
  capture(plan: CapturePlan): Promise<void>
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
  const [cutIn, setCutIn] = useState<SupremeCutInDisplay | null>(null)
  const [captureDisplay, setCapture] = useState<CaptureDisplay | null>(null)
  const runtime = useRef<{ playback: Playback | null; id: number; enabled: boolean; suprema: boolean; knockout: boolean; concluded: boolean; captured: boolean }>(
    { playback: null, id: 0, enabled, suprema: false, knockout: false, concluded: false, captured: false },
  )
  runtime.current.enabled = enabled

  const controls = useMemo(() => {
    const state = runtime.current
    const { camera } = rig
    const play = (beat: Beat): Promise<void> => {
      state.playback?.cancel()
      const playback = director.play(beat)
      state.playback = playback
      // Un errore di presentazione non deve mai fermare la battaglia.
      return playback.finished.catch(() => undefined).then(() => { if (state.playback === playback) state.playback = null })
    }
    const reset = () => {
      state.playback?.cancel()
      state.playback = null
      state.suprema = false
      state.knockout = false
      state.concluded = false
      state.captured = false
      setBanner(null); setDamageNumber(null); setKnockoutSide(null); setCutIn(null); setCapture(null)
      fx.clear()
      void camera.reset(0)
    }
    return {
      attackStart({ side, moveName, color, suprema = false, speciesId, pokemonName }: { side: BattleSide; moveName: string; color: string; suprema?: boolean; speciesId?: number; pokemonName?: string }) {
        if (!state.enabled || state.concluded) return Promise.resolve()
        state.suprema = suprema
        state.knockout = false
        setDamageNumber(null); setKnockoutSide(null)
        const opening = par(
          call(() => { setBanner({ id: ++state.id, side, name: moveName, color, suprema }) }),
          call(() => fx.letterbox(true)),
          call(() => camera.to(attackerShot(side, suprema))),
        )
        if (!suprema || speciesId === undefined) {
          void play(opening)
          return Promise.resolve()
        }
        // Suprema: prima lo stacco a tutto schermo, poi l'attacco. Con il movimento ridotto lo stacco non c'è.
        let releaseAttack!: () => void
        const ready = new Promise<void>((resolve) => { releaseAttack = resolve })
        void play(seq(
          when((context) => !context.settings.reducedMotion, seq(
            call(() => { setCutIn({ id: ++state.id, side, speciesId, pokemonName: pokemonName ?? '', moveName, color }) }),
            wait(SUPREME_CUT_IN_MS),
            call(() => { setCutIn(null) }),
            call(() => fx.flash({ ms: 260, peak: 0.9 })),
          )),
          call(() => { releaseAttack() }),
          opening,
        )).then(() => { setCutIn(null); releaseAttack() })
        return ready
      },
      capture(plan: CapturePlan) {
        if (!state.enabled || state.concluded) return Promise.resolve()
        const id = ++state.id
        let shakes = 0
        let revealed: CaptureDisplay['revealed'] = []
        const show = (patch: Partial<CaptureDisplay>) => setCapture((current) => ({
          id, kind: plan.kind, phase: 'throw', shake: shakes, revealed, maxTotal: plan.maxTotal, ...(current?.id === id ? current : {}), ...patch,
        }))
        const oscillations = plan.steps.map((step) => seq(
          call(() => { shakes += 1; show({ phase: 'shake', shake: shakes }) }),
          wait(CAPTURE_TIMING.shake),
          call(() => { revealed = [...revealed, step]; show({ revealed }) }),
          // I dadi vanno letti anche con il movimento ridotto.
          step.die === null ? wait(220) : hold(560),
        ))
        return play(seq(
          call(() => { setBanner(null); setDamageNumber(null); setKnockoutSide(null); show({ phase: 'throw' }) }),
          par(
            call(() => fx.letterbox(true)),
            call(() => camera.to({ focus: 'enemy', zoom: 1.2, ms: 560, ease: 'out' })),
            wait(CAPTURE_TIMING.throw),
          ),
          call(() => { show({ phase: 'absorb' }) }),
          par(call(() => fx.flash({ ms: CAPTURE_TIMING.absorb, peak: 0.55 })), wait(CAPTURE_TIMING.absorb)),
          call(() => { show({ phase: 'settle' }) }),
          wait(CAPTURE_TIMING.settle),
          ...oscillations,
          plan.caught
            ? seq(
              call(() => { state.captured = true; show({ phase: 'caught' }) }),
              par(call(() => camera.punch({ zoom: 1.06, ms: 220 })), call(() => fx.flash({ ms: 280, peak: 0.45 }))),
              hold(900),
            )
            : seq(
              call(() => { show({ phase: 'escaped' }) }),
              call(() => { camera.impact(0.5) }),
              hold(700),
              call(() => { setCapture(null) }),
              par(call(() => fx.letterbox(false)), call(() => camera.reset(420))),
            ),
        )).then(() => {
          // Dopo una fuga, anche se interrotta, la sfera non resta in campo.
          if (!plan.caught) setCapture((current) => (current?.id === id ? null : current))
        })
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
        // La sfera di una cattura riuscita resta in campo: l'Arkamon è dentro.
        setBanner(null); setDamageNumber(null); setKnockoutSide(null); setCutIn(null)
        play(seq(
          call(() => fx.letterbox(false)),
          hold(180),
          // Dopo una cattura la camera resta sulla sfera, non sul vincitore.
          call(() => camera.to(state.captured ? { focus: 'enemy', zoom: 1.1, ms: 600, ease: 'inOut' } : outcomeShot(winner))),
          call(() => { fx.clear() }),
        ))
      },
      resume() { state.concluded = false; state.captured = false },
      reset,
    }
    // Cinepresa, effetti e sequenziatore sono stabili per tutta la vita della scena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [director, fx, rig])

  // Entrando nell'editor dei layout o in un'anteprima il mondo deve restare fermo.
  useEffect(() => { if (!enabled) controls.reset() }, [enabled, controls])

  return useMemo(() => ({ banner, damageNumber, knockoutSide, cutIn, captureDisplay, ...controls }), [banner, damageNumber, knockoutSide, cutIn, captureDisplay, controls])
}
