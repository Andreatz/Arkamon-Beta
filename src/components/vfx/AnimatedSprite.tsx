import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

export interface AnimatedSpriteProps {
  src: string
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  startFrame?: number
  fps: number
  width: number
  height: number
  responsive?: boolean
  durationMs?: number
  loop?: boolean
  /** Hold the current frame without scheduling playback. */
  paused?: boolean
  /** Replay a one-shot without replacing its loaded DOM element. */
  replayKey?: number
  /** Begin the clock only after the sheet is ready to display. */
  waitForLoad?: boolean
  className?: string
  style?: CSSProperties
  onComplete?: () => void
  onError?: () => void
}

export function getSpriteFramePosition(
  frame: number,
  columns: number,
  frameWidth: number,
  frameHeight: number
) {
  const safeFrame = Math.max(0, frame)
  const safeColumns = Math.max(1, columns)
  const col = safeFrame % safeColumns
  const row = Math.floor(safeFrame / safeColumns)

  return {
    col,
    row,
    backgroundPosition: `-${col * frameWidth}px -${row * frameHeight}px`,
  }
}

export function AnimatedSprite({
  src,
  frameWidth,
  frameHeight,
  columns,
  rows,
  frameCount,
  startFrame = 0,
  fps,
  width,
  height,
  responsive = false,
  durationMs,
  loop = false,
  paused = false,
  replayKey = 0,
  waitForLoad = false,
  className,
  style,
  onComplete,
  onError,
}: AnimatedSpriteProps) {
  const playbackId = useId()
  const [frame, setFrame] = useState(0)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [frameIdentity, setFrameIdentity] = useState(() => ({ src, replayKey }))
  const completeRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)
  const ready = !waitForLoad || loadedSrc === src

  // A new source or replay starts at its own first frame before it can paint.
  if (frameIdentity.src !== src || frameIdentity.replayKey !== replayKey) {
    setFrameIdentity({ src, replayKey })
    setFrame(0)
    setFinished(false)
  }

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    const image = new Image()
    let active = true
    const loaded = () => { if (active) setLoadedSrc(src) }
    image.onload = loaded
    image.onerror = () => { if (active) onErrorRef.current?.() }
    image.src = src
    if (image.complete && image.naturalWidth > 0) loaded()
    return () => {
      active = false
      image.onload = null
      image.onerror = null
    }
  }, [src])

  useEffect(() => {
    if (paused || !ready) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const totalFrames = Math.max(1, columns * rows)
    const safeStartFrame = Math.max(0, Math.min(startFrame, totalFrames - 1))
    const safeFrameCount = Math.max(
      1,
      Math.min(frameCount, totalFrames - safeStartFrame)
    )
    const frameDuration = 1000 / Math.max(1, fps)
    const playbackDuration = durationMs ?? safeFrameCount * frameDuration
    let animationFrame = 0
    let mounted = true
    let startTime: number | null = null

    completeRef.current = false
    setFinished(false)
    setFrame(0)

    const complete = () => {
      if (completeRef.current) return
      completeRef.current = true
      setFinished(true)
      onCompleteRef.current?.()
    }

    if (reducedMotion) {
      setFrame(loop ? 0 : safeFrameCount - 1)
      complete()
      return
    }

    const update = (timestamp: number) => {
      if (!mounted) return
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const rawFrame = Math.floor(elapsed / frameDuration)

      if (loop) {
        setFrame(rawFrame % safeFrameCount)
        animationFrame = requestAnimationFrame(update)
        return
      }

      if (elapsed >= playbackDuration || rawFrame >= safeFrameCount) {
        setFrame(safeFrameCount - 1)
        complete()
        return
      }

      setFrame(rawFrame)
      animationFrame = requestAnimationFrame(update)
    }

    animationFrame = requestAnimationFrame(update)

    return () => {
      mounted = false
      cancelAnimationFrame(animationFrame)
    }
  }, [columns, durationMs, fps, frameCount, loop, paused, ready, replayKey, rows, src, startFrame])

  const totalFrames = Math.max(1, columns * rows)
  const safeStartFrame = Math.max(0, Math.min(startFrame, totalFrames - 1))
  const absoluteFrame = safeStartFrame + frame
  const { col, row } = getSpriteFramePosition(
    absoluteFrame,
    columns,
    frameWidth,
    frameHeight
  )
  const scaleX = width / frameWidth
  const scaleY = height / frameHeight
  const backgroundPosition = responsive
    ? `${columns > 1 ? col * 100 / (columns - 1) : 0}% ${rows > 1 ? row * 100 / (rows - 1) : 0}%`
    : `-${col * frameWidth * scaleX}px -${row * frameHeight * scaleY}px`

  return (
    <div
      className={className}
      data-sprite-frame={absoluteFrame}
      data-sprite-instance={playbackId}
      data-sprite-paused={paused}
      data-sprite-ready={ready}
      data-sprite-fps={fps}
      data-sprite-frame-count={frameCount}
      data-sprite-playback={!ready ? 'loading' : paused ? 'paused' : finished ? 'complete' : 'playing'}
      style={{
        width: responsive ? '100%' : width,
        height: responsive ? '100%' : height,
        backgroundImage: `url(${src})`,
        backgroundPosition,
        backgroundRepeat: 'no-repeat',
        backgroundSize: responsive
          ? `${columns * 100}% ${rows * 100}%`
          : `${columns * frameWidth * scaleX}px ${rows * frameHeight * scaleY}px`,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
