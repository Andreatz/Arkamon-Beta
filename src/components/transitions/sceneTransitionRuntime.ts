/** Supporto in esecuzione per le transizioni di scena: misure nel DOM e capacità del browser. */

/** Punto in percentuale del riquadro della scena (0–100 su entrambi gli assi). */
export interface AnchorPoint {
  x: number
  y: number
}

/** Oltre questo limite la rivelazione parte anche se modulo o sfondo non sono pronti. */
export const PREPARE_LIMIT_MS = 2500

const ANCHOR_NAME = /^[\w-]+$/

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value * 100) / 100))

/**
 * Cerca `[data-transition-anchor="<name>"]` dentro `scene` e restituisce il centro
 * dell'elemento in percentuale del riquadro della scena. I rapporti fra rettangoli
 * restano corretti anche se il palco è scalato per adattarsi alla finestra.
 */
export function measureTransitionAnchor(scene: Element, name: string): AnchorPoint | null {
  if (!ANCHOR_NAME.test(name)) return null
  const element = scene.querySelector(`[data-transition-anchor="${name}"]`)
  if (!element) return null
  const box = scene.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  if (box.width <= 0 || box.height <= 0) return null
  return {
    x: clampPercent(((rect.left + rect.width / 2) - box.left) / box.width * 100),
    y: clampPercent(((rect.top + rect.height / 2) - box.top) / box.height * 100),
  }
}

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
