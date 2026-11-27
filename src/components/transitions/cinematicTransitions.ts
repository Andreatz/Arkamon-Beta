import type { NavigazioneScena } from '@/types'
import type { SfxId } from '@/audio/sfxIds'
import type { TransitionClipId } from './TransitionClip'

/**
 * Transizioni di scena (27 novembre 2026, terza versione).
 *
 * Tre passaggi hanno una regia: clip con l'alfa, composte in WebGL sopra la scena viva. La scena
 * cambia sotto la copertura totale della clip, che poi prosegue aprendosi su quella nuova (`clip`).
 * - `radiance` (`tx_luce`, Flow): a fine battaglia la luce esplode; verso l'evoluzione il bianco
 *   lascia il posto al dado (`overlay`).
 * - `title` (`tx_titolo`, Flow): vortice di sabbia d'oro dal titolo al gioco.
 * - `smoke` (fumo anime Filmbro): viaggio dalla mappa a un luogo e ritorno.
 *
 * L'ingresso in battaglia è la Carta VS dell'overlay. Tutti gli altri cambi di scena sono una
 * dissolvenza semplice fra le due scene (View Transitions API, `snapshot`).
 */
export type CinematicKind = 'radiance' | 'title' | 'smoke' | 'dissolve'

export const CINEMATIC_KINDS: readonly CinematicKind[] = ['radiance', 'title', 'smoke', 'dissolve']

export interface CinematicSpec {
  readonly kind: CinematicKind
  /** Clip che guida il passaggio; assente nella dissolvenza. */
  readonly clip: TransitionClipId | null
  /**
   * - `overlay`: la clip copre lo schermo e si ferma; la sequenza dedicata (dado) prende il posto;
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
 * Carta VS, elemento condiviso del Deposito, stessa scena, primo caricamento, evoluzione fuori battaglia).
 */
export function chooseCinematic(destination: NavigazioneScena, origin: NavigazioneScena | undefined): CinematicSpec | null {
  if (!origin) return null
  const to = destination.scena
  const from = origin.scena
  const local = to === 'citta' || to === 'percorso'
  if (from === to && !local) return null
  if (from === to && origin.payload?.luogo === destination.payload?.luogo) return null
  if ((from === 'mappa-principale' && to === 'deposito') || (from === 'deposito' && to === 'mappa-principale')) return null

  if (to === 'battaglia') return null
  if (from === 'battaglia') {
    return { kind: 'radiance', clip: 'luce', handoff: to === 'evoluzione' ? 'overlay' : 'clip', revealMs: 0, sound: 'transition.radiance' }
  }
  if (to === 'evoluzione') return null
  if (from === 'titolo') return { kind: 'title', clip: 'titolo', handoff: 'clip', revealMs: 0, sound: 'transition.title' }
  const fromLocal = from === 'citta' || from === 'percorso'
  if ((from === 'mappa-principale' && local) || (fromLocal && to === 'mappa-principale')) {
    return { kind: 'smoke', clip: 'fumo', handoff: 'clip', revealMs: 0, sound: 'transition.smoke' }
  }
  return DISSOLVE
}
