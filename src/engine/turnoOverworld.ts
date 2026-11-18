import type { StatoTurnoOverworld } from '@/types'

/**
 * Turno sulla mappa: due movimenti oppure un movimento e un'interazione, condivisi
 * fra mappa principale e mappa locale. Prima stavano in `movimento.ts`, insieme alla
 * vecchia mappa a griglia rimossa il 18 novembre 2026.
 */

/**
 * Consuma azioni nel turno corrente.
 *   - `'movimento'`: -1 (clamp a 0)
 *   - `'interazione'`: chiude il turno (azioni → 0)
 *
 * Funzione pura: restituisce un nuovo stato, non muta l'input.
 */
export function consumaAzione(
  stato: StatoTurnoOverworld,
  tipo: 'movimento' | 'interazione'
): StatoTurnoOverworld {
  if (tipo === 'interazione') {
    return { ...stato, azioniRimaste: 0 }
  }
  return { ...stato, azioniRimaste: Math.max(0, stato.azioniRimaste - 1) }
}

/** Inizia un nuovo turno per l'altro giocatore con 2 azioni piene. */
export function nuovoTurno(giocatoreCorrente: 1 | 2): StatoTurnoOverworld {
  return {
    giocatoreAttivo: giocatoreCorrente === 1 ? 2 : 1,
    azioniRimaste: 2,
  }
}
