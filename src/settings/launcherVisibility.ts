import { useLayoutEffect, useSyncExternalStore } from 'react'

/**
 * Fase U6: una scena che mostra un proprio comando «Partita» (la scheda della mappa locale)
 * smonta il pulsante globale soltanto mentre è montata. Durante la transizione verso la
 * scena il pulsante globale resta quindi raggiungibile. Il layout effect aggiorna il pulsante
 * nello stesso commit in cui compare quello della scena: i due non sono mai visibili insieme.
 */
let owners = 0
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
const emit = () => listeners.forEach(listener => listener())

export function useGlobalLauncherHidden(): boolean {
  return useSyncExternalStore(subscribe, () => owners > 0, () => false)
}

export function useHideGlobalLauncher(active: boolean): void {
  useLayoutEffect(() => {
    if (!active) return
    owners += 1; emit()
    return () => { owners -= 1; emit() }
  }, [active])
}
