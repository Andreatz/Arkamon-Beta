/** Supporto in esecuzione per le transizioni di scena: misure nel DOM e capacità del browser. */

/** Oltre questo limite la rivelazione parte anche se modulo o sfondo non sono pronti. */
export const PREPARE_LIMIT_MS = 2500

/** La View Transitions API serve all'elemento condiviso; altrove si ripiega su una dissolvenza. */
export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined'
    && typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === 'function'
}

/** Attende che l'immagine sia scaricata e decodificata, senza mai rifiutare. */
export function decodeImage(src: string): Promise<void> {
  if (typeof Image === 'undefined') return Promise.resolve()
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  const settled = typeof image.decode === 'function'
    ? image.decode()
    : new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject })
  return settled.then(() => undefined, () => undefined)
}
