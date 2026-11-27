import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import type { NavigazioneScena } from '@/types'
import { SceneInputContext, SceneNavigationContext } from './SceneNavigationContext'
import { SceneTransitionOverlay } from './SceneTransitionOverlay'
import { CinematicFx, type CinematicStage } from './CinematicFx'
import { createSceneTransitionState, getSceneKey, sceneTransitionReducer } from './sceneTransitionState'
import { getSceneTransitionProfile, type SceneTransitionProfile } from './sceneTransitionProfiles'
import { measureTransitionAnchor, PREPARE_LIMIT_MS, supportsViewTransitions, type AnchorPoint } from './sceneTransitionRuntime'
import { playSfx } from '@/utils/soundManager'
import { useRegiaStore } from '@/regia/regiaStore'

let transitionStyles: Promise<unknown> | undefined
function prepareTransitionStyles(): Promise<unknown> {
  return transitionStyles ??= Promise.all([import('./sceneTransitions.css'), import('./cinematicTransitions.css')]).catch(error => {
    transitionStyles = undefined
    throw error
  })
}

interface SceneTransitionProps {
  navigation: NavigazioneScena
  renderScene: (navigation: NavigazioneScena) => ReactNode
  /** Precarica modulo e sfondo della scena di arrivo; la rivelazione la attende entro un limite. */
  prepareScene?: (navigation: NavigazioneScena) => Promise<unknown>
  children?: ReactNode
  /** Una battaglia ripresa al montaggio rivede il suo ingresso (falso nel laboratorio). */
  replayBattleIntro?: boolean
}

interface Preparation {
  key: string
  done: boolean
  promise: Promise<void>
}

/** Modalità disegnate in CSS che partono solo dopo la preparazione del livello di scena. */
const PRIMED_MODES = new Set<SceneTransitionProfile['mode']>(['fade', 'white', 'iris', 'diagonal', 'brush', 'zoom-in', 'zoom-out'])

/** Attesa massima della preparazione prima di avviare comunque la copertura. */
const PRIME_LIMIT_MS = 700

const waitFrame = () => new Promise<void>(resolve => window.setTimeout(resolve, 16))

/** Margine massimo oltre la durata prevista dell'anticipazione, se le animazioni partono in ritardo. */
const ANTICIPATION_SLACK_MS = 650
/** Margine massimo oltre la durata prevista della rivelazione. */
const REVEAL_SLACK_MS = 1600

type StartViewTransition = (update: () => Promise<void>) => { finished: Promise<void>; skipTransition?: () => void }

/** Variabili della View Transition sul documento: le istantanee vivono fuori dall'albero di React. */
const VT_VARS = ['--arka-tx-rev', '--arka-tx-x', '--arka-tx-y', '--arka-tx-nx', '--arka-tx-ny', '--arka-tx-cx', '--arka-tx-cy', '--arka-tx-dx', '--arka-tx-dy', '--arka-tx-rmax'] as const
function clearViewTransitionStage(): void {
  const root = document.documentElement
  delete root.dataset.arkaTx
  for (const name of VT_VARS) root.style.removeProperty(name)
}

/** Punto della scena (percentuale del suo riquadro) in percentuale della finestra. */
function toViewport(scene: HTMLElement | null, point: { x: number; y: number }): { x: number; y: number } {
  if (!scene || typeof window === 'undefined' || !window.innerWidth || !window.innerHeight) return point
  const box = scene.getBoundingClientRect()
  return {
    x: Math.round((box.left + box.width * point.x / 100) / window.innerWidth * 10000) / 100,
    y: Math.round((box.top + box.height * point.y / 100) / window.innerHeight * 10000) / 100,
  }
}

const coverRadius = () => typeof window === 'undefined' ? 1600 : Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) / 2) + 24

