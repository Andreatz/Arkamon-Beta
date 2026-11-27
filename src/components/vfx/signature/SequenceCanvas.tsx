import { useEffect, useRef } from 'react'
import type { BattleVfxPosition } from '../battleVfxPosition'
import { drawSequence } from './draw'
import type { MoveSequence } from './sequence'

interface Props {
  sequence: MoveSequence
  atlas: HTMLImageElement
  from: BattleVfxPosition
  to: BattleVfxPosition
  speed: number
  eventId: number
  moveId: number
  self: boolean
}

export function SequenceCanvas({ sequence, atlas, from, to, speed, eventId, moveId, self }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { x: x0, y: y0 } = from, { x: x1, y: y1 } = to
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let start: number | undefined, frame: number
    function paint(now: number) {
      if (!canvas || !ctx) return
      start ??= now
      const w = canvas.clientWidth, h = canvas.clientHeight
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.round(w * ratio), height = Math.round(h * ratio)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const elapsed = (now - start) * speed
      const radius = Math.min(w * .2, h * .24, 170)
      if (radius > 0) drawSequence(ctx, atlas, sequence, elapsed,
        { x: w*x0/100, y: h*y0/100 }, { x: w*x1/100, y: h*y1/100 }, radius)
      if (elapsed < sequence.duration) frame = requestAnimationFrame(paint)
    }
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [sequence, atlas, x0, y0, x1, y1, speed, eventId])
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full z-[45]"
    data-move-vfx-event={eventId} data-move-vfx-id={moveId} data-move-vfx-asset={'signature:' + sequence.key}
    data-vfx-anchor={self ? 'self' : 'target'} aria-hidden="true" />
}
