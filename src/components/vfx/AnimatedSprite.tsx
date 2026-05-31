import { useEffect, useRef, useState, type CSSProperties } from 'react'

export interface AnimatedSpriteProps {
  src: string
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
  width: number
  height: number
  durationMs?: number
  loop?: boolean
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
  fps,
  width,
  height,
  durationMs,
  loop = false,
  className,
  style,
  onComplete,
  onError,
}: AnimatedSpriteProps) {
  const [frame, setFrame] = useState(0)
  const completeRef = useRef(false)

  useEffect(() => {
    const image = new Image()
    image.src = src
    image.onerror = () => onError?.()
    return () => {
      image.onerror = null
    }
  }, [onError, src])

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const safeFrameCount = Math.max(1, Math.min(frameCount, columns * rows))
    const frameDuration = 1000 / Math.max(1, fps)
    const playbackDuration = durationMs ?? safeFrameCount * frameDuration
    let animationFrame = 0
    let mounted = true
    let startTime: number | null = null

    completeRef.current = false
    setFrame(0)

    const complete = () => {
      if (completeRef.current) return
      completeRef.current = true
      onComplete?.()
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
  }, [columns, durationMs, fps, frameCount, loop, onComplete, rows])

  const { col, row } = getSpriteFramePosition(
    frame,
    columns,
    frameWidth,
    frameHeight
  )
  const scaleX = width / frameWidth
  const scaleY = height / frameHeight
  const backgroundPosition = `-${col * frameWidth * scaleX}px -${row * frameHeight * scaleY}px`

  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundImage: `url(${src})`,
        backgroundPosition,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${columns * frameWidth * scaleX}px ${rows * frameHeight * scaleY}px`,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
