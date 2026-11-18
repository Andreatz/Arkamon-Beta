/**
 * Animazioni d'ambiente delle mappe locali dipinte: barche che ondeggiano e fontane con zampilli.
 * Coordinate in percentuale dell'immagine intera (come i pallini), lette sulle pitture di riferimento.
 * Le barche usano un ritaglio della pittura stessa: `w` e `h` sono la finestra del ritaglio.
 */
export interface AmbientBoat { x: number; y: number; w: number; h: number }
export interface AmbientFountain { x: number; y: number; size: number }
export interface LocalMapAmbience { boats: AmbientBoat[]; fountains: AmbientFountain[] }

const boat = (x: number, y: number, w = 3.4, h = 3.2): AmbientBoat => ({ x, y, w, h })

export const LOCAL_MAP_AMBIENCE: Readonly<Record<string, LocalMapAmbience>> = {
  Venezia: {
    boats: [
      boat(39.6, 35.0), boat(46.1, 35.6), boat(53.8, 68.8), boat(94.6, 60.5), boat(94.2, 66.5),
      boat(80.4, 58.4), boat(70.7, 90.1), boat(33.5, 90.4), boat(8.2, 76.5), boat(22.5, 92.1),
      boat(10.2, 45.5), boat(56.7, 21.6), boat(76.1, 32.0), boat(95.0, 13.2, 6, 7.5), boat(91.3, 5.8),
    ],
    fountains: [{ x: 12.9, y: 33.4, size: 3.4 }, { x: 32.1, y: 52.6, size: 3.6 }],
  },
  Roma: {
    boats: [],
    fountains: [
      { x: 64.6, y: 38.9, size: 4.2 }, { x: 13.8, y: 52.2, size: 3 }, { x: 5.4, y: 55.6, size: 3 },
      { x: 12.7, y: 80.7, size: 3.2 }, { x: 65.4, y: 77.2, size: 2.8 },
    ],
  },
  Napoli: {
    boats: [
      boat(56.5, 81.1, 2.6, 4.6), boat(93.6, 60.5, 2.6, 4.6), boat(98.3, 61.9, 2.4, 4.6), boat(88.6, 59.1),
      boat(73.3, 66.5, 4, 3.6), boat(85.8, 69.5, 4.5, 5.4), boat(82.9, 60.9), boat(96.4, 47.3),
    ],
    fountains: [],
  },
}
