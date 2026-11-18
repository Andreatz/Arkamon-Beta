import { describe, expect, it } from 'vitest'
import {
  applicaStato, calcolaDanno, calcolaHPMax, indiceMossaPrioritaria, mosseEsaurite,
  registraUsoMossa, rollD10, scegliMossaIA, usiMossa, èMossaEsaurita,
} from '../battleEngine'
import { getMossa, getPokemon } from '@data/index'
import type { PokemonIstanza } from '@/types'

function pokemon(specieId: number, livello: number, id = `legend-${specieId}`): PokemonIstanza {
  const instance: PokemonIstanza = { istanzaId: id, specieId, nome: getPokemon(specieId)!.nome, livello, hp: 0, xp: 0 }
  instance.hp = calcolaHPMax(instance)
  return instance
}
/** Generatore che restituisce il valore richiesto per il d10: (n - 1) / 10 + 0.05. */
const d10 = (value: number) => () => (value - 1) / 10 + 0.05

describe('legenda delle mosse del foglio', () => {
  it('assegna precisione, usi massimi e priorità alle regole giuste', () => {
    expect(getMossa(221)).toMatchObject({ regolaStato: 'metti-paralisi', precisione: 8 })
    expect(getMossa(234)).toMatchObject({ regolaStato: 'metti-sonno', precisione: 7 })
    expect(getMossa(243)).toMatchObject({ regolaStato: 'metti-veleno', precisione: 9 })
    expect(getMossa(247)).toMatchObject({ regolaStato: 'metti-confusione', precisione: 8 })
    expect(getMossa(224)).toMatchObject({ regolaStato: 'ripristina-hp', usiMassimi: 3 })
    expect(getMossa(260)).toMatchObject({ regolaStato: 'cura-paralisi', priorita: true })
    expect(getMossa(1)?.precisione).toBeUndefined()
  })

  it('tira un d10 da 1 a 10', () => {
    expect(rollD10(() => 0)).toBe(1)
    expect(rollD10(() => 0.999999)).toBe(10)
  })

  it('applica lo stato con il d10 entro la precisione e manca oltre', () => {
    const attacker = pokemon(3, 30), target = pokemon(1, 30)
    const hit = calcolaDanno(attacker, target, 2, d10(8))!
    expect(hit).toMatchObject({ tiroPrecisione: 8, mancata: false, statoApplicato: 'Paralizzato', dannoFinale: 0 })
    const miss = calcolaDanno(attacker, target, 2, d10(9))!
    expect(miss).toMatchObject({ tiroPrecisione: 9, mancata: true, statoApplicato: undefined, dannoFinale: 0 })
    expect(miss.messaggi.join(' ')).toContain('manca il bersaglio')
  })

  it('non tira la precisione per gli attacchi', () => {
    const result = calcolaDanno(pokemon(1, 10), pokemon(5, 10), 0, () => 0.5)!
    expect(result.tiroPrecisione).toBeUndefined()
  })

  it('conta gli usi per Arkamon e lotta, esaurendo Ripristina HP al terzo', () => {
    const healer = pokemon(17, 30)
    const restore = getMossa(224)!
    let uses = registraUsoMossa(undefined, healer.istanzaId, restore)
    uses = registraUsoMossa(uses, healer.istanzaId, restore)
    expect(èMossaEsaurita(restore, uses, healer.istanzaId)).toBe(false)
    uses = registraUsoMossa(uses, healer.istanzaId, restore)
    expect(usiMossa(uses, healer.istanzaId, restore.id)).toBe(3)
    expect(èMossaEsaurita(restore, uses, healer.istanzaId)).toBe(true)
    expect(èMossaEsaurita(restore, uses, 'altro-arkamon')).toBe(false)
    // Le mosse senza limite non creano contatori.
    expect(registraUsoMossa(uses, healer.istanzaId, getMossa(1)!)).toBe(uses)
    expect(mosseEsaurite(healer, uses)).toEqual(new Set([224]))
  })

  it("l'IA non sceglie una mossa esaurita", () => {
    const healer = { ...pokemon(17, 30), hp: 2 }
    const target = pokemon(1, 30)
    expect(scegliMossaIA(healer, target, () => 0.5)).toBe(2)
    expect(scegliMossaIA(healer, target, () => 0.5, new Set([224]))).not.toBe(2)
  })

  it('offre la mossa prioritaria solo a chi è paralizzato e la conosce', () => {
    const healthy = pokemon(14, 30)
    expect(indiceMossaPrioritaria(healthy)).toBeNull()
    const paralysed = applicaStato(healthy, 'Paralizzato')
    expect(indiceMossaPrioritaria(paralysed)).toBe(2)
    expect(indiceMossaPrioritaria(applicaStato(pokemon(1, 30), 'Paralizzato'))).toBeNull()
    expect(indiceMossaPrioritaria({ ...paralysed, hp: 0 })).toBeNull()
  })
})
