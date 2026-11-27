import type { NavigazioneScena } from '@/types'
import type { SfxId } from '@/audio/sfxIds'
import type { TransitionClipId } from './TransitionClip'

/**
 * Transizioni di scena (27 novembre 2026, seconda versione).
 *
 * Solo due passaggi hanno una regia: le clip generate con Flow (lotto 5), composte in WebGL
 * sopra la scena viva.
 * - `encounter` (`tx_incontro`): schegge a spirale che chiudono lo schermo al nero, poi la
 *   Carta VS (`overlay`).
 * - `radiance` (`tx_luce`): a fine battaglia la luce esplode; sotto il bianco pieno la scena
 *   cambia e la clip prosegue aprendosi su quella nuova (`clip`). Verso l'evoluzione il
 *   bianco lascia il posto al dado (`overlay`).
 *
 * Tutti gli altri cambi di scena sono una dissolvenza semplice fra le due scene
 * (View Transitions API, `snapshot`); senza API restano le dissolvenze dell'overlay.
 */
export type CinematicKind = 'encounter' | 'radiance' | 'dissolve'

export const CINEMATIC_KINDS: readonly CinematicKind[] = ['encounter', 'radiance', 'dissolve']

export interface CinematicSpec {
  readonly kind: CinematicKind
  /** Clip che guida il passaggio; assente nella dissolvenza. */
  readonly clip: TransitionClipId | null
  /**
   * - `overlay`: la clip copre lo schermo e si ferma; la sequenza dedicata (Carta VS, dado) prende il posto;
   * - `clip`: la scena cambia sotto la copertura della clip, che poi prosegue fino alla fine;
   * - `snapshot`: dissolvenza fra le istantanee delle due scene (View Transition).
   */
  readonly handoff: 'overlay' | 'clip' | 'snapshot'
  /** Durata della dissolvenza (ms, prima della velocità di regia); 0 per le clip. */
  readonly revealMs: number
  /** Suono del passaggio, sincronizzato con la clip. */
  readonly sound: SfxId
}

const DISSOLVE: CinematicSpec = { kind: 'dissolve', clip: null, handoff: 'snapshot', revealMs: 520, sound: 'transition.whoosh' }

/**
 * Regia per la coppia partenza → arrivo, oppure `null` (si usa la transizione dell'overlay:
 * elemento condiviso del Deposito, stessa scena, primo caricamento, evoluzione fuori battaglia).
 */
export function chooseCinematic(destination: NavigazioneScena, origin: NavigazioneScena | undefined): CinematicSpec | null {
  if (!origin) return null
  const to = destination.scena
  const from = origin.scena
  const local = to === 'citta' || to === 'percorso'
  if (from === to && !local) return null
  if (from === to && origin.payload?.luogo === destination.payload?.luogo) return null
  if ((from === 'mappa-principale' && to === 'deposito') || (from === 'deposito' && to === 'mappa-principale')) return null

  if (to === 'battaglia') return { kind: 'encounter', clip: 'incontro', handoff: 'overlay', revealMs: 0, sound: 'transition.encounter' }
  if (from === 'battaglia') {
    return { kind: 'radiance', clip: 'luce', handoff: to === 'evoluzione' ? 'overlay' : 'clip', revealMs: 0, sound: 'transition.radiance' }
  }
  if (to === 'evoluzione') return null
  return DISSOLVE
}
