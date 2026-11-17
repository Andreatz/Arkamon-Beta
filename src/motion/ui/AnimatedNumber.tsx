import { useEffect, useRef, useState } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { counterDurationMs, counterValueAt } from './counter'
import './liveInterface.css'

const formatItalian = (value: number) => value.toLocaleString('it-IT')

interface AnimatedNumberProps {
  value: number
  format?: (value: number) => string
  className?: string
}

/**
 * Numero che conta fino al nuovo valore (monete, livelli, HP) invece di cambiare di colpo.
 * Al primo montaggio mostra subito il valore; con il movimento ridotto non anima mai.
 * Mentre conta porta `data-counting="up|down"` per il lampo in CSS.
 */
export function AnimatedNumber({ value, format = formatItalian, className }: AnimatedNumberProps) {
  const { reducedMotion, speed } = useGameMotionPreferences()
  const [shown, setShown] = useState(value)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const displayed = useRef(value)

  useEffect(() => {
    const from = displayed.current
    if (from === value) return
    const duration = counterDurationMs(from, value) / speed
    if (reducedMotion || duration <= 0 || typeof requestAnimationFrame === 'undefined') {
      displayed.current = value
      setShown(value)
      return
    }
    setDirection(value > from ? 'up' : 'down')
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = (now - start) / duration
      const next = counterValueAt(from, value, t)
      displayed.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(step)
      else setDirection(null)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion, speed, value])

  return <span className={`arka-counter${className ? ` ${className}` : ''}`} data-counting={direction ?? undefined}>{format(shown)}</span>
}
