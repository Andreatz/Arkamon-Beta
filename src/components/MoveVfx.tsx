import { motion } from 'framer-motion'
import type { MossaDef } from '@/types'

export type MoveVfxSide = 'A' | 'B'
export type MoveVfxTarget = 'opponent' | 'self'

export type MoveVfxArchetype =
  | 'fire'
  | 'water'
  | 'ice'
  | 'leaf'
  | 'lightning'
  | 'earth'
  | 'psychic'
  | 'shadow'
  | 'wind'
  | 'impact'
  | 'poison'
  | 'sleep'
  | 'confusion'
  | 'heal'
  | 'supreme'

export interface MoveVfxEvent {
  id: number
  move: MossaDef
  side: MoveVfxSide
  target?: MoveVfxTarget
}

export interface MoveVfxProfile {
  moveId: number
  archetype: MoveVfxArchetype
  primary: string
  secondary: string
  accent: string
  particleCount: number
  durationMs: number
  variant: number
  seed: number
  selfTarget: boolean
}

type Point = { x: number; y: number }
type Particle = {
  angle: number
  delay: number
  distance: number
  size: number
  wave: number
}

export const MOVE_VFX_VISIBLE_MS = 1450

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function includesAny(value: string, words: string[]): boolean {
  return words.some((word) => value.includes(word))
}

function hueForType(tipo: string): number {
  switch (normalizeText(tipo)) {
    case 'fuoco':
      return 18
    case 'acqua':
      return 198
    case 'erba':
      return 112
    case 'elettro':
      return 52
    case 'terra':
      return 30
    case 'psico':
      return 286
    case 'oscurita':
      return 264
    default:
      return 210
  }
}

function archetypeForMove(move: MossaDef): MoveVfxArchetype {
  const name = normalizeText(move.nome)

  if (move.effetto === 'CURA' || move.effetto === 'CURA_PCT') return 'heal'
  if (move.effetto === 'SUPREMA') return 'supreme'
  if (move.effetto === 'VELENO') return 'poison'
  if (move.effetto === 'SONNO') return 'sleep'
  if (move.effetto === 'CONFUSIONE') return 'confusion'

  if (includesAny(name, ['ghiacc', 'glacial', 'nevisch', 'valanga', 'bora', 'fredda'])) {
    return 'ice'
  }
  if (includesAny(name, ['foglia', 'fior', 'liana', 'germogl', 'gemma', 'bosco', 'silvan'])) {
    return 'leaf'
  }
  if (includesAny(name, ['soffio', 'respiro', 'breath', 'vento', 'maestrale', 'volo'])) {
    return 'wind'
  }

  switch (normalizeText(move.tipo)) {
    case 'fuoco':
      return 'fire'
    case 'acqua':
      return 'water'
    case 'erba':
      return 'leaf'
    case 'elettro':
      return 'lightning'
    case 'terra':
      return 'earth'
    case 'psico':
      return 'psychic'
    case 'oscurita':
      return 'shadow'
    default:
      return 'impact'
  }
}

export function resolveMoveVfx(move: MossaDef): MoveVfxProfile {
  const archetype = archetypeForMove(move)
  const baseHue = hueForType(move.tipo)
  const hue = (baseHue + (move.id % 13) - 6 + 360) % 360
  const selfTarget = archetype === 'heal'

  return {
    moveId: move.id,
    archetype,
    primary: `hsl(${hue} 94% 58%)`,
    secondary: `hsl(${(hue + 26) % 360} 98% 72%)`,
    accent: `hsl(${(hue + 178) % 360} 96% 84%)`,
    particleCount: 9 + (move.id % 8),
    durationMs: 760 + (move.id % 5) * 65,
    variant: move.id % 4,
    seed: move.id * 97 + archetype.length * 31,
    selfTarget,
  }
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function createParticles(seed: number, count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: pseudoRandom(seed + index * 11) * Math.PI * 2,
    delay: pseudoRandom(seed + index * 17) * 0.24,
    distance: 34 + pseudoRandom(seed + index * 23) * 84,
    size: 3 + pseudoRandom(seed + index * 29) * 8,
    wave: (pseudoRandom(seed + index * 37) - 0.5) * 84,
  }))
}

