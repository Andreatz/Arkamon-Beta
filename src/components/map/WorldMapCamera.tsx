import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import './worldMapCamera.css'

/** Inquadratura richiesta: `seq` cambia a ogni nuova ripresa, `kind` ne sceglie il ritmo. */
export interface WorldCameraFocus {
  seq: number
  /** Punto in percentuale della mappa. */
  x: number
  y: number
  kind: 'move' | 'turn'
}

/**
 * Mondo della mappa principale (audit, sezione 8.5): sfondo, nuvole su due livelli in
 * parallasse con il puntatore, riflesso sul mare e una camera che si stringe sul luogo
 * d'arrivo o sulla pedina di turno e poi torna larga.
 * La camera si muove solo durante una ripresa: a riposo nodi e strade sono fermi, così
 * i clic (e i test) non inseguono mai un bersaglio in movimento.
 */
export function WorldMapCamera({ focus, disabled = false, backgroundImage, children }: {
  focus: WorldCameraFocus | null
  disabled?: boolean
  backgroundImage: string
  children: ReactNode
}) {
  const { reducedMotion } = useGameMotionPreferences()
  const root = useRef<HTMLDivElement>(null)

  // Parallasse delle nuvole: lo spostamento del puntatore, normalizzato a -1…1.
  useEffect(() => {
    const element = root.current
    if (!element || reducedMotion) return
    let frame = 0
    let last: PointerEvent | null = null
    const apply = () => {
      frame = 0
      if (!last) return
      const box = element.getBoundingClientRect()
      if (!box.width || !box.height) return
      const x = ((last.clientX - box.left) / box.width - 0.5) * 2
      const y = ((last.clientY - box.top) / box.height - 0.5) * 2
      element.style.setProperty('--world-px', Math.max(-1, Math.min(1, x)).toFixed(3))
      element.style.setProperty('--world-py', Math.max(-1, Math.min(1, y)).toFixed(3))
    }
    const move = (event: PointerEvent) => { last = event; if (!frame) frame = requestAnimationFrame(apply) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move) }
  }, [reducedMotion])

  const shot = focus && !disabled && !reducedMotion ? `${focus.kind}-${focus.seq % 2 ? 'a' : 'b'}` : undefined
  const style = {
    backgroundImage: `url(${backgroundImage})`,
    '--cam-x': `${focus?.x ?? 50}%`,
    '--cam-y': `${focus?.y ?? 50}%`,
  } as CSSProperties

  return <div ref={root} className="world-map-camera absolute inset-0 bg-cover bg-center" data-world-camera data-camera-shot={shot} style={style}>
    <div className="world-map-atmosphere" aria-hidden="true">
      <div className="world-map-clouds world-map-clouds--far" />
      <div className="world-map-sea-glint" />
      <div className="world-map-clouds world-map-clouds--near" />
    </div>
    {children}
  </div>
}
