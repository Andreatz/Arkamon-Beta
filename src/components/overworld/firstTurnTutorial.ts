/** Audit fase 8: tutorial breve del primo turno (testi in un modulo puro per i test). */
export interface TutorialStep { id: 'movimento' | 'interazioni' | 'cattura'; title: string; body: string }

export const FIRST_TURN_TUTORIAL: readonly TutorialStep[] = [
  {
    id: 'movimento',
    title: 'Come ci si muove',
    body: 'Scegli un luogo vicino evidenziato sulla mappa e conferma. Ogni turno hai due azioni: due movimenti, oppure un movimento e un’interazione. Poi premi «Passa turno».',
  },
  {
    id: 'interazioni',
    title: 'Cos’è un’interazione',
    body: 'In città e nei percorsi apri la mappa del luogo e fermati su un pallino: dialoghi, Infermeria Arka, Arkastore, allenatori e cespugli. Avviare un’interazione chiude il turno.',
  },
  {
    id: 'cattura',
    title: 'Come si cattura',
    body: 'Nei cespugli incontri Arkamon selvatici. Indeboliscili con le mosse, poi apri la Borsa e usa un Sacchettino: più HP ha perso, più è facile che resti con te.',
  },
]

/** Il tutorial compare sulla mappa principale, dopo il Laboratorio, finché non viene completato o saltato. */
export function shouldShowTutorial(done: boolean, scene: string, startersComplete: boolean): boolean {
  return !done && startersComplete && scene === 'mappa-principale'
}