function ProjectileGlyph({
  profile,
  glowId,
}: {
  profile: MoveVfxProfile
  glowId: string
}) {
  const common = {
    stroke: profile.accent,
    strokeWidth: 5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (profile.archetype) {
    case 'fire':
      return (
        <motion.g animate={{ rotate: [0, 18, -8, 0], scale: [0.88, 1.12, 0.94] }}>
          <circle r="35" fill={`url(#${glowId})`} />
          <path d="M-4 32 C-42 3 -10 -19 4 -45 C33 -12 42 11 18 36 Z" fill={profile.primary} />
          <path d="M0 27 C-13 8 4 -2 8 -20 C22 0 20 16 8 29 Z" fill={profile.accent} />
        </motion.g>
      )
    case 'water':
      return (
        <motion.g animate={{ rotate: [0, -10, 10, 0] }}>
          <path d="M-54 9 C-25 -36 11 -34 55 -3 C25 -7 12 16 -2 25 C-19 35 -37 28 -54 9 Z" fill={profile.primary} />
          <path d="M-33 5 C-12 -12 8 -14 34 -4 C13 0 10 13 -6 17 C-16 20 -25 15 -33 5 Z" fill={profile.accent} />
          <circle cx="29" cy="-24" r="8" fill={profile.secondary} />
          <circle cx="-20" cy="-25" r="5" fill={profile.accent} />
        </motion.g>
      )
    case 'ice':
      return (
        <motion.g animate={{ rotate: [0, 120, 240] }}>
          <path d="M0 -53 L13 -14 L48 -29 L20 0 L48 29 L13 14 L0 53 L-13 14 L-48 29 L-20 0 L-48 -29 L-13 -14 Z" fill={profile.primary} stroke={profile.accent} strokeWidth="4" />
          <circle r="13" fill={profile.accent} />
        </motion.g>
      )
    case 'leaf':
      return (
        <motion.g animate={{ rotate: [0, 150, 310] }}>
          <path d="M-45 10 Q-8 -45 43 -9 Q8 39 -45 10 Z" fill={profile.primary} stroke={profile.accent} strokeWidth="4" />
          <path d="M-35 8 L34 -7 M-5 2 L6 -23 M9 -1 L20 18" {...common} strokeWidth="3" />
        </motion.g>
      )
    case 'lightning':
      return (
        <motion.g animate={{ scale: [0.72, 1.24, 0.9, 1.12] }}>
          <path d="M-10 -55 L39 -55 L9 -8 L39 -8 L-26 57 L-4 10 L-38 10 Z" fill={profile.primary} stroke={profile.accent} strokeWidth="5" />
        </motion.g>
      )
    case 'earth':
      return (
        <motion.g animate={{ rotate: [0, 55, 115] }}>
          <path d="M-42 -22 L-5 -50 L37 -30 L52 8 L16 47 L-32 35 L-53 2 Z" fill={profile.primary} stroke={profile.accent} strokeWidth="4" />
          <path d="M-25 -16 L4 -28 L27 -14 L13 4 L33 22 M-11 33 L-3 7 L-27 2" fill="none" {...common} strokeWidth="3" />
        </motion.g>
      )
    case 'psychic':
    case 'confusion':
      return (
        <motion.g animate={{ rotate: [0, 180, 360] }}>
          <circle r="37" fill="none" stroke={profile.primary} strokeWidth="8" strokeDasharray="22 10" />
          <circle r="23" fill={`url(#${glowId})`} stroke={profile.accent} strokeWidth="4" />
          <path d="M-15 0 Q0 -22 15 0 Q0 22 -15 0 Z" fill={profile.secondary} />
          <circle r="7" fill={profile.accent} />
        </motion.g>
      )
    case 'shadow':
      return (
        <motion.g animate={{ rotate: [-18, 8, -18], scale: [0.9, 1.15, 0.94] }}>
          <path d="M-57 29 Q-2 -54 58 -32 Q15 -13 -29 43 Z" fill={profile.primary} opacity="0.9" />
          <path d="M-47 38 Q3 -28 53 -42" fill="none" {...common} strokeWidth="8" />
          <path d="M-33 48 Q8 -11 49 -31" fill="none" stroke={profile.secondary} strokeWidth="4" strokeLinecap="round" />
        </motion.g>
      )
    case 'wind':
      return (
        <motion.g animate={{ rotate: [0, -12, 10, 0] }}>
          <path d="M-56 -17 Q-5 -49 47 -17 Q11 -25 -19 -4 M-48 7 Q3 -20 57 10 Q17 -1 -16 21 M-35 28 Q0 13 36 31" fill="none" {...common} />
        </motion.g>
      )
    case 'poison':
      return (
        <motion.g animate={{ scale: [0.78, 1.16, 0.9], rotate: [0, 15, -8] }}>
          <circle r="37" fill={`url(#${glowId})`} />
          <circle cx="-18" cy="-4" r="15" fill={profile.primary} />
          <circle cx="17" cy="5" r="20" fill={profile.secondary} />
          <circle cx="5" cy="-22" r="13" fill={profile.accent} />
        </motion.g>
      )
    case 'sleep':
      return (
        <motion.g animate={{ y: [0, -12, 0], rotate: [-8, 8, -8] }}>
          <path d="M-34 -34 H31 L-27 33 H37" fill="none" {...common} strokeWidth="11" />
          <circle cx="39" cy="-32" r="9" fill={profile.secondary} />
        </motion.g>
      )
    case 'supreme':
      return (
        <motion.g animate={{ rotate: [0, 140, 300], scale: [0.72, 1.28, 0.96] }}>
          <circle r="45" fill={`url(#${glowId})`} stroke={profile.accent} strokeWidth="5" />
          <path d="M0 -58 L13 -19 L52 -32 L25 0 L52 32 L13 19 L0 58 L-13 19 L-52 32 L-25 0 L-52 -32 L-13 -19 Z" fill={profile.primary} />
          <circle r="17" fill={profile.accent} />
        </motion.g>
      )
    default:
      return (
        <motion.g animate={{ rotate: [-12, 12, -6, 0], scale: [0.72, 1.18, 0.94] }}>
          <circle r="38" fill={`url(#${glowId})`} stroke={profile.accent} strokeWidth="5" />
          <path d="M-27 -4 L-8 -25 L8 -13 L24 -31 L33 -4 L16 11 L4 35 L-11 14 L-34 22 Z" fill={profile.primary} />
        </motion.g>
      )
  }
}

function Trail({
  particles,
  profile,
  start,
  end,
}: {
  particles: Particle[]
  profile: MoveVfxProfile
  start: Point
  end: Point
}) {
  return (
    <g>
      {particles.slice(0, Math.ceil(particles.length * 0.72)).map((particle, index) => (
        <motion.circle
          key={`trail-${index}`}
          cx={start.x}
          cy={start.y}
          r={particle.size * 0.66}
          fill={index % 3 === 0 ? profile.accent : profile.primary}
          initial={{ opacity: 0 }}
          animate={{
            cx: [start.x, end.x - 44],
            cy: [start.y, end.y + particle.wave],
            opacity: [0, 0.88, 0],
            scale: [0.45, 1.15, 0.25],
          }}
          transition={{
            duration: profile.durationMs / 1000,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </g>
  )
}

function Burst({
  particles,
  profile,
  at,
}: {
  particles: Particle[]
  profile: MoveVfxProfile
  at: Point
}) {
  return (
    <g>
      <motion.circle
        cx={at.x}
        cy={at.y}
        r="18"
        fill="none"
        stroke={profile.accent}
        strokeWidth="8"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.3, 3.8] }}
        transition={{ duration: 0.62, delay: profile.durationMs / 1000 - 0.2 }}
      />
      {particles.map((particle, index) => (
        <motion.circle
          key={`burst-${index}`}
          cx={at.x}
          cy={at.y}
          r={particle.size}
          fill={index % 2 === 0 ? profile.secondary : profile.accent}
          initial={{ opacity: 0 }}
          animate={{
            cx: at.x + Math.cos(particle.angle) * particle.distance,
            cy: at.y + Math.sin(particle.angle) * particle.distance,
            opacity: [0, 1, 0],
            scale: [0.2, 1.1, 0],
          }}
          transition={{
            duration: 0.58,
            delay: profile.durationMs / 1000 - 0.12 + particle.delay * 0.35,
            ease: 'easeOut',
          }}
        />
      ))}
    </g>
  )
}

function SelfAura({
  profile,
  particles,
  at,
}: {
  profile: MoveVfxProfile
  particles: Particle[]
  at: Point
}) {
  return (
    <g>
      {[0, 1, 2].map((index) => (
        <motion.circle
          key={`aura-${index}`}
          cx={at.x}
          cy={at.y}
          r={34 + index * 15}
          fill="none"
          stroke={index === 1 ? profile.accent : profile.primary}
          strokeWidth={7 - index}
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.35, 1.55] }}
          transition={{ duration: 1, delay: index * 0.13 }}
        />
      ))}
      {particles.map((particle, index) => (
        <motion.g
          key={`heal-${index}`}
          initial={{ x: at.x, y: at.y + 38, opacity: 0, scale: 0.4 }}
          animate={{
            x: at.x + Math.cos(particle.angle) * particle.distance * 0.55,
            y: at.y - 75 - particle.distance * 0.35,
            opacity: [0, 1, 0],
            scale: [0.4, 1.15, 0.65],
          }}
          transition={{ duration: 1.05, delay: particle.delay }}
        >
          <path d="M-3 -11 H3 V-3 H11 V3 H3 V11 H-3 V3 H-11 V-3 H-3 Z" fill={index % 2 ? profile.accent : profile.primary} />
        </motion.g>
      ))}
    </g>
  )
}

