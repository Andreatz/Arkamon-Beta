import { useEffect, useSyncExternalStore, type CSSProperties } from 'react'
import { playSfx } from '@/utils/soundManager'
import { createPortal } from 'react-dom'
import { getAnimationDuration, useGameMotionPreferences, useGamePreferences } from '@/settings/gamePreferences'
import './grassOpening.css'

/**
 * Erba che fruscia e si apre prima di un incontro selvatico. Solo presentazione:
 * chi la avvia attende la promessa, poi conferma l'incontro con le regole di sempre.
 */
let active: { id: number; done: () => void } | null = null
let counter = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(listener => listener())
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

function systemReducedMotion(): boolean {
  const preference = useGamePreferences.getState().reducedMotion
  if (preference !== 'system') return preference === 'on'
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export const GRASS_OPENING_MS = 900

export function playGrassOpening(): Promise<void> {
  if (typeof document === 'undefined' || systemReducedMotion()) return Promise.resolve()
  if (active) return Promise.resolve()
  return new Promise(resolve => {
    const id = ++counter
    // Fruscio e punto esclamativo: qualcosa si muove nell'erba alta.
    playSfx('map.encounter')
    active = { id, done: () => { if (active?.id === id) { active = null; emit() } resolve() } }
    emit()
  })
}

/** Lame d'erba con larghezza, altezza e ritardo diversi, calcolate una volta sola. */
const BLADES = Array.from({ length: 34 }, (_, index) => {
  const seed = Math.sin(index * 12.9898) * 43758.5453
  const random = seed - Math.floor(seed)
  return { x: index / 33 * 100, height: 38 + random * 34, width: 5 + random * 5, delay: random * 120, hue: 92 + random * 34, side: index < 17 ? -1 : 1 }
})

export function GrassOpeningOverlay() {
  const current = useSyncExternalStore(subscribe, () => active, () => null)
  const { speed } = useGameMotionPreferences()
  useEffect(() => {
    if (!current) return
    const timer = window.setTimeout(current.done, getAnimationDuration(GRASS_OPENING_MS))
    return () => window.clearTimeout(timer)
  }, [current])
  if (!current) return null
  return createPortal(<div className="grass-opening" aria-hidden="true" style={{ '--grass-speed': speed } as CSSProperties} data-grass-opening="">
    <div className="grass-opening-glow" />
    {BLADES.map((blade, index) => <span key={index} className="grass-blade" style={{
      left: `${blade.x}%`, height: `${blade.height}vh`, width: `${blade.width}vw`,
      '--grass-delay': `${blade.delay}ms`, '--grass-side': blade.side, '--grass-hue': blade.hue,
    } as CSSProperties} />)}
  </div>, document.body)
}
