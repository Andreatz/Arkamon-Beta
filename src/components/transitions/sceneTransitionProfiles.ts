import type { NavigazioneScena, SceneId } from '@/types'
import { chooseCinematic, type CinematicSpec } from './cinematicTransitions'

export const TRANSITION_VIDEO_PATH = '/assets/Transizione Battaglia.mp4'
export const TRANSITION_VIDEO_START_SECONDS = 5
export const TRANSITION_VIDEO_SEGMENT_SECONDS = 3

/**
 * Libreria delle transizioni di scena (audit, sezione 8.7).
 * - `fade` / `white`: copertura al nero o al bianco;
 * - `iris`: cerchio che si chiude e si riapre su un punto;
 * - `diagonal`: taglio diagonale che attraversa lo schermo;
 * - `brush`: pennellate d'inchiostro sfalsate;
 * - `zoom-in` / `zoom-out`: la camera entra in un nodo della mappa o ne esce;
 * - `shared`: elemento condiviso con la View Transitions API (ripiego: `fade`);
 * - `arkamon-dice`, `battle-vs`, `battle-video`: sequenze dedicate.
 */
export type SceneTransitionMode =
  | 'arkamon-dice' | 'battle-vs' | 'battle-video'
  | 'fade' | 'white' | 'iris' | 'diagonal' | 'brush'
  | 'zoom-in' | 'zoom-out' | 'shared'

export const SCENE_TRANSITION_MODES: readonly SceneTransitionMode[] = [
  'fade', 'white', 'iris', 'diagonal', 'brush', 'zoom-in', 'zoom-out', 'shared',
  'arkamon-dice', 'battle-vs', 'battle-video',
]

/** Dove cercare il punto `data-transition-anchor`: nella scena che esce o in quella che entra. */
export type SceneTransitionAnchorScene = 'outgoing' | 'incoming'

export interface SceneTransitionAnchor {
  /** Valore di `data-transition-anchor` (per i nodi della mappa, il nome del luogo). */
  readonly name: string
  readonly scene: SceneTransitionAnchorScene
}

export interface SceneTransitionProfile {
  readonly mode: SceneTransitionMode
  readonly playbackRate: number
  readonly durationMs: number
  readonly coverMs: number
  readonly blendMs: number
  readonly filter: string
  readonly label: string
  readonly failSafeMs: number
  /** Punto di fuga di iride e zoom; assente = centro dello schermo. */
  readonly anchor: SceneTransitionAnchor | null
  /** Nome dell'elemento condiviso (`data-shared-element`) per la modalità `shared`. */
  readonly sharedElement: string | null
  /**
   * Versione cinematografica (anticipazione sulla scena viva, poi le due scene insieme).
   * `null` = solo la transizione qui sopra. Vedi `cinematicTransitions.ts`.
   */
  readonly cinematic: CinematicSpec | null
}

const SCENE_LABELS: Record<SceneId, string> = {
  lega: 'Lega Arkamon',
  titolo: 'Apertura del menu principale',
  laboratorio: 'Ingresso nel laboratorio',
  'mappa-principale': 'Ritorno alla mappa principale',
  percorso: 'Ingresso nel percorso',
  citta: 'Ingresso in città',
  palestra: 'Ingresso nella palestra',
  'centro-pokemon': 'Ingresso nell’Infermeria Arka',
  battaglia: 'Inizio della battaglia',
  deposito: 'Apertura del deposito',
  squadra: 'Apertura della squadra',
  evoluzione: 'Ingresso nella scena di evoluzione',
}

function locationOf(navigation: NavigazioneScena): string {
  const location = navigation.payload?.luogo
  return typeof location === 'string' && location
    ? location
    : navigation.scena === 'percorso' ? 'Percorso_1' : 'Venezia'
}

function destinationLabel(destination: NavigazioneScena): string {
  const locationName = locationOf(destination).replace(/_/g, ' ')
  if (destination.scena === 'citta') return `Ingresso a ${locationName}`
  if (destination.scena === 'percorso') return `Ingresso in ${locationName}`
  return SCENE_LABELS[destination.scena]
}

const isLocal = (scena: SceneId | undefined) => scena === 'citta' || scena === 'percorso'

