import { describe, expect, it } from 'vitest'
import {
  applicaMossaCura, applicaStato, calcolaAzioneSuprema, calcolaDanno, calcolaHPMax,
  mossaUtilizzabile, risolviStatoInizioTurno, scegliMossaIA,
} from '../battleEngine'
import { resolveBattleAttack } from '../battleResolution'
import { getMossa, getPokemon } from '@data/index'
import type { PokemonIstanza } from '@/types'

function pokemon(specieId: number, livello: number, hp?: number): PokemonIstanza {
  const instance: PokemonIstanza = { istanzaId: `status-${specieId}`, specieId, nome: getPokemon(specieId)!.nome, livello, hp: 0, xp: 0 }
  instance.hp = hp ?? calcolaHPMax(instance)
  return instance
}

describe('mosse di status del foglio Mosse', () => {
  it('applica la paralisi con precisione 80%, senza dadi di danno o Suprema', () => {
    const attacker = pokemon(27, 26)
    const target = pokemon(1, 10)
    const result = calcolaDanno(attacker, target, 2, () => .79)!
    expect(result).toMatchObject({
      numDadi: 0, incremento: 0, tiriDado: [], dannoBase: 0, dannoFinale: 0,
      autodanno: 0, suprema: false, statoApplicato: 'Paralizzato', difensoreSvenuto: false,
    })
    expect(calcolaDanno(attacker, target, 2, () => .80)?.statoApplicato).toBeUndefined()
    expect(calcolaAzioneSuprema(attacker, target, 2)).toBeNull()
  })

  it('non sovrascrive uno status o una protezione attiva e non colpisce un bersaglio KO', () => {
    const attacker = pokemon(27, 26), target = pokemon(1, 10)
    const neverRoll = () => { throw new Error('Il bersaglio non è idoneo al tiro') }
    for (const blocked of [applicaStato(target, 'Confuso'), { ...target, immunitaStatus: 2 }, { ...target, hp: 0 }]) {
      expect(calcolaDanno(attacker, blocked, 2, neverRoll)?.statoApplicato).toBeUndefined()
      expect(scegliMossaIA(attacker, blocked, () => .9)).not.toBe(2)
    }
  })

  it('rispetta il livello di sblocco e applica il danno fisso anche quando il bersaglio ha un altro tipo', () => {
    const target = pokemon(1, 10)
    expect(calcolaDanno(pokemon(21, 21), target, 2, () => 0)).toBeNull()
    expect(calcolaDanno(pokemon(21, 22), target, 2, () => 0)?.statoApplicato).toBe('Paralizzato')
    const attacker = pokemon(115, 26)
    expect(calcolaDanno(attacker, target, 2, () => { throw new Error('Danno fisso con tiro') })).toMatchObject({
      numDadi: 0, dannoBase: 10, dannoFinale: 10, moltiplicatoreTipo: 1,
    })
  })

  it('conserva la regola del veleno applicato e la durata delle immunità', () => {
    const attacker = pokemon(22, 22), target = pokemon(1, 60)
    const result = calcolaDanno(attacker, target, 2, () => 0)!
    expect(result.statoApplicato).toBe('Avvelenato')
    const poisoned = resolveBattleAttack(result, 'A', [attacker], [target]).defender
    expect(poisoned.stato).toMatchObject({ tipo: 'Avvelenato', regola: 'database' })
    const tick = risolviStatoInizioTurno(poisoned, 80)
    expect(tick.dannoSubito).toBe(10)
    expect(risolviStatoInizioTurno(tick.istanza, 80).dannoSubito).toBe(10)
    const protection = applicaMossaCura(poisoned, getMossa(273)!, 80).istanza
    expect(protection.stato).toBeUndefined()
    expect(protection.immunitaStatus).toBe(5)
    expect(risolviStatoInizioTurno(protection, 80).istanza.immunitaStatus).toBe(4)
  })

  it('usa tre turni di confusione e il 75% di risveglio al terzo turno', () => {
    const base = pokemon(1, 60)
    const confused = applicaStato(base, 'Confuso', 'database')
    expect(confused.stato?.turniRimanenti).toBe(3)
    expect(risolviStatoInizioTurno(confused, 80, () => .1).dannoSubito).toBe(10)
    const sleep = applicaStato(base, 'Addormentato', 'database')
    const first = risolviStatoInizioTurno(sleep, 80, () => .60)
    const second = risolviStatoInizioTurno(first.istanza, 80, () => .40)
    expect(first.puoAgire).toBe(false)
    expect(second.puoAgire).toBe(false)
    expect(risolviStatoInizioTurno(second.istanza, 80, () => .74).puoAgire).toBe(true)
    expect(risolviStatoInizioTurno(second.istanza, 80, () => .75).puoAgire).toBe(false)
  })

  it('cura solo le condizioni indicate e conta gli utilizzi per lotta', () => {
    const state = applicaStato(pokemon(91, 60, 20), 'Avvelenato')
    const antidote = getMossa(231)!
    expect(applicaMossaCura(state, antidote, 80)).toMatchObject({ hpRecuperato: 20, istanza: { hp: 40, stato: undefined } })
    const hp = getMossa(470)!
    let user = { ...pokemon(119, 25, 20), cureLimitateUsate: 0 } as PokemonIstanza
    for (let i = 0; i < 3; i++) user = applicaMossaCura({ ...user, hp: 20 }, hp, 80).istanza
    expect(user.cureLimitateUsate).toBe(3)
    expect(mossaUtilizzabile(user, hp)).toBe(false)
    expect(applicaMossaCura({ ...user, hp: 20 }, hp, 80).hpRecuperato).toBe(0)
  })
})
