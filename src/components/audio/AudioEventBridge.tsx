import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getAllenatore } from '@data/index'
import { playSfx, type SfxId } from '@/utils/soundManager'
import type { PokemonIstanza, StatoGiocatore } from '@/types'

type HpSnapshot = Map<string, number>

function hpOf(...squads: readonly (readonly PokemonIstanza[])[]): HpSnapshot {
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

/** Ciò che serve per confrontare due istantanee della partita. */
export interface AudioSnapshot {
  scena: string
  turno: 1 | 2
  luogo1?: string
  luogo2?: string
  locali1: Record<string, string>
  locali2: Record<string, string>
  hp: HpSnapshot
  players: [Pick<StatoGiocatore, 'monete' | 'inventario' | 'allenatoriSconfitti'>, Pick<StatoGiocatore, 'monete' | 'inventario' | 'allenatoriSconfitti'>]
}

type StoreLike = ReturnType<typeof useGameStore.getState>

export function audioSnapshot(state: StoreLike): AudioSnapshot {
  return {
    scena: state.scenaCorrente.scena,
    turno: state.turnoOverworld.giocatoreAttivo,
    luogo1: state.posizione1.luogo,
    luogo2: state.posizione2.luogo,
    locali1: state.posizioniLocali1,
    locali2: state.posizioniLocali2,
    hp: hpOf(state.giocatore1.squadra, state.giocatore2.squadra),
    players: [state.giocatore1, state.giocatore2],
  }
}

function itemCount(inventory: Partial<Record<string, number>>): number {
  let total = 0
  for (const value of Object.values(inventory)) total += value ?? 0
  return total
}

/**
 * Suoni della partita fuori dalla battaglia, ricavati confrontando due istantanee dello stato:
 * viaggi, passi, cambi di turno, acquisti, monete, oggetti, cure e medaglie.
 * In battaglia (e nel passaggio che la chiude) suona solo la scena.
 */
export function storeSfx(before: AudioSnapshot, after: AudioSnapshot, isGymLeader: (id: number) => boolean): SfxId[] {
  const out: SfxId[] = []
  if (after.scena === 'battaglia') return out
  const leavingBattle = before.scena === 'battaglia'

  // Medaglie: un Capopalestra appena sconfitto.
  for (const index of [0, 1] as const) {
    const was = before.players[index].allenatoriSconfitti
    for (const id of after.players[index].allenatoriSconfitti) {
      if (!was.has(id) && isGymLeader(id)) { out.push('jingle.medal'); break }
    }
  }
  if (leavingBattle) return out

  if (after.turno !== before.turno) out.push('map.turn')
  if (after.luogo1 !== before.luogo1 || after.luogo2 !== before.luogo2) out.push('map.travel')
  else if (after.locali1 !== before.locali1 || after.locali2 !== before.locali2) {
    const moved = (a: Record<string, string>, b: Record<string, string>) => Object.keys(b).some((key) => a[key] !== undefined && a[key] !== b[key])
    if (moved(before.locali1, after.locali1) || moved(before.locali2, after.locali2)) out.push('map.step')
  }

  for (const index of [0, 1] as const) {
    const b = before.players[index], a = after.players[index]
    const coinsDelta = a.monete - b.monete
    const itemsDelta = itemCount(a.inventario) - itemCount(b.inventario)
    if (coinsDelta < 0 && itemsDelta > 0) out.push('ui.purchase')
    else if (itemsDelta > 0) out.push('jingle.item')
    else if (coinsDelta > 0) out.push('ui.coins')
  }

  if (someoneHealed(before.hp, after.hp)) out.push('battle.heal')
  return [...new Set(out)]
}

/** Ascolta lo store e suona i momenti della mappa. Sostituisce il vecchio `HealSoundBridge`. */
export function AudioEventBridge() {
  useEffect(() => {
    let previous = audioSnapshot(useGameStore.getState())
    let campaign = useGameStore.getState().campaignRevision
    const isGymLeader = (id: number) => getAllenatore(id)?.tipo === 'Capopalestra'
    return useGameStore.subscribe((state) => {
      const next = audioSnapshot(state)
      // Un salvataggio caricato o una nuova partita non sono eventi da sentire.
      if (state.campaignRevision !== campaign) { campaign = state.campaignRevision; previous = next; return }
      const cues = storeSfx(previous, next, isGymLeader)
      previous = next
      for (const id of cues) playSfx(id, id === 'jingle.medal' ? { delayMs: 700 } : {})
    })
  }, [])
  return null
}