interface Choice {
  mode: SceneTransitionMode
  coverMs: number
  durationMs: number
  blendMs: number
  filter?: string
  anchor?: SceneTransitionAnchor
  sharedElement?: string
}

/** Sceglie la transizione dalla coppia partenza → arrivo; senza partenza vale solo l'arrivo. */
function choose(destination: NavigazioneScena, origin: NavigazioneScena | undefined): Choice {
  const to = destination.scena
  const from = origin?.scena
  // Le sequenze dedicate hanno sempre la precedenza.
  if (to === 'battaglia') return { mode: 'battle-vs', coverMs: 160, durationMs: 2600, blendMs: 420 }
  if (to === 'evoluzione') return { mode: 'arkamon-dice', coverMs: 240, durationMs: 1900, blendMs: 400, filter: 'saturate(1.1) brightness(1.08)' }
  if (from && from === to && !isLocal(to)) return { mode: 'fade', coverMs: 20, durationMs: 120, blendMs: 70 }

  // La camera entra nel nodo della mappa e la mappa locale si apre dallo stesso punto.
  if (from === 'mappa-principale' && isLocal(to)) {
    return { mode: 'zoom-in', coverMs: 620, durationMs: 760, blendMs: 560, anchor: { name: locationOf(destination), scene: 'outgoing' } }
  }
  // Al ritorno la mappa riparte stretta sul luogo appena lasciato e si allarga.
  if (isLocal(from) && to === 'mappa-principale' && origin) {
    return { mode: 'zoom-out', coverMs: 380, durationMs: 860, blendMs: 640, anchor: { name: locationOf(origin), scene: 'incoming' } }
  }
  if (isLocal(from) && isLocal(to)) return { mode: 'diagonal', coverMs: 340, durationMs: 560, blendMs: 340 }
  if ((from === 'mappa-principale' && to === 'deposito') || (from === 'deposito' && to === 'mappa-principale')) {
    return { mode: 'shared', coverMs: 20, durationMs: 380, blendMs: 120, sharedElement: 'deposito' }
  }
  if (from === 'battaglia') return { mode: 'white', coverMs: 160, durationMs: 460, blendMs: 320 }
  if (from === 'evoluzione') return { mode: 'white', coverMs: 200, durationMs: 520, blendMs: 360 }
  if (to === 'lega') return { mode: 'white', coverMs: 260, durationMs: 700, blendMs: 440 }
  if (to === 'titolo') return { mode: 'fade', coverMs: 260, durationMs: 620, blendMs: 360 }
  // Il logo del titolo è il punto da cui esplode la polvere d'oro (versione cinematografica).
  if (from === 'titolo') return { mode: 'brush', coverMs: 540, durationMs: 780, blendMs: 540, anchor: { name: 'title-logo', scene: 'outgoing' } }
  if (from === 'laboratorio') return { mode: 'iris', coverMs: 480, durationMs: 660, blendMs: 520 }
  if (to === 'mappa-principale' || isLocal(to)) return { mode: 'fade', coverMs: 80, durationMs: 500, blendMs: 140 }
  return { mode: 'fade', coverMs: 20, durationMs: 120, blendMs: 70 }
}

/**
 * Profilo della transizione verso `destination`. `origin` è la scena che si lascia:
 * le transizioni direzionali (zoom, elemento condiviso) dipendono da entrambe.
 */
export function getSceneTransitionProfile(destination: NavigazioneScena, origin?: NavigazioneScena): SceneTransitionProfile {
  const choice = choose(destination, origin)
  return {
    mode: choice.mode,
    playbackRate: 1,
    durationMs: choice.durationMs,
    coverMs: choice.coverMs,
    blendMs: choice.blendMs,
    filter: choice.filter ?? 'none',
    label: destinationLabel(destination),
    // Metadata, seeking or playback can stall; always release the input blocker.
    failSafeMs: Math.min(8000, choice.coverMs + choice.durationMs + choice.blendMs + 1500),
    anchor: choice.anchor ?? null,
    sharedElement: choice.sharedElement ?? null,
    cinematic: chooseCinematic(destination, origin),
  }
}