export function MoveVfx({ effect }: { effect: MoveVfxEvent }) {
  const profile = resolveMoveVfx(effect.move)
  const reverse = effect.side === 'B'
  const selfTarget = effect.target === 'self' || profile.selfTarget
  const start = reverse ? { x: 770, y: 180 } : { x: 250, y: 355 }
  const end = selfTarget ? start : reverse ? { x: 250, y: 355 } : { x: 770, y: 180 }
  const particles = createParticles(profile.seed, profile.particleCount)
  const glowId = `move-vfx-glow-${effect.id}`
  const auraId = `move-vfx-aura-${effect.id}`

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[45]"
      data-move-vfx-id={effect.move.id}
      data-move-vfx-archetype={profile.archetype}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      aria-hidden="true"
    >
      <svg className="h-full w-full overflow-visible" viewBox="0 0 1000 560" preserveAspectRatio="none">
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={profile.accent} stopOpacity="1" />
            <stop offset="52%" stopColor={profile.primary} stopOpacity="0.92" />
            <stop offset="100%" stopColor={profile.secondary} stopOpacity="0" />
          </radialGradient>
          <filter id={auraId} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation={7 + profile.variant * 1.5} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {selfTarget ? (
          <SelfAura profile={profile} particles={particles} at={start} />
        ) : (
          <>
            <Trail profile={profile} particles={particles} start={start} end={end} />
            <motion.g
              initial={{ x: start.x, y: start.y, opacity: 0, scale: 0.5 }}
              animate={{
                x: end.x,
                y: end.y,
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1 + profile.variant * 0.08, 1.12, 0.76],
              }}
              transition={{ duration: profile.durationMs / 1000, ease: 'easeInOut' }}
              style={{ filter: `url(#${auraId})` }}
            >
              <ProjectileGlyph profile={profile} glowId={glowId} />
            </motion.g>
            <Burst profile={profile} particles={particles} at={end} />
          </>
        )}
      </svg>
    </motion.div>
  )
}
