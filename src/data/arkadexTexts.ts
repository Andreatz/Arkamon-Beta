import arkadexTextsData from './arkadexTexts.json'

interface ArkadexTextEntry {
  id: number
  nome: string
  testo: string
}

const TEXTS = new Map<number, string>(
  (arkadexTextsData.specie as ArkadexTextEntry[])
    .map((entry) => [entry.id, entry.testo.trim()] as const)
    .filter(([, testo]) => testo.length > 0),
)

/** Testo descrittivo dell'Arkadex per la specie, oppure undefined se l'autore non l'ha ancora scritto. */
export function getArkadexText(speciesId: number): string | undefined {
  return TEXTS.get(speciesId)
}
