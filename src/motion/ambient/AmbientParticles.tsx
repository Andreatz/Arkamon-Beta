import { useMemo, type CSSProperties } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { createParticles, type AmbientVariant } from './ambientParticles'
import './ambientParticles.css'

/**
 * Particelle d'ambiente (audit, sezione 8.2): solo CSS, solo `transform` e `opacity`,
 * mai interattive. Con il movimento ridotto non vengono montate.
 */
export function AmbientParticles({ variant, count = 24, seed = 7, className = '' }: {
  variant: AmbientVariant
  count?: number
  seed?: number
  className?: string
}) {
  const { reducedMotion } = useGameMotionPreferences()
  const particles = useMemo(() => createParticles(variant, count, seed), [variant, count, seed])
  if (reducedMotion) return null
  return <div className={`arka-ambient ${className}`} data-ambient={variant} aria-hidden="true">
    {particles.map((particle, index) => <span key={index} className="arka-ambient__particle" style={{
      left: `${particle.x}%`, top: `${particle.y}%`, width: particle.size, height: particle.size,
      '--dx': `${particle.dx}px`, '--dy': `${particle.dy}px`, '--peak': particle.opacity,
      animationDuration: `calc(var(--motion-scale, 1) * ${particle.durationMs}ms)`,
      animationDelay: `${particle.delayMs}ms`,
    } as CSSProperties} />)}
  </div>
}
