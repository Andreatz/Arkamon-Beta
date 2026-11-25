import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { playSound } from '@/utils/soundManager'
import type { PokemonIstanza } from '@/types'

type HpSnapshot = Map<string, number>

function snapshot(...squads: readonly (readonly PokemonIstanza[])[]): HpSnapshot {
  const map: HpSnapshot = new Map()
  for (const squad of squads) for (const pokemon of squad) map.set(pokemon.istanzaId, pokemon.hp)
  return map
}

/** Vero se almeno un Arkamon già presente ha più HP di prima (una cura, non una cattura o un'aggiunta). */
export function someoneHealed(before: HpSnapshot, after: HpSnapshot): boolean {
  for (const [id, hp] of after) {
    const previous = before.get(id)
    if (previous !== undefined && hp > previous) return true
  }
  return false
}

/**
 * Audit fase 6: suono di cura per ogni guarigione fuori dalla battaglia (cura automatica di fine
 * battaglia, oggetti, interazioni). In battaglia la scena suona da sé, al ritmo della propria sequenza.
 */
export function HealSoundBridge() {
  useEffect(() => {
    let previous = snapshot(useGameStore.getState().giocatore1.squadra, useGameStore.getState().giocatore2.squadra)
    return useGameStore.subscribe((state) => {
      const next = snapshot(state.giocatore1.squadra, state.giocatore2.squadra)
      if (state.scenaCorrente.scena !== 'battaglia' && someoneHealed(previous, next)) playSound('heal')
      previous = next
    })
  }, [])
  return null
}
