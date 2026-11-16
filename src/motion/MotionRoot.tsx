import { useEffect } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { motionScale } from './tokens'

/**
 * Allinea le variabili CSS `--motion-*` alle preferenze del giocatore:
 * `--motion-scale` vale 1 a velocità normale, 0.5 in modalità rapida e 0 con
 * il movimento ridotto, così anche le animazioni scritte in CSS seguono i token.
 */
export function MotionRoot() {
  const { reducedMotion, speed } = useGameMotionPreferences()
  useEffect(() => {
    document.documentElement.style.setProperty('--motion-scale', String(motionScale({ reducedMotion, speed })))
    return () => { document.documentElement.style.removeProperty('--motion-scale') }
  }, [reducedMotion, speed])
  return null
}
