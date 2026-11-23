import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocalMap } from '@data/localMaps'
import { ALLENATORI } from '@data/index'
import { SECRET_LOCATION_GYM_IDS } from '@data/secretLocation'
import { calcolaHPMax } from '@engine/battleEngine'
import { creaIstanza, useGameStore } from '@store/gameStore'
import type { PosizioneAvatar, StatoBattaglia } from '@/types'

vi.hoisted(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
})

const world = (luogo: string): PosizioneAvatar => ({ mappaId: 'mappa-principale', luogo, x: 0, y: 0, direzione: 'S' })
/** La Lega di Roma (era il luogo segreto «Percorso_15»): la mappa dipinta arriverà con i riferimenti dell'utente. */
const LEGA = 'Lega_Roma'
const unlock = (id: 1 | 2, defeated = SECRET_LOCATION_GYM_IDS) => {
  const key = id === 1 ? 'giocatore1' : 'giocatore2'
  useGameStore.setState((s) => ({ [key]: { ...s[key], allenatoriSconfitti: new Set(defeated) } }))
}
const restoredSave = () => {
  const options = useGameStore.persist.getOptions()
  const saved = JSON.parse(JSON.stringify(options.partialize!(useGameStore.getState())))
  return options.merge!(saved, useGameStore.getState())
}

function ongoingBattle(luogoRitorno = 'Roma'): StatoBattaglia {
  const pokemonA = useGameStore.getState().giocatore1.squadra[0]
  const pokemonB = { ...creaIstanza(13, 60)!, hp: 3 }
  return { tipo: 'NPC', pokemonA, pokemonB, squadraA: [pokemonA], squadraB: [pokemonB],
    hpMaxA: calcolaHPMax(pokemonA), hpMaxB: calcolaHPMax(pokemonB), turnoCorrente: 'A',
    luogoRitorno, log: [], evoluzioneInAttesa: null,
    checkpoint: { version: 1, phase: 'player', initialPriority: 'A', actedThisRound: [],
      openingComplete: true, outcome: null, evolutions: [], rivalMessages: [] },
  }
}

