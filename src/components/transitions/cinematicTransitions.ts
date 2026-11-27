import type { NavigazioneScena, SceneId } from '@/types'
import { MAIN_MAP_COORDS } from '@/data/mainMapCoords'
import type { SfxId } from '@/audio/sfxIds'

/**
 * Transizioni cinematografiche (27 novembre 2026).
 *
 * Ogni passaggio ha due tempi:
 * 1. **anticipazione** sulla scena viva: la camera si muove (spinta, frusta, scossa), mentre
 *    un livello di effetti (nuvole, luce, polvere d'oro, spirale) entra sopra;
 * 2. **passaggio di consegne**:
 *    - `snapshot`: la View Transitions API fotografa l'ultimo fotogramma della scena che esce e lo
 *      anima sopra (o sotto) la scena che entra, già viva. Le due scene convivono: niente nero.
 *    - `overlay`: l'anticipazione chiude lo schermo e la sequenza dedicata (Carta VS, dado
 *      d'evoluzione) prende il suo posto.
 *
 * Senza View Transitions API le modalità `snapshot` cedono alle transizioni precedenti.
 */
export type CinematicKind =
  | 'sky-dive' | 'sky-rise' | 'whip' | 'encounter' | 'radiance'
  | 'gold-burst' | 'golden-iris' | 'curtain' | 'dissolve'

export const CINEMATIC_KINDS: readonly CinematicKind[] = [
  'sky-dive', 'sky-rise', 'whip', 'encounter', 'radiance', 'gold-burst', 'golden-iris', 'curtain', 'dissolve',
]

export interface CinematicSpec {
  readonly kind: CinematicKind
  /** Durata dell'anticipazione sulla scena viva (ms, prima della velocità di regia). */
  readonly anticipateMs: number
  /** Durata della rivelazione con le due scene insieme (ms). */
  readonly revealMs: number
  readonly handoff: 'snapshot' | 'overlay'
  /** Direzione del viaggio (vettore unitario sullo schermo) per la panoramica a frusta. */
  readonly direction: { readonly x: number; readonly y: number }
  /** Suono dell'anticipazione. */
  readonly sound: SfxId
}

const isLocal = (scena: SceneId | undefined) => scena === 'citta' || scena === 'percorso'

function placeOf(navigation: NavigazioneScena | undefined): string | undefined {
  const value = navigation?.payload?.luogo
  return typeof value === 'string' && value ? value : undefined
}

/**
 * Direzione sullo schermo da un luogo all'altro, letta sulla mappa principale.
 * Senza coordinate note si viaggia verso destra, come si legge.
 */
export function travelDirection(from: string | undefined, to: string | undefined): { x: number; y: number } {
  const a = from ? MAIN_MAP_COORDS[from] : undefined
  const b = to ? MAIN_MAP_COORDS[to] : undefined
  if (!a || !b) return { x: 1, y: 0 }
  const dx = b.x - a.x
  const dy = (b.y - a.y) * 0.6 // la mappa è più alta che larga: il verticale pesa meno
  const length = Math.hypot(dx, dy)
  if (length < 0.5) return { x: 1, y: 0 }
  return { x: Math.round(dx / length * 1000) / 1000, y: Math.round(dy / length * 1000) / 1000 }
}

const spec = (kind: CinematicKind, anticipateMs: number, revealMs: number, sound: SfxId,
  handoff: CinematicSpec['handoff'] = 'snapshot', direction = { x: 1, y: 0 }): CinematicSpec =>
  ({ kind, anticipateMs, revealMs, handoff, direction, sound })

/**
 * Transizione cinematografica per la coppia partenza → arrivo, oppure `null` (si usa la
 * transizione precedente: elemento condiviso del Deposito, stessa scena, primo caricamento).
 */
export function chooseCinematic(destination: NavigazioneScena, origin: NavigazioneScena | undefined): CinematicSpec | null {
  if (!origin) return null
  const to = destination.scena
  const from = origin.scena
  if (from === to && !isLocal(to)) return null
  if ((from === 'mappa-principale' && to === 'deposito') || (from === 'deposito' && to === 'mappa-principale')) return null

  if (to === 'battaglia') return spec('encounter', 900, 0, 'transition.encounter', 'overlay')
  if (to === 'evoluzione') return spec('radiance', 520, 0, 'transition.radiance', 'overlay')
  if (from === 'mappa-principale' && isLocal(to)) return spec('sky-dive', 620, 980, 'transition.dive')
  if (isLocal(from) && to === 'mappa-principale') return spec('sky-rise', 480, 1050, 'transition.rise')
  if (isLocal(from) && isLocal(to)) {
    if (placeOf(origin) === placeOf(destination)) return null
    return spec('whip', 220, 640, 'transition.whip', 'snapshot', travelDirection(placeOf(origin), placeOf(destination)))
  }
  if (from === 'battaglia' || from === 'evoluzione') return spec('radiance', 560, 1150, 'transition.radiance')
  if (to === 'lega') return spec('radiance', 700, 1400, 'transition.radiance')
  if (to === 'titolo') return spec('curtain', 520, 1200, 'transition.curtain')
  if (from === 'titolo') return spec('gold-burst', 640, 1150, 'transition.sparkle')
  if (from === 'laboratorio') return spec('golden-iris', 380, 1150, 'transition.iris')
  return spec('dissolve', 200, 760, 'transition.whoosh')
}
