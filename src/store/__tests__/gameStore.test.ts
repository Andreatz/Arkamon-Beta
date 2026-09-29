import { beforeEach, describe, expect, it } from 'vitest'
import { ALLENATORI } from '@data/index'
import { calcolaHPMax } from '@engine/battleEngine'
import { haSpazioPokemon, useGameStore } from '@store/gameStore'
import type { PokemonIstanza } from '@/types'

function pokemon(id: string, hp = 4): PokemonIstanza {
  return {
    istanzaId: id,
    specieId: 1,
    nome: id,
    livello: 5,
    hp,
    xp: 0,
  }
}

function depositoPieno(): Record<string, PokemonIstanza> {
  const deposito: Record<string, PokemonIstanza> = {}
  for (let box = 1; box <= 30; box++) {
    for (let slot = 1; slot <= 35; slot++) {
      deposito[`${box}:${slot}`] = pokemon(`deposito-${box}-${slot}`)
    }
  }
  return deposito
}

describe('gameStore - invarianti squadra e deposito', () => {
  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('non sovrascrive il deposito quando tutti gli slot sono pieni', () => {
    const deposito = depositoPieno()
    const originale = deposito['1:1']
    useGameStore.setState((s) => ({
      giocatore1: {
        ...s.giocatore1,
        squadra: Array.from({ length: 6 }, (_, i) => pokemon(`squadra-${i}`)),
        deposito,
      },
    }))

    useGameStore.getState().aggiungiPokemon(1, pokemon('nuovo'))

    const giocatore = useGameStore.getState().giocatore1
    expect(haSpazioPokemon(giocatore)).toBe(false)
    expect(Object.keys(giocatore.deposito)).toHaveLength(1050)
    expect(giocatore.deposito['1:1']).toBe(originale)
  })

  it('termina la battaglia conservando gli HP e pulendo gli stati alterati', () => {
    useGameStore.setState((s) => ({
      giocatore1: {
        ...s.giocatore1,
        squadra: [{ ...pokemon('squadra'), stato: { tipo: 'Avvelenato', turniRimanenti: -1 } }],
        deposito: {
          '1:1': { ...pokemon('deposito'), stato: { tipo: 'Confuso', turniRimanenti: 1 } },
        },
      },
    }))

    useGameStore.getState().terminaBattaglia(false)

    const giocatore = useGameStore.getState().giocatore1
    expect(giocatore.squadra[0].hp).toBe(4)
    expect(giocatore.squadra[0].stato).toBeUndefined()
    expect(giocatore.deposito['1:1'].hp).toBe(4)
    expect(giocatore.deposito['1:1'].stato).toBeUndefined()
  })

  it('il Centro Pokemon cura gli HP e pulisce lo stato alterato', () => {
    const ferito = { ...pokemon('ferito', 1), stato: { tipo: 'Avvelenato' as const, turniRimanenti: -1 } }
    useGameStore.setState((s) => ({
      giocatore1: { ...s.giocatore1, squadra: [ferito] },
    }))

    useGameStore.getState().curaSquadra(1)

    const curato = useGameStore.getState().giocatore1.squadra[0]
    expect(curato.hp).toBe(calcolaHPMax(curato))
    expect(curato.stato).toBeUndefined()
  })

  it('non avvia una battaglia NPC se tutta la squadra e KO', () => {
    const allenatore = ALLENATORI[0]
    expect(allenatore).toBeDefined()
    useGameStore.setState((s) => ({
      giocatore1: { ...s.giocatore1, squadra: [pokemon('ko', 0)] },
      giocatoreAttivo: 1,
    }))

    expect(useGameStore.getState().iniziaBattagliaNPC(allenatore.id, allenatore.luogo)).toBe(false)
  })
})
