import type { NavigazioneScena, SceneId } from '@/types'
import { chooseCinematic, type CinematicSpec } from './cinematicTransitions'

export const TRANSITION_VIDEO_PATH = '/assets/Transizione Battaglia.mp4'
export const TRANSITION_VIDEO_START_SECONDS = 5
export const TRANSITION_VIDEO_SEGMENT_SECONDS = 3

/**
 * Transizioni dell'overlay. Le regie (clip e dissolvenza fra le scene) sono in
 * `cinematicTransitions.ts`; qui restano le sequenze dedicate e i ripieghi:
 * - `fade` / `white`: copertura al nero o al bianco (ripiego senza View Transitions API);
 * - `shared`: elemento condiviso con la View Transitions API (ripiego: `fade`);
 * - `arkamon-dice`, `battle-vs`, `battle-video`: sequenze dedicate.
 */
export type SceneTransitionMode =
  | 'arkamon-dice' | 'battle-vs' | 'battle-video'
  | 'fade' | 'white' | 'shared'

export const SCENE_TRANSITION_MODES: readonly SceneTransitionMode[] = [
  'fade', 'white', 'shared', 'arkamon-dice', 'battle-vs', 'battle-video',
]

export interface SceneTransitionProfile {
  readonly mode: SceneTransitionMode
  readonly playbackRate: number
  readonly durationMs: number
  readonly coverMs: number
  readonly blendMs: number
  readonly filter: string
  readonly label: string
  readonly failSafeMs: number
  /** Nome dell'elemento condiviso (`data-shared-element`) per la modalità `shared`. */
  readonly sharedElement: string | null
  /** Regia (clip o dissolvenza fra le scene); `null` = solo l'overlay. Vedi `cinematicTransitions.ts`. */
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
  sharedElement?: string
}

/** Sceglie l'overlay dalla coppia partenza → arrivo; senza partenza vale solo l'arrivo. */
function choose(destination: NavigazioneScena, origin: NavigazioneScena | undefined): Choice {
  const to = destination.scena
  const from = origin?.scena
  // Le sequenze dedicate hanno sempre la precedenza.
  if (to === 'battaglia') return { mode: 'battle-vs', coverMs: 160, durationMs: 2600, blendMs: 420 }
  if (to === 'evoluzione') return { mode: 'arkamon-dice', coverMs: 240, durationMs: 1900, blendMs: 400, filter: 'saturate(1.1) brightness(1.08)' }
  if (from && from === to && !isLocal(to)) return { mode: 'fade', coverMs: 20, durationMs: 120, blendMs: 70 }
  if ((from === 'mappa-principale' && to === 'deposito') || (from === 'deposito' && to === 'mappa-principale')) {
    return { mode: 'shared', coverMs: 20, durationMs: 380, blendMs: 120, sharedElement: 'deposito' }
  }
  if (from === 'battaglia') return { mode: 'white', coverMs: 160, durationMs: 460, blendMs: 320 }
  if (to === 'lega' || to === 'titolo' || from === 'titolo' || from === 'laboratorio' || from === 'evoluzione') {
    return { mode: 'fade', coverMs: 200, durationMs: 460, blendMs: 300 }
  }
  if (to === 'mappa-principale' || isLocal(to)) return { mode: 'fade', coverMs: 80, durationMs: 500, blendMs: 140 }
  return { mode: 'fade', coverMs: 20, durationMs: 120, blendMs: 70 }
}

/**
 * Profilo della transizione verso `destination`. `origin` è la scena che si lascia:
 * regia ed elemento condiviso dipendono da entrambe.
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
    sharedElement: choice.sharedElement ?? null,
    cinematic: chooseCinematic(destination, origin),
  }
}