describe('store - passaggio individuale da Roma alla Lega', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
    useGameStore.setState((s) => ({
      posizione1: world('Roma'), posizione2: world('Roma'),
      giocatore1: { ...s.giocatore1, squadra: [creaIstanza(1, 60)!] },
      giocatore2: { ...s.giocatore2, squadra: [creaIstanza(5, 60)!] },
      scenaCorrente: { scena: 'citta', payload: { luogo: 'Roma' } },
    }))
  })

  it('la Lega non ha ancora una mappa dipinta né contenuti propri', () => {
    expect(getLocalMap(LEGA)).toBeUndefined()
    expect(ALLENATORI.some((a) => a.luogo === LEGA)).toBe(false)
  })

  it('senza palestre rifiuta ingresso, API diretta e navigazione senza spostare o spendere azioni', () => {
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, LEGA)).toBe(false)
    expect(s.inizializzaPosizioneLocale(1, LEGA)).toBeNull()
    expect(s.apriMappaLocale(1, LEGA)).toBe(false)
    s.vaiAScena('percorso', { luogo: LEGA })
    expect(useGameStore.getState().scenaCorrente).toBe(s.scenaCorrente)
    expect(useGameStore.getState().posizione1).toBe(s.posizione1)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(2)
  })

  it('anche con tutti gli NPC sconfitti resta chiuso se manca l’ultimo capopalestra', () => {
    const capi = ALLENATORI.filter((a) => a.tipo === 'Capopalestra')
    const ultimo = capi[capi.length - 1]
    unlock(1, ALLENATORI.filter((a) => a.id !== ultimo.id).map((a) => a.id))
    expect(useGameStore.getState().attraversaPassaggioSegreto(1)).toBe(false)
  })

  it('lo sblocco del secondo giocatore non autorizza il primo né il movimento fuori turno', () => {
    unlock(2)
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(false)
    expect(s.attraversaPassaggioSegreto(2)).toBe(false)
    s.passaTurnoMappaLocale()
    expect(s.attraversaPassaggioSegreto(2)).toBe(true)
    expect(useGameStore.getState().posizione2.luogo).toBe(LEGA)
    expect(useGameStore.getState().posizione1.luogo).toBe('Roma')
    expect(useGameStore.getState().posizioniLocali1).toEqual({})
  })

  it('ingresso e ritorno costano un movimento ciascuno, conservano il pallino di Roma e lasciano fermo l’altro giocatore', () => {
    unlock(1)
    const romaNode = getLocalMap('Roma')!.nodes[7].id
    useGameStore.setState({ posizioniLocali1: { Roma: romaNode } })
    const other = useGameStore.getState().posizione2
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(1)
    // Senza mappa dipinta si resta sulla mappa principale, che mostra il passaggio di ritorno.
    expect(useGameStore.getState().scenaCorrente).toEqual({ scena: 'mappa-principale' })
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    expect(useGameStore.getState().posizione1.luogo).toBe('Roma')
    expect(useGameStore.getState().scenaCorrente).toEqual({ scena: 'citta', payload: { luogo: 'Roma' } })
    expect(useGameStore.getState().posizione2).toBe(other)
    expect(useGameStore.getState().posizioniLocali1).toEqual({ Roma: romaNode })
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(0)
    expect(s.attraversaPassaggioSegreto(1)).toBe(false)
  })

  it('nella Lega senza mappa l’interazione apre il luogo come attività ordinaria e chiude il turno', () => {
    unlock(1)
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    expect(s.apriMappaLocale(1, LEGA)).toBe(false)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(1)
    expect(s.interagisciLuogoMappaPrincipale(1)).toEqual({ tipo: 'luogo', luogo: LEGA })
    expect(useGameStore.getState().fallbackLocationActivity).toEqual({ playerId: 1, location: LEGA })
    expect(useGameStore.getState().posizione2.luogo).toBe('Roma')
  })

  it('fuori Roma, senza azioni o durante battaglia il passaggio non è percorribile', () => {
    unlock(1)
    const s = useGameStore.getState()
    useGameStore.setState({ posizione1: world('Venezia') })
    expect(s.attraversaPassaggioSegreto(1)).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, LEGA)).toBe(false)
    useGameStore.setState({ posizione1: world('Roma'), turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 0 } })
    expect(s.attraversaPassaggioSegreto(1)).toBe(false)
    useGameStore.setState({ turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 2 }, battaglia: ongoingBattle() })
    expect(s.attraversaPassaggioSegreto(1)).toBe(false)
  })

  it('dalla Lega si può uscire soltanto a Roma, e il ritorno non rigenera azioni', () => {
    unlock(1)
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    expect(s.muoviAvatarMappaPrincipale(1, 'Percorso_15')).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, 'Venezia')).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, 'Leggendario_Percorso_3')).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, 'Roma')).toBe(true)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(0)
    expect(s.apriMappaLocale(1, 'Roma')).toBe(true)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(0)
  })

  it('blocca apertura, attività e battaglie segrete in una posizione contraffatta prima dello sblocco', () => {
    useGameStore.setState({ posizione1: world(LEGA) })
    const s = useGameStore.getState()
    expect(s.apriMappaLocale(1, LEGA)).toBe(false)
    expect(s.inizializzaPosizioneLocale(1, LEGA)).toBeNull()
    expect(s.consumaInterazioneMappaLocale(1, LEGA)).toBe(false)
    expect(s.interagisciLuogoMappaPrincipale(1)).toEqual({ tipo: 'no-op' })
    s.segnaCespuglioVisitato(1, LEGA, 'A')
    expect(s.cespuglioVisitato(1, LEGA, 'A')).toBe(false)
    s.iniziaBattaglia(ongoingBattle(LEGA))
    expect(useGameStore.getState().battaglia).toBeNull()
    expect(s.iniziaBattagliaNPC(201, LEGA)).toBe(false)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(2)
  })

  it('ricarica lo sblocco, la posizione e il budget senza creare nuove azioni', () => {
    unlock(1)
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    const restored = restoredSave()
    expect(restored.giocatore1.allenatoriSconfitti).toEqual(new Set(SECRET_LOCATION_GYM_IDS))
    expect(restored.posizione1.luogo).toBe(LEGA)
    expect(restored.posizione2.luogo).toBe('Roma')
    expect(restored.turnoOverworld.azioniRimaste).toBe(1)
    expect(restored.scenaCorrente).toEqual({ scena: 'mappa-principale' })
  })

  it('ricaricando un salvataggio non sbloccato torna a Roma senza alterare il budget né mostrare il luogo', () => {
    useGameStore.setState({ posizione1: world(LEGA), scenaCorrente: { scena: 'percorso', payload: { luogo: LEGA } }, turnoOverworld: { giocatoreAttivo: 1, azioniRimaste: 1 } })
    const restored = restoredSave()
    expect(restored.posizione1.luogo).toBe('Roma')
    expect(restored.scenaCorrente).toEqual({ scena: 'mappa-principale' })
    expect(restored.turnoOverworld.azioniRimaste).toBe(1)
  })
})

