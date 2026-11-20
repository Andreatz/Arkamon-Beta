/** Nome leggibile di un luogo del gioco: «Percorso_3» → «Percorso 3», «ReggioCalabria» → «Reggio Calabria». */
export function placeLabel(place: string): string {
  return place.replace(/_/g, ' ').replace(/([a-zà-ù])([A-Z])/g, '$1 $2')
}
