import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import type { SceneTransitionPhase } from './sceneTransitionState'
import { ArkamonDiceArtwork } from './ArkamonDiceArtwork'
import { BattleVsCard } from './BattleVsCard'
import {
  TRANSITION_VIDEO_PATH,
  TRANSITION_VIDEO_START_SECONDS,
  TRANSITION_VIDEO_SEGMENT_SECONDS,
  type SceneTransitionProfile,
} from './sceneTransitionProfiles'

interface SceneTransitionOverlayProps {
  phase: Exclude<SceneTransitionPhase, 'idle'>
  startCovered: boolean
  profile: SceneTransitionProfile
  /** Punto di fuga in percentuale dello schermo (iride e zoom); assente = centro. */
  anchor?: { x: number; y: number } | null
  /**
   * Falso finché la scena non è pronta ad animarsi (livello composito già rasterizzato).
   * In copertura l'overlay resta invisibile e fermo; in rivelazione resta chiuso.
   */
  primed?: boolean
  onCovered: () => void
  onRevealed: () => void
  /** Preceduto da un'anticipazione cinematografica: la Carta VS si apre in due sulla battaglia. */
  cinematic?: boolean
}

/** Pennellate d'inchiostro: altezza e ritardo di ciascuna striscia (in frazioni della fase). */
const BRUSH_STROKES = [
  { top: -10, height: 40, delay: 0 },
  { top: 13, height: 40, delay: 0.14 },
  { top: 36, height: 40, delay: 0.05 },
  { top: 59, height: 40, delay: 0.2 },
  { top: 82, height: 40, delay: 0.1 },
] as const

/** Bordo irregolare di una pennellata, disegnato in un riquadro 1000×100. */
const BRUSH_PATH = 'M30 30 C80 10 150 22 220 12 C300 3 370 18 450 9 C540 1 610 15 690 7 C770 1 850 13 920 6 C960 3 985 14 993 32 C1000 48 996 64 990 74 C982 90 950 96 900 95 C830 92 760 100 680 93 C600 87 530 99 450 92 C370 86 300 98 220 90 C150 84 90 95 40 82 C12 74 0 58 8 44 C14 36 20 33 30 30 Z'

function TransitionArtwork({ mode }: { mode: SceneTransitionProfile['mode'] }) {
  if (mode === 'iris' || mode === 'zoom-in' || mode === 'zoom-out') {
    return <div className="arka-tx-iris" data-transition-layer="iris" />
  }
  if (mode === 'diagonal') {
    return <div className="arka-tx-diagonal" data-transition-layer="diagonal"><span className="arka-tx-diagonal__edge" /></div>
  }
  if (mode === 'brush') {
    return <div className="arka-tx-brush" data-transition-layer="brush">
      {BRUSH_STROKES.map((stroke, index) => <svg key={index} className="arka-tx-brush__stroke" viewBox="0 0 1000 100" preserveAspectRatio="none"
        style={{ top: `${stroke.top}%`, height: `${stroke.height}%`, '--tx-stroke-delay': stroke.delay } as CSSProperties}>
        <path d={BRUSH_PATH} />
      </svg>)}
    </div>
  }
  return null
}

