import { describe, expect, it } from 'vitest'
import { applicaFusioniAxolux, AXOLUX_ID, FUSIONI_AXOLUX, trasformaInLuce } from '../fusion'
import { calcolaHPMax } from '../battleEngine'
import { getPokemon } from '@data/index'
import { emptyPlayer } from '@/save/gamePersistence'
import type { PokemonIstanza } from '@/types'

function pokemon(specieId: number, livello: number, id: string, hpRatio = 1): PokemonIstanza {
  const p: PokemonIstanza = { istanzaId: id, specieId, nome: getPokemon(specieId)!.nome, livello, hp: 0, xp: 0 }
  p.hp = Math.round(calcolaHPMax(p) * hpRatio)
  return p
}

describe('fusione di Axolux', () => {
  it('riconosce le otto forme «(luce)» e tutti gli stadi compatibili', () => {
    expect(new Set(FUSIONI_AXOLUX.values())).toEqual(new Set([131, 132, 133, 134, 135, 136, 137, 138]))
    expect(FUSIONI_AXOLUX.get(128)).toBe(131)
    expect(FUSIONI_AXOLUX.get(129)).toBe(131)
    expect(FUSIONI_AXOLUX.get(26)).toBe(132)
    expect(FUSIONI_AXOLUX.has(AXOLUX_ID)).toBe(false)
    expect(FUSIONI_AXOLUX.has(131)).toBe(false)
  })

  it('trasforma il compatibile mantenendo livello e proporzione di HP', () => {
    const dopo = trasformaInLuce(pokemon(128, 40, 'nyx', 0.5))
    expect(dopo).toMatchObject({ istanzaId: 'nyx', specieId: 131, nome: 'Nyxclaw (luce)', livello: 40 })
    expect(dopo.hp).toBe(Math.round(calcolaHPMax(dopo) * 0.5))
  })

  it('fonde Axolux con un compatibile del deposito e lo toglie', () => {
    const player = { ...emptyPlayer(1), squadra: [pokemon(1, 40, 'starter'), pokemon(AXOLUX_ID, 45, 'axo')], deposito: { '1:1': pokemon(26, 40, 'amp') } }
    const result = applicaFusioniAxolux(player, () => 0)
    expect(result.fusioni).toHaveLength(1)
    expect(result.giocatore.squadra.map(p => p.istanzaId)).toEqual(['starter'])
    expect(result.giocatore.deposito['1:1']).toMatchObject({ istanzaId: 'amp', specieId: 132 })
  })

  it('sceglie a caso fra più compatibili', () => {
    const player = { ...emptyPlayer(1), squadra: [pokemon(128, 40, 'nyx'), pokemon(32, 40, 'blaz'), pokemon(AXOLUX_ID, 45, 'axo')] }
    expect(applicaFusioniAxolux(player, () => 0).fusioni[0].prima.istanzaId).toBe('nyx')
    expect(applicaFusioniAxolux(player, () => 0.99).fusioni[0].prima.istanzaId).toBe('blaz')
  })

  it('aspetta se non ci sono compatibili', () => {
    const player = { ...emptyPlayer(1), squadra: [pokemon(1, 40, 'starter'), pokemon(AXOLUX_ID, 45, 'axo')] }
    const result = applicaFusioniAxolux(player)
    expect(result.fusioni).toHaveLength(0)
    expect(result.giocatore).toBe(player)
  })

  it('non svuota la squadra quando Axolux era l\'unico in squadra', () => {
    const player = { ...emptyPlayer(1), squadra: [pokemon(AXOLUX_ID, 45, 'axo')], deposito: { '2:3': pokemon(62, 44, 'fluff') } }
    const result = applicaFusioniAxolux(player, () => 0)
    expect(result.giocatore.squadra).toEqual([expect.objectContaining({ istanzaId: 'fluff', specieId: 138 })])
    expect(result.giocatore.deposito).toEqual({})
  })

  it('esclude chi ha un\'evoluzione in attesa', () => {
    const player = { ...emptyPlayer(1), squadra: [pokemon(128, 26, 'nyx'), pokemon(AXOLUX_ID, 45, 'axo')] }
    expect(applicaFusioniAxolux(player, () => 0, new Set(['nyx'])).fusioni).toHaveLength(0)
  })

  it('fonde due Axolux con due compatibili diversi', () => {
    const player = { ...emptyPlayer(1), squadra: [pokemon(128, 40, 'nyx'), pokemon(26, 40, 'amp'), pokemon(AXOLUX_ID, 45, 'axo1'), pokemon(AXOLUX_ID, 45, 'axo2')] }
    const result = applicaFusioniAxolux(player, () => 0)
    expect(result.fusioni.map(f => f.dopo.specieId).sort()).toEqual([131, 132])
    expect(result.giocatore.squadra.map(p => p.specieId).sort()).toEqual([131, 132])
  })
})
