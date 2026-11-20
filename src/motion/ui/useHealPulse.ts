import { useEffect, useRef, useState } from 'react'
import './healPulse.css'
import { getAnimationDuration } from '@/settings/gamePreferences'

/** Audit fase 6: durata del bagliore di cura (a velocità normale). */
export const HEAL_PULSE_MS = 900

/** Vero per un istante quando `value` (HP) cresce dopo il primo montaggio: alimenta il bagliore di cura. */
export function useHealPulse(value: number): boolean {
  const previous = useRef(value)
  const [healing, setHealing] = useState(false)
  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (!(value > before)) return
    setHealing(true)
    const timer = window.setTimeout(() => setHealing(false), getAnimationDuration(HEAL_PULSE_MS))
    return () => window.clearTimeout(timer)
  }, [value])
  return healing
}
