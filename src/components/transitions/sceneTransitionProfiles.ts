import type { NavigazioneScena, SceneId } from '@/types'

export const TRANSITION_VIDEO_PATH = '/assets/Transizione Battaglia.mp4'
export const TRANSITION_VIDEO_START_SECONDS = 5
export const TRANSITION_VIDEO_SEGMENT_SECONDS = 3

export type SceneTransitionMode = 'arkamon-dice' | 'battle-video'

export interface SceneTransitionProfile {
  readonly mode: SceneTransitionMode
  readonly playbackRate: number
  readonly durationMs: number
  readonly coverMs: number
  readonly blendMs: number
  readonly filter: string
  readonly label: string
  readonly failSafeMs: number
}

const SCENE_LABELS: Record<SceneId, string> = {
  titolo: 'Apertura del menu principale',
  laboratorio: 'Ingresso nel laboratorio',
  'mappa-principale': 'Ritorno alla mappa principale',
  'mappa-griglia': 'Ingresso nella mappa',
  percorso: 'Ingresso nel percorso',
  citta: 'Ingresso in città',
  palestra: 'Ingresso nella palestra',
  'centro-pokemon': 'Ingresso nel Centro Pokémon',
  battaglia: 'Inizio della battaglia',
  deposito: 'Apertura del deposito',
  squadra: 'Apertura della squadra',
  evoluzione: 'Ingresso nella scena di evoluzione',
}

function destinationLabel(destination: NavigazioneScena): string {
  const location = destination.payload?.luogo
  const locationName = typeof location === 'string' && location
    ? location.replace(/_/g, ' ')
    : destination.scena === 'percorso' ? 'Percorso 1' : 'Venezia'

  if (destination.scena === 'citta') return `Ingresso a ${locationName}`
  if (destination.scena === 'percorso') return `Ingresso in ${locationName}`
  return SCENE_LABELS[destination.scena]
}

/** The capture D6 joins navigation, creatures and the board; battles retain their VS video. */
export function getSceneTransitionProfile(destination: NavigazioneScena): SceneTransitionProfile {
  const battle = destination.scena === 'battaglia'
  const evolution = destination.scena === 'evoluzione'
  const durationMs = battle ? 3000 : evolution ? 1900 : 1600
  const coverMs = battle ? 180 : 240
  const blendMs = battle ? 950 : evolution ? 400 : 300

  return {
    mode: battle ? 'battle-video' : 'arkamon-dice',
    playbackRate: 1,
    durationMs,
    coverMs,
    blendMs,
    filter: evolution ? 'saturate(1.1) brightness(1.08)' : 'none',
    label: destinationLabel(destination),
    // Metadata, seeking or playback can stall; always release the input blocker.
    failSafeMs: Math.min(8000, coverMs + durationMs + blendMs + 1500),
  }
}
