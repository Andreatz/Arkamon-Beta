import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import type { NavigazioneScena } from '@/types'
import { SceneInputContext, SceneNavigationContext } from './SceneNavigationContext'
import { SceneTransitionOverlay } from './SceneTransitionOverlay'
import { createSceneTransitionState, getSceneKey, sceneTransitionReducer } from './sceneTransitionState'
import { getSceneTransitionProfile, type SceneTransitionProfile } from './sceneTransitionProfiles'
import { measureTransitionAnchor, PREPARE_LIMIT_MS, supportsViewTransitions, type AnchorPoint } from './sceneTransitionRuntime'
import { playSelectedAudio } from '@/utils/soundManager'
import './sceneTransitions.css'
import { useRegiaStore } from '@/regia/regiaStore'

interface SceneTransitionProps {
  navigation: NavigazioneScena
  renderScene: (navigation: NavigazioneScena) => ReactNode
  /** Precarica modulo e sfondo della scena di arrivo; la rivelazione la attende entro un limite. */
  prepareScene?: (navigation: NavigazioneScena) => Promise<unknown>
  children?: ReactNode
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

export function SceneTransition({ navigation, renderScene, prepareScene, children }: SceneTransitionProps) {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const [state, dispatch] = useReducer(sceneTransitionReducer, navigation, (initial) => {
    const initialState = createSceneTransitionState(initial)
    // A restored battle still gets its existing introduction, once per mount.
    return initial.scena === 'battaglia' && !reducedMotion
      ? { ...initialState, phase: 'cover' as const, revision: 1 }
      : initialState
  })
  useLayoutEffect(() => {
    if (state.phase === 'cover' && state.target.scena !== 'battaglia') return playSelectedAudio('event:transition')
  }, [state.phase, state.revision, state.target.scena])
  const lastRequest = useRef({ navigation, reducedMotion })
  const sceneRef = useRef<HTMLDivElement>(null)
  const wasTransitioning = useRef(false)
  const previousTransition = useRef({ revision: state.revision, phase: state.phase })
  const transitioning = state.phase !== 'idle'
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

  useLayoutEffect(() => {
    previousTransition.current = { revision: state.revision, phase: state.phase }
  }, [state.revision, state.phase])

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

  // Elemento condiviso: la View Transitions API fotografa la scena che esce e anima
  // l'elemento con lo stesso `view-transition-name` verso quello della scena che entra.
  const sharedElement = transitioning && profile.mode === 'shared' ? profile.sharedElement : null
  const sharedDurationMs = profile.durationMs
  const sharedStarted = useRef(0)
  useLayoutEffect(() => {
    if (!sharedElement || state.phase !== 'cover' || sharedStarted.current === state.revision) return
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
  }, [ensurePrepared, sharedDurationMs, sharedElement, state.phase, state.revision, state.target])

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
  const coverStartsCovered = useRef(new Map<number, boolean>())
  if (state.phase === 'cover' && !coverStartsCovered.current.has(state.revision)) {
    coverStartsCovered.current.set(state.revision, startCovered)
    for (const revision of coverStartsCovered.current.keys()) if (revision < state.revision - 4) coverStartsCovered.current.delete(revision)
  }
  const step = `${state.revision}:${state.phase}`
  // Una copertura che parte già chiusa non deve mostrare la scena per due fotogrammi.
  const skipPriming = !transitioning || !needsPriming || (state.phase === 'cover' && coverStartsCovered.current.get(state.revision) === true)
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

  const zooming = transitioning && (profile.mode === 'zoom-in' || profile.mode === 'zoom-out')
  const sceneStyle = zooming ? {
    '--tx-x': `${anchorPoint?.x ?? 50}%`,
    '--tx-y': `${anchorPoint?.y ?? 50}%`,
    '--tx-cover-ms': `${profile.coverMs}ms`,
    '--tx-reveal-ms': `${profile.durationMs}ms`,
  } as CSSProperties : undefined

  return (
    <SceneNavigationContext.Provider value={state.shown}>
      <SceneInputContext.Provider value={transitioning}>
      {children}
      <div
        ref={sceneRef}
        className="absolute inset-0"
        data-presented-scene={getSceneKey(state.shown)}
        data-scene-motion={zooming ? `${profile.mode}-${state.phase}` : undefined}
        style={sceneStyle}
        aria-busy={transitioning}
      >
        <div key={getSceneKey(state.shown)} className="absolute inset-0">
          {presentedScene}
        </div>
      </div>
      {transitioning ? (
        <>
          <p className="sr-only" role="status">{profile.label}</p>
          <SceneTransitionOverlay
            key={state.revision}
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
