/** Particelle d'ambiente: generazione deterministica (stesso seme, stesse particelle). */

export type AmbientVariant = 'motes' | 'fireflies' | 'sparkles' | 'embers'

export interface AmbientParticle {
  /** Posizione di partenza in percentuale. */
  x: number
  y: number
  /** Deriva totale in pixel durante un ciclo. */
  dx: number
  dy: number
  size: number
  durationMs: number
  delayMs: number
  opacity: number
}

/** Generatore pseudo-casuale piccolo e stabile (mulberry32). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PROFILES: Record<AmbientVariant, { size: [number, number]; duration: [number, number]; rise: [number, number]; sway: number; opacity: [number, number] }> = {
  // Pulviscolo nella luce: lento, piccolo, quasi fermo.
  motes: { size: [2, 4], duration: [9000, 16000], rise: [-40, -90], sway: 40, opacity: [0.25, 0.6] },
  // Lucciole: vagano e pulsano.
  fireflies: { size: [3, 6], duration: [6000, 11000], rise: [-30, -120], sway: 90, opacity: [0.5, 0.95] },
  // Scintille tecnologiche: salgono dritte, brevi.
  sparkles: { size: [2, 3], duration: [4000, 8000], rise: [-120, -220], sway: 18, opacity: [0.45, 0.85] },
  // Braci: salgono veloci e ondeggiano.
  embers: { size: [2, 5], duration: [3500, 7000], rise: [-180, -320], sway: 60, opacity: [0.5, 0.9] },
}

export function createParticles(variant: AmbientVariant, count: number, seed = 1): AmbientParticle[] {
  const random = seededRandom(seed)
  const profile = PROFILES[variant]
  const between = ([min, max]: [number, number]) => min + (max - min) * random()
  return Array.from({ length: count }, () => {
    const durationMs = Math.round(between(profile.duration))
    return {
      x: Math.round(random() * 1000) / 10,
      y: Math.round((20 + random() * 80) * 10) / 10,
      dx: Math.round((random() - 0.5) * 2 * profile.sway),
      dy: Math.round(between(profile.rise)),
      size: Math.round(between(profile.size) * 10) / 10,
      durationMs,
      // Ritardi negativi: le particelle sono già in volo al primo fotogramma.
      delayMs: -Math.round(random() * durationMs),
      opacity: Math.round(between(profile.opacity) * 100) / 100,
    }
  })
}
