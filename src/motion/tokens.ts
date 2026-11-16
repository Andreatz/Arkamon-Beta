/**
 * Token di movimento di Arkamon.
 *
 * Unica fonte per durate, curve e molle della presentazione. I componenti non
 * dovrebbero più scrivere millisecondi letterali: scelgono un token e lo
 * risolvono con le preferenze del giocatore (velocità e movimento ridotto).
 * Nessun valore qui dentro influenza dadi, turni o regole.
 */

export interface MotionSettings {
  /** 1 = normale, 2 = rapida. Divide le durate. */
  speed: number
  /** Con movimento ridotto le durate decorative diventano zero. */
  reducedMotion: boolean
}

export const DEFAULT_MOTION_SETTINGS: MotionSettings = { speed: 1, reducedMotion: false }

/** Durate in millisecondi a velocità normale. */
export const DURATION = {
  /** Risposta a un input: pressione, focus, selezione. */
  instant: 90,
  /** Passaggi brevi dentro la stessa vista. */
  fast: 160,
  /** Entrata o uscita di un pannello. */
  base: 240,
  /** Movimenti di camera e cambi di inquadratura. */
  slow: 400,
  /** Cambi di scena e momenti speciali. */
  scene: 700,
} as const
export type DurationToken = keyof typeof DURATION

export type CubicBezier = readonly [number, number, number, number]

/** Curve condivise fra CSS, framer-motion e sequenziatore. */
export const EASE = {
  linear: [0, 0, 1, 1],
  /** Parte veloce e si posa: entrate, arrivi di camera. */
  out: [0.16, 1, 0.3, 1],
  /** Accelera in uscita: elementi che lasciano lo schermo. */
  in: [0.7, 0, 0.84, 0],
  /** Simmetrica: spostamenti fra due stati equivalenti. */
  inOut: [0.65, 0, 0.35, 1],
  /** Supera leggermente il bersaglio: conferme e comparse "vive". */
  back: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, CubicBezier>
export type EaseToken = keyof typeof EASE

/** Molle per framer-motion. */
export const SPRING = {
  /** Cursori e selezioni. */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 },
  /** Pannelli e carte. */
  soft: { type: 'spring', stiffness: 180, damping: 22, mass: 1 },
  /** Ingressi di attori pesanti. */
  heavy: { type: 'spring', stiffness: 110, damping: 16, mass: 1.2 },
} as const
export type SpringToken = keyof typeof SPRING

function normalizedSpeed(settings: MotionSettings): number {
  return Number.isFinite(settings.speed) && settings.speed > 0 ? settings.speed : 1
}

/** Durata decorativa: scala con la velocità e si annulla con il movimento ridotto. */
export function resolveDuration(duration: DurationToken | number, settings: MotionSettings = DEFAULT_MOTION_SETTINGS): number {
  if (settings.reducedMotion) return 0
  const milliseconds = typeof duration === 'number' ? duration : DURATION[duration]
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0
  return milliseconds / normalizedSpeed(settings)
}

/** Tempo di lettura: scala con la velocità ma resta anche con il movimento ridotto. */
export function resolveHold(milliseconds: number, settings: MotionSettings = DEFAULT_MOTION_SETTINGS): number {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0
  return milliseconds / normalizedSpeed(settings)
}

/** Fattore per le variabili CSS `--motion-*`: 0 con movimento ridotto, 0.5 in modalità rapida. */
export function motionScale(settings: MotionSettings): number {
  return settings.reducedMotion ? 0 : 1 / normalizedSpeed(settings)
}

/** Oggetto `transition` per framer-motion a partire dai token. */
export function motionTransition(duration: DurationToken | number, ease: EaseToken = 'out', settings: MotionSettings = DEFAULT_MOTION_SETTINGS) {
  return { duration: resolveDuration(duration, settings) / 1000, ease: [...EASE[ease]] as [number, number, number, number] }
}

/** Molla per framer-motion; con movimento ridotto diventa un cambio immediato. */
export function motionSpring(spring: SpringToken, settings: MotionSettings = DEFAULT_MOTION_SETTINGS) {
  if (settings.reducedMotion) return { duration: 0 }
  const base = SPRING[spring]
  return { ...base, stiffness: base.stiffness * normalizedSpeed(settings) }
}

/**
 * Valuta una curva cubic-bezier come funzione del tempo (0..1 → 0..1).
 * Serve al sequenziatore e alla cinepresa, che non passano da CSS.
 */
export function cubicBezier([x1, y1, x2, y2]: CubicBezier): (progress: number) => number {
  if (x1 === y1 && x2 === y2) return (progress) => Math.min(1, Math.max(0, progress))
  const sampleX = (t: number) => ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t
  const sampleY = (t: number) => ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t
  const slopeX = (t: number) => 3 * (1 - 3 * x2 + 3 * x1) * t * t + 2 * (3 * x2 - 6 * x1) * t + 3 * x1
  return (progress) => {
    const x = Math.min(1, Math.max(0, progress))
    if (x === 0 || x === 1) return x
    let t = x
    // Newton: converge in pochi passi sulle curve usate dal gioco.
    for (let i = 0; i < 8; i++) {
      const slope = slopeX(t)
      if (Math.abs(slope) < 1e-6) break
      const delta = sampleX(t) - x
      if (Math.abs(delta) < 1e-6) return sampleY(t)
      t -= delta / slope
    }
    // Bisezione di riserva per le curve con pendenza quasi nulla.
    let low = 0
    let high = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const value = sampleX(t)
      if (Math.abs(value - x) < 1e-6) break
      if (value < x) low = t
      else high = t
      t = (low + high) / 2
    }
    return sampleY(t)
  }
}

export function easing(token: EaseToken): (progress: number) => number {
  return cubicBezier(EASE[token])
}
