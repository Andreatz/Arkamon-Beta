import { createContext, useContext } from 'react'
import { useGameStore } from '@store/gameStore'
import type { NavigazioneScena } from '@/types'

export const SceneNavigationContext = createContext<NavigazioneScena | null>(null)
export const SceneInputContext = createContext(false)

export function useSceneInputBlocked(): boolean {
  return useContext(SceneInputContext)
}

/** Keep the outgoing location stable until the transition covers the screen. */
export function useSceneNavigation(): NavigazioneScena {
  const presented = useContext(SceneNavigationContext)
  const requested = useGameStore((state) => state.scenaCorrente)
  return presented ?? requested
}
