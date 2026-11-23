/** Nomi propri dei luoghi che non derivano dall'identificatore (rinumerazione del 18 novembre 2026). */
const PLACE_LABELS: Readonly<Record<string, string>> = {
  Percorso_15: 'Percorso 15 · Via Vittoria',
  Via_Vittoria_2: 'Via Vittoria · seconda mappa',
  Via_Vittoria_3: 'Via Vittoria · terza mappa',
  Lega_Roma: 'Lega di Roma',
  Leggendario_Percorso_3: 'Luogo leggendario del Percorso 3',
  Leggendario_Percorso_11: 'Luogo leggendario del Percorso 11',
  Leggendario_Percorso_12: 'Luogo leggendario del Percorso 12',
  Nascondiglio_Team_Towers: 'Nascondiglio del Team Towers',
}

/** Nome leggibile di un luogo del gioco: «Percorso_3» → «Percorso 3», «ReggioCalabria» → «Reggio Calabria». */
export function placeLabel(place: string): string {
  if (Object.prototype.hasOwnProperty.call(PLACE_LABELS, place)) return PLACE_LABELS[place]
  return place.replace(/_/g, ' ').replace(/([a-zà-ù])([A-Z])/g, '$1 $2')
}