describe('store - luoghi nascosti dei Percorsi 3, 9, 11 e 12', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
    useGameStore.setState((s) => ({
      giocatore1: { ...s.giocatore1, squadra: [creaIstanza(1, 20)!] },
      giocatore2: { ...s.giocatore2, squadra: [creaIstanza(5, 20)!] },
      scenaCorrente: { scena: 'mappa-principale' },
    }))
  })

  it.each([
    ['Percorso_3', 'Leggendario_Percorso_3'],
    ['Percorso_9', 'Nascondiglio_Team_Towers'],
    ['Percorso_11', 'Leggendario_Percorso_11'],
    ['Percorso_12', 'Leggendario_Percorso_12'],
  ])('da %s si entra in %s senza medaglie e si torna indietro, un movimento per lato', (origin, hidden) => {
    useGameStore.setState({ posizione1: world(origin), posizione2: world('Venezia') })
    const s = useGameStore.getState()
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    expect(useGameStore.getState().posizione1.luogo).toBe(hidden)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(1)
    // La rete di pallini del 23 novembre 2026 apre direttamente la mappa locale, dal Punto 1.
    expect(useGameStore.getState().scenaCorrente).toEqual({ scena: 'percorso', payload: { luogo: hidden } })
    expect(useGameStore.getState().posizioniLocali1[hidden]).toBe('n1')
    // Nessun contenuto inventato: senza allenatori né cespugli definiti.
    expect(s.muoviAvatarMappaPrincipale(1, 'Venezia')).toBe(false)
    expect(s.attraversaPassaggioSegreto(1)).toBe(true)
    expect(useGameStore.getState().posizione1.luogo).toBe(origin)
    expect(useGameStore.getState().turnoOverworld.azioniRimaste).toBe(0)
    expect(useGameStore.getState().posizione2.luogo).toBe('Venezia')
  })

  it('il passaggio di un percorso non porta ai luoghi nascosti degli altri', () => {
    useGameStore.setState({ posizione1: world('Percorso_3') })
    const s = useGameStore.getState()
    expect(s.muoviAvatarMappaPrincipale(1, 'Leggendario_Percorso_11')).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, 'Lega_Roma')).toBe(false)
    expect(s.muoviAvatarMappaPrincipale(1, 'Leggendario_Percorso_3')).toBe(true)
  })

  it('la posizione in un luogo nascosto libero sopravvive alla ricarica', () => {
    useGameStore.setState({ posizione1: world('Percorso_9') })
    expect(useGameStore.getState().attraversaPassaggioSegreto(1)).toBe(true)
    expect(restoredSave().posizione1.luogo).toBe('Nascondiglio_Team_Towers')
  })
})