export function SceneTransitionOverlay({ phase, profile, startCovered, anchor, primed = true, onCovered, onRevealed, cinematic = false }: SceneTransitionOverlayProps) {
  const beganCovered = useRef(startCovered).current
  const videoRef = useRef<HTMLVideoElement>(null)
  const callbacks = useRef({ onCovered, onRevealed })
  const videoTerminal = useRef(false)
  const [videoReady, setVideoReady] = useState(false)
  const [finishRequested, setFinishRequested] = useState(false)
  const fading = phase === 'reveal' && finishRequested

  useEffect(() => { callbacks.current = { onCovered, onRevealed } }, [onCovered, onRevealed])
  // Raggio massimo dell'iride: distanza dal punto di fuga all'angolo più lontano dell'overlay.
  const root = useRef<HTMLDivElement>(null)
  const anchorX = anchor?.x ?? 50, anchorY = anchor?.y ?? 50
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const { width, height } = element.getBoundingClientRect()
    const dx = Math.max(anchorX, 100 - anchorX) / 100 * width
    const dy = Math.max(anchorY, 100 - anchorY) / 100 * height
    element.style.setProperty('--tx-r-max', `${Math.ceil(Math.hypot(dx, dy)) + 12}px`)
  }, [anchorX, anchorY])
  const finish = useCallback(() => {
    videoTerminal.current = true
    setFinishRequested(true)
  }, [])
  const videoFailed = useCallback(() => {
    if (videoTerminal.current) return
    videoTerminal.current = true
    videoRef.current?.pause()
    setVideoReady(false)
    setFinishRequested(true)
  }, [])

  // L'elemento condiviso è guidato dalla View Transitions API: qui resta solo il limite di sicurezza.
  const shared = profile.mode === 'shared'
  useEffect(() => {
    if (phase !== 'cover' || !primed) return
    const timer = window.setTimeout(() => callbacks.current.onCovered(), shared ? profile.failSafeMs : profile.coverMs)
    return () => window.clearTimeout(timer)
  }, [phase, primed, profile.coverMs, profile.failSafeMs, shared])

  useEffect(() => {
    if (!shared || phase !== 'reveal') return
    const timer = window.setTimeout(() => callbacks.current.onRevealed(), profile.failSafeMs)
    return () => window.clearTimeout(timer)
  }, [phase, profile.failSafeMs, shared])

  useEffect(() => {
    if (profile.mode !== 'battle-video') return
    const timer = window.setTimeout(videoFailed, profile.failSafeMs)
    return () => window.clearTimeout(timer)
  }, [videoFailed, profile.failSafeMs, profile.mode])

  useEffect(() => {
    if (profile.mode === 'battle-video' || shared || phase !== 'reveal' || !primed) return
    const timer = window.setTimeout(finish, profile.durationMs - profile.blendMs)
    return () => window.clearTimeout(timer)
  }, [finish, phase, primed, profile.mode, profile.durationMs, profile.blendMs])

  useEffect(() => {
    if (!fading) return
    const timer = window.setTimeout(() => callbacks.current.onRevealed(), profile.blendMs)
    return () => window.clearTimeout(timer)
  }, [fading, profile.blendMs])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = profile.playbackRate
  }, [profile.playbackRate])

  const play = () => {
    const video = videoRef.current
    if (!video || videoTerminal.current) return
    video.playbackRate = profile.playbackRate
    void video.play().catch(videoFailed)
  }

  const style = {
    '--scene-cover-ms': `${profile.coverMs}ms`,
    '--scene-blend-ms': `${profile.blendMs}ms`,
    '--scene-dice-ms': `${profile.durationMs + profile.coverMs}ms`,
    '--scene-artwork-filter': profile.filter,
    '--tx-x': `${anchor?.x ?? 50}%`,
    '--tx-y': `${anchor?.y ?? 50}%`,
  } as CSSProperties

  return (
    <div
      ref={root}
      className="arka-scene-transition"
      data-scene-transition={fading ? 'reveal' : phase === 'cover' ? (primed ? 'cover' : 'prime') : 'playing'}
      data-start-covered={beganCovered}
      data-video-ready={videoReady}
      data-transition-mode={profile.mode}
      data-cinematic={cinematic || undefined}
      style={style}
      aria-hidden="true"
    >
      <TransitionArtwork mode={profile.mode} />
      {profile.mode === 'arkamon-dice' ? <ArkamonDiceArtwork /> : null}
      {profile.mode === 'battle-vs' ? <BattleVsCard /> : null}
      {profile.mode === 'battle-video' ? (
        <video
          ref={videoRef}
          className="arka-scene-transition__video"
          data-ready={videoReady}
          src={assetUrl(TRANSITION_VIDEO_PATH)}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            if (videoTerminal.current) return
            const video = event.currentTarget
            if (Number.isFinite(video.duration) && video.duration > TRANSITION_VIDEO_START_SECONDS) {
              video.currentTime = TRANSITION_VIDEO_START_SECONDS
            } else {
              play()
            }
          }}
          onSeeked={play}
          onPlaying={() => {
            if (videoTerminal.current) videoRef.current?.pause()
            else setVideoReady(true)
          }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget
            if (!Number.isFinite(video.duration)) return
            const segmentEnd = Math.min(video.duration, TRANSITION_VIDEO_START_SECONDS + TRANSITION_VIDEO_SEGMENT_SECONDS)
            const remainingMs = (segmentEnd - video.currentTime) / profile.playbackRate * 1000
            if (remainingMs <= profile.blendMs) finish()
          }}
          onEnded={finish}
          onError={videoFailed}
        />
      ) : null}
    </div>
  )
}
