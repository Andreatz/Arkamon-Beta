import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import type { SceneTransitionPhase } from './sceneTransitionState'
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
  onCovered: () => void
  onRevealed: () => void
}

const STREAKS = Array.from({ length: 24 }, (_, index) => ({
  angle: `${index * 15}deg`,
  delay: `${-(index % 7) * 0.13}s`,
}))

export function SceneTransitionOverlay({ phase, profile, startCovered, onCovered, onRevealed }: SceneTransitionOverlayProps) {
  const beganCovered = useRef(startCovered).current
  const videoRef = useRef<HTMLVideoElement>(null)
  const callbacks = useRef({ onCovered, onRevealed })
  const [videoReady, setVideoReady] = useState(false)
  const [finishRequested, setFinishRequested] = useState(false)
  const fading = phase === 'reveal' && finishRequested

  useEffect(() => { callbacks.current = { onCovered, onRevealed } }, [onCovered, onRevealed])
  const finish = useCallback(() => setFinishRequested(true), [])

  useEffect(() => {
    if (phase !== 'cover') return
    const timer = window.setTimeout(() => callbacks.current.onCovered(), profile.coverMs)
    return () => window.clearTimeout(timer)
  }, [phase, profile.coverMs])

  useEffect(() => {
    // Playback can stall without raising an error; navigation must always finish.
    if (profile.mode !== 'battle-video') return
    const timer = window.setTimeout(finish, profile.failSafeMs)
    return () => window.clearTimeout(timer)
  }, [finish, profile.failSafeMs, profile.mode])

  useEffect(() => {
    if (profile.mode !== 'portal' || phase !== 'reveal') return
    const timer = window.setTimeout(finish, profile.durationMs - profile.blendMs)
    return () => window.clearTimeout(timer)
  }, [finish, phase, profile.mode, profile.durationMs, profile.blendMs])

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
    if (!video) return
    video.playbackRate = profile.playbackRate
    void video.play().catch(finish)
  }

  const style = {
    '--scene-cover-ms': `${profile.coverMs}ms`,
    '--scene-blend-ms': `${profile.blendMs}ms`,
    '--scene-video-filter': profile.filter,
    '--scene-portal-ms': `${profile.durationMs}ms`,
  } as CSSProperties

  return (
    <div
      className="arka-scene-transition"
      data-scene-transition={fading ? 'reveal' : phase === 'cover' ? 'cover' : 'playing'}
      data-start-covered={beganCovered}
      style={style}
      aria-hidden="true"
    >
      <div className="arka-scene-transition__energy">
        <div className="arka-scene-transition__nebula" />
        <div className="arka-scene-transition__streaks">
          {STREAKS.map((streak, index) => (
            <span
              key={index}
              style={{ '--streak-angle': streak.angle, '--streak-delay': streak.delay } as CSSProperties}
            />
          ))}
        </div>
        <div className="arka-scene-transition__core" />
        <svg className="arka-scene-transition__lightning" viewBox="0 0 1600 900" preserveAspectRatio="none">
          <g fill="none" strokeWidth="3">
            <path className="arka-scene-transition__bolt arka-scene-transition__bolt--blue" d="M-30 70 95 120 147 103 198 176 298 180 321 225 412 250 469 316 513 298 614 373 641 363 800 450" />
            <path className="arka-scene-transition__bolt arka-scene-transition__bolt--blue" d="M-30 890 105 820 122 760 216 743 260 674 345 664 421 586 495 590 569 520 651 497 800 450" />
            <path className="arka-scene-transition__bolt arka-scene-transition__bolt--gold" d="M1630 20 1475 109 1450 147 1351 141 1298 224 1210 218 1146 308 1050 331 972 389 911 378 800 450" />
            <path className="arka-scene-transition__bolt arka-scene-transition__bolt--gold" d="M1630 880 1490 803 1440 715 1340 716 1273 637 1190 626 1120 566 1018 542 965 488 889 479 800 450" />
          </g>
        </svg>
        <div className="arka-scene-transition__portal">
          <div className="arka-scene-transition__ring arka-scene-transition__ring--outer" />
          <div className="arka-scene-transition__ring arka-scene-transition__ring--inner" />
          <div className="arka-scene-transition__spark" />
        </div>
      </div>
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
          const video = event.currentTarget
          if (Number.isFinite(video.duration) && video.duration > TRANSITION_VIDEO_START_SECONDS) {
            video.currentTime = TRANSITION_VIDEO_START_SECONDS
          } else {
            play()
          }
        }}
        onSeeked={play}
        onPlaying={() => setVideoReady(true)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          if (!Number.isFinite(video.duration)) return
          const segmentEnd = Math.min(video.duration, TRANSITION_VIDEO_START_SECONDS + TRANSITION_VIDEO_SEGMENT_SECONDS)
          const remainingMs = (segmentEnd - video.currentTime) / profile.playbackRate * 1000
          if (remainingMs <= profile.blendMs) finish()
        }}
        onEnded={finish}
        onError={finish}
      />
      ) : null}
    </div>
  )
}
