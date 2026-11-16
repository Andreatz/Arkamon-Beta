import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { assetUrl } from '@/utils/assetUrl'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { call, guard, hold, par, seq, tween, type Beat, type Playback } from './director'
import { ScreenFxLayer, useScreenFx } from './ScreenFx'
import { Stage, StageLayer } from './Stage'
import { useCameraRig } from './useCameraRig'
import { useDirector } from './useDirector'

const FOCUS_POINTS = { player: { x: 0.27, y: 0.7 }, enemy: { x: 0.73, y: 0.36 } } as const
const BUTTON = 'rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-50'
const PRIMARY = 'rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-50'

/**
 * Laboratorio del modulo di regia: mostra cinepresa, parallasse, effetti a
 * schermo intero e sequenziatore su una scena di prova. Non legge né modifica
 * la partita.
 */
export function MotionLab() {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const rig = useCameraRig({ focusPoints: FOCUS_POINTS })
  const fx = useScreenFx()
  const director = useDirector('Anteprima di regia in corso')
  const playback = useRef<Playback | null>(null)
  const [status, setStatus] = useState('Scegli un’inquadratura, un effetto o la sequenza completa.')
  const [running, setRunning] = useState(false)
  const enemyHp = useMotionValue(1)
  const enemyHpWidth = useTransform(enemyHp, (value) => `${Math.round(value * 100)}%`)
  const { camera } = rig

  const run = (label: string, beat: Beat) => {
    playback.current?.cancel()
    setRunning(true)
    setStatus(`${label}: in corso.`)
    const current = director.play(beat)
    playback.current = current
    void current.finished.then((outcome) => {
      if (playback.current !== current) return
      playback.current = null
      setRunning(false)
      setStatus(outcome === 'completed' ? `${label}: completata.` : `${label}: annullata.`)
    })
  }

  const attackSequence = guard(seq(
    call(() => { enemyHp.set(1) }),
    // Preparazione: bande e carrellata sull'attaccante.
    par(call(() => fx.letterbox(true)), call(() => camera.to({ focus: 'player', zoom: 1.28, ms: 420 }))),
    hold(380),
    // Colpo: stacco rapido sul bersaglio, lampo, shake proporzionale al danno.
    call(() => camera.to({ focus: 'enemy', zoom: 1.4, ms: 200, ease: 'inOut' })),
    par(
      call(() => fx.flash({ ms: 200 })),
      call(() => { camera.impact(0.85) }),
      call(() => camera.punch({ zoom: 1.07, ms: 220 })),
      tween({ ms: 520, from: 1, to: 0.35, update: (value) => enemyHp.set(value) }),
    ),
    hold(520),
    // Conseguenza: si torna alla panoramica.
    par(call(() => fx.letterbox(false)), call(() => camera.reset(520))),
  ), () => { fx.clear() })

  const fadeSequence = (color: 'black' | 'white') => guard(seq(
    call(() => fx.cover(color, 380)),
    hold(260),
    call(() => fx.reveal(460)),
  ), () => { fx.clear() })

  return (
    <main className="h-full overflow-y-auto bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Laboratorio</p>
            <h1 className="text-2xl font-black sm:text-3xl">Cinepresa e sequenze</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">
              Palco a livelli, cinepresa, effetti a schermo intero e sequenziatore del modulo <code>src/motion</code>.
              Lo sfondo è un livello lontano e la luce in primo piano un livello vicino: durante zoom e panoramiche si muovono a velocità diverse.
            </p>
          </div>
          <a href="#" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">Torna al gioco</a>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Comandi di regia">
          <fieldset className="grid gap-2 rounded-xl border border-white/10 p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">Inquadrature</legend>
            <button type="button" className={BUTTON} onClick={() => run('Panoramica', call(() => camera.reset()))}>Panoramica</button>
            <button type="button" className={BUTTON} onClick={() => run('Primo piano avversario', call(() => camera.to({ focus: 'enemy', zoom: 1.45 })))}>Primo piano avversario</button>
            <button type="button" className={BUTTON} onClick={() => run('Primo piano giocatore', call(() => camera.to({ focus: 'player', zoom: 1.45 })))}>Primo piano giocatore</button>
            <button type="button" className={BUTTON} onClick={() => run('Inclinazione', seq(call(() => camera.to({ zoom: 1.12, rotate: -2.5, ms: 500 })), hold(500), call(() => camera.reset(500))))}>Inclinazione</button>
          </fieldset>
          <fieldset className="grid gap-2 rounded-xl border border-white/10 p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">Colpi</legend>
            <button type="button" className={BUTTON} onClick={() => run('Colpo leggero', seq(call(() => { camera.impact(0.4) }), hold(400)))}>Colpo leggero</button>
            <button type="button" className={BUTTON} onClick={() => run('Colpo pesante', seq(par(call(() => { camera.impact(1) }), call(() => fx.flash({ ms: 220 })), call(() => camera.punch({ zoom: 1.08 }))), hold(500)))}>Colpo pesante</button>
          </fieldset>
          <fieldset className="grid gap-2 rounded-xl border border-white/10 p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">Schermo</legend>
            <button type="button" className={BUTTON} onClick={() => run('Dissolvenza al nero', fadeSequence('black'))}>Dissolvenza al nero</button>
            <button type="button" className={BUTTON} onClick={() => run('Dissolvenza al bianco', fadeSequence('white'))}>Dissolvenza al bianco</button>
            <button type="button" className={BUTTON} onClick={() => run('Bande cinematografiche', guard(seq(call(() => fx.letterbox(true)), hold(900), call(() => fx.letterbox(false))), () => { fx.clear() }))}>Bande cinematografiche</button>
          </fieldset>
          <fieldset className="grid content-start gap-2 rounded-xl border border-white/10 p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">Sequenza</legend>
            <button type="button" className={PRIMARY} onClick={() => run('Sequenza d’attacco', attackSequence)}>Sequenza d’attacco</button>
            <button type="button" className={BUTTON} disabled={!running} onClick={() => { playback.current?.cancel(); camera.reset(240) }}>Annulla</button>
          </fieldset>
        </div>

        <p role="status" className="text-sm text-slate-300">
          {status}{' '}
          <span className="text-slate-400">
            {reducedMotion ? 'Movimento ridotto attivo: camera, shake e lampi sono disattivati; restano dissolvenze e tempi di lettura.' : speed > 1 ? 'Velocità rapida: le durate sono dimezzate.' : ''}
          </span>
        </p>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl" data-motion-lab-stage aria-label="Scena di prova">
          <Stage rig={rig} className="absolute inset-0">
            <StageLayer depth={0.55} bleed={1.1} className="bg-cover bg-center" style={{ backgroundImage: `url(${assetUrl('/backgrounds/venezia.png')})` }} />
            <StageLayer depth={1}>
              <img src={assetUrl('/sprites/front_sprites/17.png')} alt="" className="absolute object-contain" style={{ left: '58%', top: '10%', width: '30%', height: '52%' }} />
              <img src={assetUrl('/sprites/back_sprites/1.png')} alt="" className="absolute object-contain" style={{ left: '10%', top: '42%', width: '34%', height: '58%' }} />
            </StageLayer>
            <StageLayer depth={1.5} bleed={1.25} className="pointer-events-none bg-[radial-gradient(ellipse_at_15%_95%,theme(colors.amber.200/0.28),transparent_45%),radial-gradient(ellipse_at_90%_5%,theme(colors.sky.200/0.22),transparent_40%)]" />
          </Stage>

          {/* HUD: fuori dal palco, la cinepresa non lo muove. */}
          <div className="pointer-events-none absolute right-[4%] top-[5%] w-[30%] rounded-lg border border-white/20 bg-slate-950/80 p-2">
            <div className="flex items-baseline justify-between text-xs font-bold sm:text-sm"><span>Avversario</span><span className="text-slate-300">Lv 10</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700"><motion.div className="h-full rounded-full bg-[var(--hp-high)]" style={{ width: enemyHpWidth }} /></div>
          </div>
          <ScreenFxLayer fx={fx} />
        </div>
      </div>
    </main>
  )
}
