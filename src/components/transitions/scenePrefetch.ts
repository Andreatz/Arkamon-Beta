import type { NavigazioneScena } from '@/types'
import { getSceneKey } from './sceneTransitionState'

/**
 * Audit fase 6: precaricamento della scena di arrivo quando il giocatore mostra l'intenzione
 * di andarci (passaggio del puntatore o selezione di una destinazione sulla mappa),
 * così la transizione trova modulo e sfondo già pronti.
 */
type Preparer = (navigation: NavigazioneScena) => Promise<unknown>

let preparer: Preparer | null = null
const started = new Map<string, Promise<unknown>>()
const MAX_REMEMBERED = 12

export function registerScenePreparer(next: Preparer): void {
  preparer = next
}

/** Avvia (una volta sola per scena) il precaricamento; gli errori restano silenziosi. */
export function prefetchScene(navigation: NavigazioneScena): Promise<unknown> | null {
  if (!preparer) return null
  const key = getSceneKey(navigation)
  const existing = started.get(key)
  if (existing) return existing
  const promise = preparer(navigation).catch(() => { started.delete(key) })
  started.set(key, promise)
  if (started.size > MAX_REMEMBERED) started.delete(started.keys().next().value!)
  return promise
}

/** Solo per i test. */
export function resetScenePrefetch(): void {
  preparer = null
  started.clear()
}