export function SceneTransition({ navigation, renderScene, prepareScene, children, replayBattleIntro = true }: SceneTransitionProps) {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const [state, dispatch] = useReducer(sceneTransitionReducer, navigation, (initial) => {
    const initialState = createSceneTransitionState(initial)
    // A restored battle still gets its existing introduction, once per mount.
    return initial.scena === 'battaglia' && !reducedMotion && replayBattleIntro
      ? { ...initialState, phase: 'cover' as const, revision: 1 }
      : initialState
  })
  // Gli stili delle transizioni arrivano quando il gioco è fermo: il primo cambio di scena non li aspetta.
  useLayoutEffect(() => {
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback
    const load = () => { void prepareTransitionStyles().catch(() => undefined) }
    if (idle) { const id = idle(load, { timeout: 4000 }); return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id) }
    const timer = window.setTimeout(load, 1500)
    return () => window.clearTimeout(timer)
  }, [])
  const lastRequest = useRef({ navigation, reducedMotion })
  const sceneRef = useRef<HTMLDivElement>(null)
  const wasTransitioning = useRef(false)
  const previousTransition = useRef({ revision: state.revision, phase: state.phase })
  const transitioning = state.phase !== 'idle'
  const [stylesReady, setStylesReady] = useState(false)
  useLayoutEffect(() => {
    if (!transitioning || stylesReady) return
    let current = true
    void prepareTransitionStyles().then(() => { if (current) setStylesReady(true) }, () => {
      // A missing stylesheet must not leave navigation locked behind an invisible overlay.
      if (current) dispatch({ type: 'navigate', navigation: state.target, reducedMotion: true })
    })
    return () => { current = false }
  }, [transitioning, stylesReady, state.revision, state.target])
  useLayoutEffect(() => {
    useRegiaStore.getState().setBusy(transitioning, 'Cambio scena', 'transition')
    return () => useRegiaStore.getState().setBusy(false, '', 'transition')
  }, [transitioning])

  // La scena di partenza decide le transizioni direzionali: la si ricorda per revisione,
  // perché durante la rivelazione `shown` è già la scena di arrivo.
  const origins = useRef(new Map<number, NavigazioneScena>())
  if (state.phase === 'cover' && !origins.current.has(state.revision)) {
    origins.current.set(state.revision, state.shown)
    for (const revision of origins.current.keys()) if (revision < state.revision - 4) origins.current.delete(revision)
  }
  const baseProfile = getSceneTransitionProfile(state.target, origins.current.get(state.revision))
  // Senza View Transitions API l'elemento condiviso ripiega su una dissolvenza.
  const resolvedProfile: SceneTransitionProfile = baseProfile.mode === 'shared' && !supportsViewTransitions()
    ? { ...baseProfile, mode: 'fade' } : baseProfile
  const profile = { ...resolvedProfile, coverMs: resolvedProfile.coverMs / speed, blendMs: resolvedProfile.blendMs / speed,
    durationMs: resolvedProfile.durationMs / speed, playbackRate: resolvedProfile.playbackRate * speed }
  const startCovered = state.revision !== previousTransition.current.revision
    && previousTransition.current.phase !== 'idle'

  // Una copertura che parte già chiusa (navigazione durante un'altra transizione) resta classica.
  const coverStartsCovered = useRef(new Map<number, boolean>())
  if (state.phase === 'cover' && !coverStartsCovered.current.has(state.revision)) {
    coverStartsCovered.current.set(state.revision, startCovered)
    for (const revision of coverStartsCovered.current.keys()) if (revision < state.revision - 4) coverStartsCovered.current.delete(revision)
  }

  // Transizione cinematografica: anticipazione sulla scena viva, poi le due scene insieme
  // (View Transition) oppure la sequenza dedicata (Carta VS, dado d'evoluzione).
  const baseCinematic = resolvedProfile.cinematic
  const cinematic = transitioning && baseCinematic && coverStartsCovered.current.get(state.revision) === false
    && (baseCinematic.handoff === 'overlay' || supportsViewTransitions())
    ? { ...baseCinematic, anticipateMs: baseCinematic.anticipateMs / speed, revealMs: baseCinematic.revealMs / speed } : null
  const [cinematicStep, setCinematicStep] = useState<{ revision: number; stage: CinematicStage } | null>(null)
  const cinematicStage: CinematicStage = cinematicStep?.revision === state.revision ? cinematicStep.stage : 'anticipate'
  const fxRef = useRef<HTMLDivElement>(null)
  const activeViewTransition = useRef<{ revision: number; skip: () => void } | null>(null)

  useLayoutEffect(() => {
    previousTransition.current = { revision: state.revision, phase: state.phase }
  }, [state.revision, state.phase])

  // Suono del passaggio: quello della transizione cinematografica, altrimenti un soffio.
  // La battaglia classica ha già il suo ingresso (Carta VS, con il suo suono).
  const cinematicSound = cinematic?.sound
  useLayoutEffect(() => {
    if (state.phase !== 'cover') return
    if (cinematicSound) return playSfx(cinematicSound)
    if (state.target.scena !== 'battaglia') return playSfx('transition.whoosh')
  }, [state.phase, state.revision, state.target.scena, cinematicSound])

  useLayoutEffect(() => {
    if (lastRequest.current.navigation === navigation && lastRequest.current.reducedMotion === reducedMotion) return
    lastRequest.current = { navigation, reducedMotion }
    dispatch({ type: 'navigate', navigation, reducedMotion })
  }, [navigation, reducedMotion])

  // Precaricamento: parte appena lo schermo inizia a coprirsi, così la scena di arrivo
  // non mostra un fotogramma vuoto di caricamento durante la rivelazione.
  const preparation = useRef<Preparation | null>(null)
  const prepare = useRef(prepareScene)
  prepare.current = prepareScene
  const ensurePrepared = useCallback((target: NavigazioneScena): Preparation => {
    const key = getSceneKey(target)
    if (preparation.current?.key === key) return preparation.current
    const entry: Preparation = { key, done: !prepare.current, promise: Promise.resolve() }
    if (prepare.current) {
      const run = prepare.current
      entry.promise = Promise.resolve().then(() => run(target)).then(() => undefined, () => undefined)
        .finally(() => { entry.done = true })
    }
    preparation.current = entry
    return entry
  }, [])
  useLayoutEffect(() => {
    if (state.phase === 'cover') ensurePrepared(state.target)
  }, [ensurePrepared, state.phase, state.target])

  const covered = useCallback((revision: number, target: NavigazioneScena) => {
    const entry = ensurePrepared(target)
    if (entry.done) { dispatch({ type: 'covered', revision }); return }
    let fired = false
    const go = () => {
      if (fired) return
      fired = true
      window.clearTimeout(limit)
      dispatch({ type: 'covered', revision })
    }
    const limit = window.setTimeout(go, PREPARE_LIMIT_MS)
    void entry.promise.then(go)
  }, [ensurePrepared])

  // Punto di fuga di iride e zoom: il nodo della mappa nella scena che esce o in quella che entra.
  const [anchor, setAnchor] = useState<{ revision: number; point: AnchorPoint } | null>(null)
  const anchorName = transitioning ? profile.anchor?.name : undefined
  const anchorScene = profile.anchor?.scene
  useLayoutEffect(() => {
    if (!anchorName) return
    const revision = state.revision
    const read = () => {
      const scene = sceneRef.current
      const point = scene ? measureTransitionAnchor(scene, anchorName) : null
      if (point) setAnchor(previous => previous?.revision === revision && previous.point.x === point.x && previous.point.y === point.y
        ? previous : { revision, point })
      return point
    }
    if (anchorScene === 'outgoing' && state.phase === 'cover') { read(); return }
    if (anchorScene !== 'incoming' || state.phase !== 'reveal') return
    // La scena di arrivo può impiegare qualche fotogramma a montare il nodo.
    let frame = 0, attempts = 0
    const poll = () => { if (!read() && ++attempts < 24) frame = requestAnimationFrame(poll) }
    poll()
    return () => cancelAnimationFrame(frame)
  }, [anchorName, anchorScene, state.phase, state.revision])
  const anchorPoint = anchor?.revision === state.revision ? anchor.point : null

  // Regia della transizione cinematografica. I valori cambiano durante l'anticipazione
  // (punto di fuga misurato, bersaglio aggiornato): il tempo la legge sempre aggiornata.
  const cinematicRef = useRef({ cinematic, anchorPoint, target: state.target, anchor: profile.anchor })
  cinematicRef.current = { cinematic, anchorPoint, target: state.target, anchor: profile.anchor }
  const cinematicKey = cinematic ? `${state.revision}:${cinematic.kind}` : ''
  useLayoutEffect(() => {
    if (!cinematicKey || !stylesReady || state.phase !== 'cover' || cinematicStage !== 'anticipate') return
    const revision = state.revision
    let cancelled = false
    const hold = cinematicRef.current.cinematic!.anticipateMs
    // L'anticipazione finisce quando le sue animazioni finiscono davvero (un primo fotogramma
    // lento le fa partire in ritardo), mai prima del tempo previsto né oltre un piccolo margine.
    const settled = () => {
      const running = [...(fxRef.current?.getAnimations?.({ subtree: true }) ?? []), ...(sceneRef.current?.getAnimations?.() ?? [])]
        .filter(animation => animation.playState === 'running')
      return Promise.race([
        Promise.all(running.map(animation => animation.finished.catch(() => undefined))),
        new Promise(resolve => window.setTimeout(resolve, ANTICIPATION_SLACK_MS)),
      ])
    }
    const timer = window.setTimeout(() => void settled().then(() => {
      const current = cinematicRef.current.cinematic
      if (cancelled || !current) return
      if (current.handoff === 'overlay') { setCinematicStep({ revision, stage: 'overlay' }); return }
      // Si attende la scena di arrivo (modulo e sfondo) prima di fotografare quella che esce.
      const entry = ensurePrepared(cinematicRef.current.target)
      const ready = entry.done ? Promise.resolve() : Promise.race([entry.promise, new Promise(resolve => window.setTimeout(resolve, PREPARE_LIMIT_MS))])
      void ready.then(() => { if (!cancelled) runViewTransition(revision) })
    }), hold)
    return () => { cancelled = true; window.clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematicKey, stylesReady, state.phase, cinematicStage])

  const runViewTransition = (revision: number) => {
    const { cinematic: current, anchorPoint: point, anchor } = cinematicRef.current
    if (!current) return
    const root = document.documentElement
    const origin = toViewport(sceneRef.current, point ?? { x: 50, y: 50 })
    const center = toViewport(sceneRef.current, { x: 50, y: 50 })
    const box = sceneRef.current?.getBoundingClientRect()
    const rmax = box ? Math.ceil(Math.hypot(box.width, box.height) / 2) + 24 : coverRadius()
    root.style.setProperty('--arka-tx-rev', `${Math.round(current.revealMs)}ms`)
    root.style.setProperty('--arka-tx-x', `${origin.x}%`)
    root.style.setProperty('--arka-tx-y', `${origin.y}%`)
    root.style.setProperty('--arka-tx-nx', `${center.x}%`)
    root.style.setProperty('--arka-tx-ny', `${center.y}%`)
    root.style.setProperty('--arka-tx-cx', `${center.x}%`)
    root.style.setProperty('--arka-tx-cy', `${center.y}%`)
    root.style.setProperty('--arka-tx-dx', String(current.direction.x))
    root.style.setProperty('--arka-tx-dy', String(current.direction.y))
    root.style.setProperty('--arka-tx-rmax', `${rmax}px`)
    root.dataset.arkaTx = current.kind
    fxRef.current?.style.setProperty('view-transition-name', 'arka-tx-fx')
    let finished = false
    let guard = 0
    const finish = () => {
      if (finished) return
      finished = true
      window.clearTimeout(guard)
      clearViewTransitionStage()
      fxRef.current?.style.removeProperty('view-transition-name')
      if (activeViewTransition.current?.revision === revision) activeViewTransition.current = null
      dispatch({ type: 'revealed', revision })
    }
    try {
      const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition!
      const transition = start.call(document, async () => {
        // Scambio delle scene sotto l'istantanea: la nuova monta già nella sua posa di partenza.
        flushSync(() => {
          dispatch({ type: 'covered', revision })
          setCinematicStep({ revision, stage: 'reveal' })
        })
        for (let attempt = 0; attempt < 3; attempt++) await waitFrame()
        // La risalita parte dal luogo appena lasciato, ora visibile sulla mappa che entra.
        if (anchor?.scene === 'incoming' && sceneRef.current) {
          let found = measureTransitionAnchor(sceneRef.current, anchor.name)
          for (let attempt = 0; !found && attempt < 12; attempt++) { await waitFrame(); found = measureTransitionAnchor(sceneRef.current, anchor.name) }
          if (found) {
            const target = toViewport(sceneRef.current, found)
            root.style.setProperty('--arka-tx-nx', `${target.x}%`)
            root.style.setProperty('--arka-tx-ny', `${target.y}%`)
          }
        }
      })
      activeViewTransition.current = { revision, skip: () => transition.skipTransition?.() }
      // Su una macchina in affanno la rivelazione non deve tenere il gioco bloccato: oltre un
      // margine si salta all'ultimo fotogramma (la scena nuova è già al suo posto).
      guard = window.setTimeout(() => transition.skipTransition?.(), current.revealMs + REVEAL_SLACK_MS)
      void transition.finished.then(finish, finish)
    } catch {
      // Una View Transition rifiutata non deve bloccare la navigazione.
      flushSync(() => {
        dispatch({ type: 'covered', revision })
        setCinematicStep({ revision, stage: 'reveal' })
      })
      finish()
    }
  }

  // Una nuova navigazione durante la rivelazione chiude subito quella in corso.
  useLayoutEffect(() => {
    const active = activeViewTransition.current
    if (active && active.revision !== state.revision) active.skip()
  }, [state.revision])
  useLayoutEffect(() => () => { activeViewTransition.current?.skip(); clearViewTransitionStage() }, [])

  // Elemento condiviso: la View Transitions API fotografa la scena che esce e anima
  // l'elemento con lo stesso `view-transition-name` verso quello della scena che entra.
  const sharedElement = transitioning && profile.mode === 'shared' ? profile.sharedElement : null
  const sharedDurationMs = profile.durationMs
  const sharedStarted = useRef(0)
  useLayoutEffect(() => {
    if (!stylesReady || !sharedElement || state.phase !== 'cover' || sharedStarted.current === state.revision) return
    const revision = state.revision
    const target = state.target
    const viewName = `arka-shared-${sharedElement}`
    let cancelled = false
    const tag = () => {
      const element = sceneRef.current?.querySelector<HTMLElement>(`[data-shared-element="${sharedElement}"]`)
      if (element) element.style.setProperty('view-transition-name', viewName)
      return element ?? null
    }
    const start = () => {
      if (cancelled || sharedStarted.current === revision) return
      sharedStarted.current = revision
      const outgoing = tag()
      document.documentElement.style.setProperty('--arka-vt-ms', `${Math.round(sharedDurationMs)}ms`)
      const startViewTransition = (document as Document & { startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> } }).startViewTransition
      const finish = () => {
        sceneRef.current?.querySelectorAll<HTMLElement>('[data-shared-element]').forEach(element => element.style.removeProperty('view-transition-name'))
        dispatch({ type: 'revealed', revision })
      }
      try {
        const transition = startViewTransition!.call(document, async () => {
          flushSync(() => dispatch({ type: 'covered', revision }))
          outgoing?.style.removeProperty('view-transition-name')
          // Il modulo può sospendere per un istante: l'istantanea resta ferma finché il bersaglio non c'è.
          for (let attempt = 0; attempt < 30 && !tag(); attempt++) await waitFrame()
        })
        void transition.finished.then(finish, finish)
      } catch {
        dispatch({ type: 'covered', revision })
        finish()
      }
    }
    const entry = ensurePrepared(target)
    if (entry.done) start()
    else void Promise.race([entry.promise, new Promise(resolve => window.setTimeout(resolve, PREPARE_LIMIT_MS))]).then(start)
    return () => { cancelled = true }
  }, [ensurePrepared, sharedDurationMs, sharedElement, state.phase, state.revision, state.target, stylesReady])

  useLayoutEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.inert = transitioning
    if (wasTransitioning.current && !transitioning && document.activeElement === document.body) {
      // An input mounted under inert cannot receive React's initial autofocus.
      scene.querySelector<HTMLElement>('input:not([disabled]), button:not([disabled])')?.focus()
    }
    wasTransitioning.current = transitioning
    if (!transitioning) return

    // Grid movement listens on window; inert alone cannot suppress those keys.
    const blockKeyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest('.arka-admin-panel, [data-game-dialog], [data-battle-log-dialog]')) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    window.addEventListener('keydown', blockKeyboard, true)
    window.addEventListener('keyup', blockKeyboard, true)
    return () => {
      scene.inert = false
      window.removeEventListener('keydown', blockKeyboard, true)
      window.removeEventListener('keyup', blockKeyboard, true)
    }
  }, [transitioning])

  // Preparazione: l'overlay resta invisibile finché la scena non può davvero animarsi.
  // Il primo fotogramma dopo il clic può costare centinaia di millisecondi (lavoro di React,
  // rasterizzazione della mappa): senza questa attesa lo zoom verrebbe tagliato dal timer.
  const [primedStep, setPrimedStep] = useState('')
  const needsPriming = PRIMED_MODES.has(profile.mode)
  const step = `${state.revision}:${state.phase}`
  // Una copertura che parte già chiusa non deve mostrare la scena per due fotogrammi.
  const skipPriming = !transitioning || !stylesReady || !needsPriming || (state.phase === 'cover' && coverStartsCovered.current.get(state.revision) === true)
  const zoomMode = profile.mode === 'zoom-in' || profile.mode === 'zoom-out'
  useLayoutEffect(() => {
    if (skipPriming || primedStep === step) return
    let settled = false
    const go = () => { if (!settled) { settled = true; setPrimedStep(step) } }
    // Lo zoom della scena è un'animazione del compositore: parte solo quando il livello
    // ingrandito è rasterizzato. Iride e tempi dell'overlay la aspettano (`ready`), sia
    // all'entrata sia alla rivelazione.
    const animations = zoomMode ? sceneRef.current?.getAnimations?.() ?? [] : []
    if (animations.length) {
      void Promise.all(animations.map(animation => animation.ready)).then(go, go)
      const limit = window.setTimeout(go, PRIME_LIMIT_MS)
      return () => { settled = true; window.clearTimeout(limit) }
    }
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(go) })
    return () => { settled = true; cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [primedStep, skipPriming, step, zoomMode])
  const primed = skipPriming || primedStep === step

  // Gli stati interni della transizione (preparazione, punto di fuga) non devono
  // ridisegnare l'intera scena: l'elemento cambia solo con la scena mostrata.
  const presentedScene = useMemo(() => renderScene(state.shown), [renderScene, state.shown])

  const zooming = transitioning && stylesReady && !cinematic && (profile.mode === 'zoom-in' || profile.mode === 'zoom-out')
  // Camera viva durante l'anticipazione; nella rivelazione la scena nuova entra senza trasformazioni.
  const anticipating = !!cinematic && stylesReady && state.phase === 'cover' && cinematicStage !== 'reveal'
  const sceneMotion = anticipating ? `cx-${cinematic.kind}` : zooming ? `${profile.mode}-${state.phase}` : undefined
  const sceneStyle = zooming || anticipating ? {
    '--tx-x': `${anchorPoint?.x ?? 50}%`,
    '--tx-y': `${anchorPoint?.y ?? 50}%`,
    '--tx-cover-ms': `${profile.coverMs}ms`,
    '--tx-reveal-ms': `${profile.durationMs}ms`,
    ...(cinematic ? { '--tx-ant-ms': `${Math.round(cinematic.anticipateMs)}ms`, '--tx-dx': cinematic.direction.x, '--tx-dy': cinematic.direction.y } : {}),
  } as CSSProperties : undefined
  const showFx = !!cinematic && stylesReady && (state.phase === 'cover' || cinematic.handoff === 'snapshot')
  const showOverlay = transitioning && stylesReady && (!cinematic || (cinematic.handoff === 'overlay' && (cinematicStage === 'overlay' || state.phase === 'reveal')))

  return (
    <SceneNavigationContext.Provider value={state.shown}>
      <SceneInputContext.Provider value={transitioning}>
      {children}
      <div
        ref={sceneRef}
        className="absolute inset-0"
        data-presented-scene={getSceneKey(state.shown)}
        data-scene-motion={sceneMotion}
        style={sceneStyle}
        aria-busy={transitioning}
      >
        <div key={getSceneKey(state.shown)} className="absolute inset-0">
          {presentedScene}
        </div>
      </div>
      {transitioning && stylesReady ? <p className="sr-only" role="status">{profile.label}</p> : null}
      {showFx && cinematic ? (
        <CinematicFx
          key={`fx-${state.revision}`}
          ref={fxRef}
          kind={cinematic.kind}
          stage={cinematicStage}
          anchor={anchorPoint ?? { x: 50, y: 50 }}
          direction={cinematic.direction}
          anticipateMs={cinematic.anticipateMs}
          revealMs={cinematic.revealMs}
          coverRadiusPx={sceneRef.current ? Math.ceil(Math.hypot(sceneRef.current.clientWidth, sceneRef.current.clientHeight) / 2) + 24 : coverRadius()}
        />
      ) : null}
      {showOverlay ? (
        <>
          <SceneTransitionOverlay
            key={state.revision}
            cinematic={!!cinematic}
            startCovered={startCovered}
            phase={state.phase === 'cover' ? 'cover' : 'reveal'}
            profile={profile}
            anchor={anchorPoint}
            primed={primed}
            onCovered={() => covered(state.revision, state.target)}
            onRevealed={() => dispatch({ type: 'revealed', revision: state.revision })}
          />
        </>
      ) : null}
      </SceneInputContext.Provider>
    </SceneNavigationContext.Provider>
  )
}
