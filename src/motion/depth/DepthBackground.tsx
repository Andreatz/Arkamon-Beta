import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { createDepthRenderer } from './depthRenderer'
import { depthMapFor } from './depthMaps'
import './depthBackground.css'

const MAX_PIXEL_RATIO = 1.5

function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  return image.decode().then(() => image)
}

/**
 * Sfondo 2.5D (audit, sezione 8.2): se lo sfondo ha una mappa di profondità e il browser
 * offre WebGL, un canvas sposta ogni pixel secondo la sua vicinanza, con il puntatore e
 * con una lenta deriva della camera. Altrimenti, e sempre con il movimento ridotto, resta
 * l'immagine CSS: il canvas compare solo quando è pronto a sostituirla.
 */
export function DepthBackground({ src, className = '', style, strength = 0.028, children }: {
  src: string
  className?: string
  style?: CSSProperties
  /** Spostamento massimo in frazioni dell'immagine. */
  strength?: number
  children?: ReactNode
}) {
  const { reducedMotion } = useGameMotionPreferences()
  const depth = depthMapFor(src)
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(false)
    const element = host.current, surface = canvas.current
    if (!depth || reducedMotion || !element || !surface) return
    let disposed = false
    let frame = 0
    let cleanup = () => {}
    void Promise.all([loadImage(src), loadImage(depth)]).then(([image, map]) => {
      if (disposed) return
      const renderer = createDepthRenderer(surface, image, map)
      if (!renderer) return
      const target = { x: 0, y: 0 }, current = { x: 0, y: 0 }
      const resize = () => {
        const ratio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1)
        const box = element.getBoundingClientRect()
        renderer.resize(Math.max(1, Math.round(box.width * ratio)), Math.max(1, Math.round(box.height * ratio)))
      }
      const pointer = (event: PointerEvent) => {
        const box = element.getBoundingClientRect()
        if (!box.width || !box.height) return
        target.x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2))
        target.y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - 0.5) * 2))
      }
      const start = performance.now()
      const loop = (now: number) => {
        frame = requestAnimationFrame(loop)
        if (document.hidden) return
        current.x += (target.x - current.x) * 0.05
        current.y += (target.y - current.y) * 0.05
        // Deriva lenta: la camera "respira" anche a puntatore fermo.
        const t = (now - start) / 1000
        const driftX = Math.sin(t * 0.21) * 0.35, driftY = Math.cos(t * 0.17) * 0.22
        renderer.draw(-(current.x * 0.7 + driftX) * strength, -(current.y * 0.5 + driftY) * strength)
      }
      const observer = new ResizeObserver(resize)
      observer.observe(element)
      resize()
      window.addEventListener('pointermove', pointer, { passive: true })
      frame = requestAnimationFrame(loop)
      setActive(true)
      cleanup = () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
        window.removeEventListener('pointermove', pointer)
        renderer.dispose()
      }
    }).catch(() => {})
    return () => { disposed = true; cleanup() }
  }, [depth, reducedMotion, src, strength])

  return <div ref={host} className={`arka-depth-background ${className}`} data-depth-active={active ? 'true' : undefined}
    style={{ ...style, backgroundImage: `url("${src}")` }}>
    {depth && !reducedMotion && <canvas ref={canvas} className="arka-depth-canvas" aria-hidden="true" />}
    {children}
  </div>
}
