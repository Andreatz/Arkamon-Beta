import { useEffect, useMemo, useRef } from 'react'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { useRegiaStore } from '@/regia/regiaStore'
import { createDirector, type Director } from './director'
import type { MotionSettings } from './tokens'

/**
 * Sequenziatore legato alla scena che lo crea: segue velocità e movimento
 * ridotto del giocatore, si ferma con la pausa di regia, segnala alla regia
 * quando una sequenza è in corso e annulla tutto allo smontaggio.
 *
 * @param activity Etichetta mostrata dalla regia mentre una sequenza è in corso.
 */
export function useDirector(activity = 'Sequenza in corso'): Director {
  const preferences = useGameMotionPreferences()
  const settings = useRef<MotionSettings>(preferences)
  settings.current = preferences
  const director = useMemo(() => createDirector({ getSettings: () => settings.current }), [])
  const paused = useRegiaStore((state) => state.paused)

  useEffect(() => { director.setPaused(paused) }, [director, paused])
  useEffect(() => {
    const report = (active: number) => useRegiaStore.getState().setBusy(active > 0, activity, 'director')
    const unsubscribe = director.subscribe(report)
    return () => {
      unsubscribe()
      director.cancelAll()
      useRegiaStore.getState().setBusy(false, '', 'director')
    }
  }, [director, activity])

  return director
}
