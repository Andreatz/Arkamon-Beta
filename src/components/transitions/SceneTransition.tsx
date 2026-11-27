import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import type { NavigazioneScena } from '@/types'
import { SceneInputContext, SceneNavigationContext } from './SceneNavigationContext'
import { SceneTransitionOverlay } from './SceneTransitionOverlay'
import { TransitionClip, preloadTransitionClip } from './TransitionClip'
import { createSceneTransitionState, getSceneKey, sceneTransitionReducer } from './sceneTransitionState'
import { getSceneTransitionProfile, type SceneTransitionProfile } from './sceneTransitionProfiles'
import { PREPARE_LIMIT_MS, supportsViewTransitions } from './sceneTransitionRuntime'
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
const PRIMED_MODES = new Set<SceneTransitionProfile['mode']>(['fade', 'white'])

const waitFrame = () => new Promise<void>(resolve => window.setTimeout(resolve, 16))

/** Margine massimo oltre la durata prevista della rivelazione. */
const REVEAL_SLACK_MS = 1600

type CinematicStage = 'cover' | 'overlay' | 'reveal'

type StartViewTransition = (update: () => Promise<void>) => { finished: Promise<void>; skipTransition?: () => void }

function clearViewTransitionStage(): void {
  const root = document.documentElement
  delete root.dataset.arkaTx
  root.style.removeProperty('--arka-tx-rev')
}

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

  // Regia: clip (luce, titolo, fumo) oppure dissolvenza fra le due scene (View Transition).
  // Una copertura che parte già chiusa resta classica.
  const baseCinematic = resolvedProfile.cinematic
  const cinematic = transitioning && baseCinematic && coverStartsCovered.current.get(state.revision) === false
    && (baseCinematic.clip !== null || supportsViewTransitions())
    ? { ...baseCinematic, revealMs: baseCinematic.revealMs / speed } : null
  const [cinematicStep, setCinematicStep] = useState<{ revision: number; stage: CinematicStage } | null>(null)
  const cinematicStage: CinematicStage = cinematicStep?.revision === state.revision ? cinematicStep.stage : 'cover'
  const activeViewTransition = useRef<{ revision: number; skip: () => void } | null>(null)

  useLayoutEffect(() => {
    previousTransition.current = { revision: state.revision, phase: state.phase }
  }, [state.revision, state.phase])

  // Le clip si scaricano quando il gioco è fermo: viaggio e battaglia possono partire da qualsiasi luogo.
  useLayoutEffect(() => {
    if (reducedMotion) return
    const timer = window.setTimeout(() => { preloadTransitionClip('fumo'); preloadTransitionClip('luce'); preloadTransitionClip('titolo') }, 2500)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  // Suono del passaggio. Quello di una clip parte con la clip (`onStart`); la battaglia
  // classica ha già il suo ingresso (Carta VS, con il suo suono).
  const clipDriven = !!cinematic?.clip
  useLayoutEffect(() => {
    if (state.phase !== 'cover' || clipDriven) return
    if (state.target.scena !== 'battaglia') return playSfx('transition.whoosh')
  }, [state.phase, state.revision, state.target.scena, clipDriven])
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

  const cinematicRef = useRef({ cinematic, target: state.target })
  cinematicRef.current = { cinematic, target: state.target }
  const cinematicKey = cinematic ? `${state.revision}:${cinematic.kind}` : ''

  /** La scena di arrivo (modulo e sfondo) è pronta, o il limite d'attesa è passato. */
  const prepared = useCallback((target: NavigazioneScena): Promise<unknown> => {
    const entry = ensurePrepared(target)
    return entry.done ? Promise.resolve() : Promise.race([entry.promise, new Promise(resolve => window.setTimeout(resolve, PREPARE_LIMIT_MS))])
  }, [ensurePrepared])

  // Dissolvenza: si attende la scena di arrivo, poi la View Transition fotografa quella che esce.
  useLayoutEffect(() => {
    if (!cinematicKey || !stylesReady || state.phase !== 'cover' || cinematicStage !== 'cover') return
    if (cinematicRef.current.cinematic?.handoff !== 'snapshot') return
    const revision = state.revision
    let cancelled = false
    void prepared(cinematicRef.current.target).then(() => { if (!cancelled) runViewTransition(revision) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematicKey, stylesReady, state.phase, cinematicStage])

  const runViewTransition = (revision: number) => {
    const current = cinematicRef.current.cinematic
    if (!current) return
    const root = document.documentElement
    root.style.setProperty('--arka-tx-rev', `${Math.round(current.revealMs)}ms`)
    root.dataset.arkaTx = current.kind
    let finished = false
    let guard = 0
    const finish = () => {
      if (finished) return
      finished = true
      window.clearTimeout(guard)
      clearViewTransitionStage()
      if (activeViewTransition.current?.revision === revision) activeViewTransition.current = null
      dispatch({ type: 'revealed', revision })
    }
    try {
      const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition!
      const transition = start.call(document, async () => {
        // Scambio delle scene sotto l'istantanea.
        flushSync(() => {
          dispatch({ type: 'covered', revision })
          setCinematicStep({ revision, stage: 'reveal' })
        })
        for (let attempt = 0; attempt < 3; attempt++) await waitFrame()
      })
      activeViewTransition.current = { revision, skip: () => transition.skipTransition?.() }
      // Su una macchina in affanno la rivelazione non deve tenere il gioco bloccato.
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

  // Clip: lo schermo è coperto. Con `overlay` la sequenza dedicata prende il posto;
  // con `clip` la scena cambia sotto la copertura e la clip riparte quando è pronta.
  const clipCovered = useCallback((revision: number): Promise<unknown> | void => {
    const current = cinematicRef.current.cinematic
    if (!current) return
    if (current.handoff === 'overlay') { setCinematicStep({ revision, stage: 'overlay' }); return }
    return prepared(cinematicRef.current.target).then(() => {
      flushSync(() => {
        dispatch({ type: 'covered', revision })
        setCinematicStep({ revision, stage: 'reveal' })
      })
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
  }, [prepared])
  const clipEnded = useCallback((revision: number) => {
    if (cinematicRef.current.cinematic?.handoff === 'clip') dispatch({ type: 'revealed', revision })
  }, [])

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

  // Preparazione: l'overlay resta invisibile finché la scena non è pronta ad animarsi.
  // Il primo fotogramma dopo il clic può costare centinaia di millisecondi (lavoro di React,
  // rasterizzazione della mappa): l'overlay parte due fotogrammi dopo.
  const [primedStep, setPrimedStep] = useState('')
  const needsPriming = PRIMED_MODES.has(profile.mode)
  const step = `${state.revision}:${state.phase}`
  // Una copertura che parte già chiusa non deve mostrare la scena per due fotogrammi.
  const skipPriming = !transitioning || !stylesReady || !needsPriming || (state.phase === 'cover' && coverStartsCovered.current.get(state.revision) === true)
  useLayoutEffect(() => {
    if (skipPriming || primedStep === step) return
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setPrimedStep(step)) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [primedStep, skipPriming, step])
  const primed = skipPriming || primedStep === step

  // Gli stati interni della transizione non devono ridisegnare l'intera scena:
  // l'elemento cambia solo con la scena mostrata.
  const presentedScene = useMemo(() => renderScene(state.shown), [renderScene, state.shown])

  const clip = cinematic?.clip ?? null
  // La clip resta sopra la scena per tutta la copertura; con `clip` anche durante la rivelazione.
  const showClip = !!clip && stylesReady && (state.phase === 'cover' || cinematic?.handoff === 'clip')
  const showOverlay = transitioning && stylesReady && (!cinematic || (cinematic.handoff === 'overlay' && (cinematicStage === 'overlay' || state.phase === 'reveal')))
  const revision = state.revision

  return (
    <SceneNavigationContext.Provider value={state.shown}>
      <SceneInputContext.Provider value={transitioning}>
      {children}
      <div
        ref={sceneRef}
        className="absolute inset-0"
        data-presented-scene={getSceneKey(state.shown)}
        aria-busy={transitioning}
      >
        <div key={getSceneKey(state.shown)} className="absolute inset-0">
          {presentedScene}
        </div>
      </div>
      {transitioning && stylesReady ? <p className="sr-only" role="status">{profile.label}</p> : null}
      {showClip && clip ? (
        <TransitionClip
          key={`clip-${revision}`}
          clip={clip}
          speed={speed}
          hold={cinematic?.handoff === 'overlay'}
          onStart={() => { if (cinematic) playSfx(cinematic.sound, { rate: speed }) }}
          onCovered={() => clipCovered(revision)}
          onEnded={() => clipEnded(revision)}
        />
      ) : null}
      {showOverlay ? (
        <SceneTransitionOverlay
          key={revision}
          cinematic={!!cinematic}
          startCovered={startCovered}
          phase={state.phase === 'cover' ? 'cover' : 'reveal'}
          profile={profile}
          primed={primed}
          onCovered={() => covered(revision, state.target)}
          onRevealed={() => dispatch({ type: 'revealed', revision })}
        />
      ) : null}
      </SceneInputContext.Provider>
    </SceneNavigationContext.Provider>
  )
}
