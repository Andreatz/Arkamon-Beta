/**
 * Coordinate dei luoghi sulla mappa principale, in percentuale (0–100).
 * Spostate qui dalla scena della mappa il 27 novembre 2026: servono anche alle transizioni
 * (la panoramica fra due luoghi segue la direzione del viaggio). Le posizioni modificate
 * dall'Admin restano nel tema e hanno la precedenza nella scena.
 */
export type MainMapNodeKind = 'citta' | 'percorso' | 'villaggio'

export const MAIN_MAP_COORDS: Readonly<Record<string, { x: number; y: number; tipo: MainMapNodeKind }>> = {
  // Nord
  Torino:         { x: 22, y: 26, tipo: 'citta' },
  Percorso_6:     { x: 24, y: 28, tipo: 'percorso' },
  Percorso_5:     { x: 22, y: 32, tipo: 'percorso' },
  Percorso_4:     { x: 26, y: 30, tipo: 'percorso' },
  Percorso_3:     { x: 28, y: 24, tipo: 'percorso' },
  Milano:         { x: 32, y: 22, tipo: 'citta' },
  Percorso_2:     { x: 36, y: 24, tipo: 'percorso' },
  Piacenza:       { x: 40, y: 28, tipo: 'villaggio' },
  Percorso_1:     { x: 48, y: 26, tipo: 'percorso' },
  Venezia:        { x: 56, y: 24, tipo: 'citta' },
  Pordenone:      { x: 64, y: 20, tipo: 'percorso' },

  // Centro
  Grosseto:       { x: 38, y: 44, tipo: 'citta' },
  Civitavecchia:  { x: 42, y: 52, tipo: 'villaggio' },
  Roma:           { x: 48, y: 56, tipo: 'citta' },
  Percorso_15:    { x: 54, y: 54, tipo: 'percorso' },
  Pescara:        { x: 60, y: 52, tipo: 'citta' },
  Percorso_14:    { x: 60, y: 56, tipo: 'percorso' },
  Percorso_13:    { x: 62, y: 60, tipo: 'percorso' },
  Napoli:         { x: 56, y: 64, tipo: 'citta' },
  Percorso_12:    { x: 62, y: 64, tipo: 'percorso' },
  Percorso_11:    { x: 66, y: 62, tipo: 'percorso' },
  Foggia:         { x: 72, y: 62, tipo: 'citta' },

  // Sud
  Percorso_10:    { x: 64, y: 72, tipo: 'percorso' },
  ReggioCalabria: { x: 58, y: 82, tipo: 'villaggio' },
  Percorso_9:     { x: 52, y: 88, tipo: 'percorso' },
  Palermo:        { x: 44, y: 90, tipo: 'citta' },

  // Sardegna
  Percorso_7:     { x: 32, y: 64, tipo: 'percorso' },
  Cagliari:       { x: 24, y: 78, tipo: 'citta' },
  Percorso_8:     { x: 32, y: 86, tipo: 'percorso' },
}
