import { describe, it, expect } from 'vitest'
import {
  applicaStato,
  risolviStatoInizioTurno,
  calcolaHPMax,
  DURATA_STATO,
  tentaApplicaStato,
  percentualeProssimoTickVeleno,
} from '@engine/battleEngine'
import type { PokemonIstanza, Stato } from '@/types'

function mkIstanza(specieId: number, livello: number, hp?: number): PokemonIstanza {
  const istanza: PokemonIstanza = {
    istanzaId: `test-${specieId}-${livello}`,
    specieId,
    nome: 'Test',
    livello,
    hp: 0,
    xp: 0,
  }
  istanza.hp = hp ?? calcolaHPMax(istanza)
  return istanza
}

describe('applicaStato', () => {
  it('Confuso → durata 2 turni', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Confuso')
    expect(i.stato?.tipo).toBe('Confuso')
    expect(i.stato?.turniRimanenti).toBe(2)
  })
  it('Addormentato → durata 3 turni', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Addormentato')
    expect(i.stato?.turniRimanenti).toBe(3)
  })
  it('Avvelenato → durata indefinita (-1)', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Avvelenato')
    expect(i.stato?.turniRimanenti).toBe(-1)
    expect(DURATA_STATO.Avvelenato).toBe(-1)
    expect(i.stato?.turniTrascorsi).toBe(0)
  })
  it('un nuovo stato azzera la progressione precedente del veleno', () => {
    const avvelenato = {
      ...mkIstanza(1, 10),
      stato: { tipo: 'Avvelenato' as const, turniRimanenti: -1, turniTrascorsi: 3 },
    }
    expect(applicaStato(avvelenato, 'Avvelenato').stato?.turniTrascorsi).toBe(0)
    expect(applicaStato(avvelenato, 'Addormentato').stato?.turniTrascorsi).toBeUndefined()
    expect(avvelenato.stato.turniTrascorsi).toBe(3)
  })
})

describe('tentaApplicaStato — immunità stato singolo (BR.3)', () => {
  it('pokemon senza stato → applicato=true', () => {
    const i = mkIstanza(1, 5)
    expect(tentaApplicaStato(i, 'Confuso').applicato).toBe(true)
  })
  it('pokemon già Confuso → tenta Addormentato: applicato=false + messaggio', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Confuso')
    const r = tentaApplicaStato(i, 'Addormentato')
    expect(r.applicato).toBe(false)
    expect(r.messaggio).toBeTruthy()
  })
  it('pokemon già Addormentato → tenta Confuso: applicato=false', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Addormentato')
    expect(tentaApplicaStato(i, 'Confuso').applicato).toBe(false)
  })
  it('pokemon già Avvelenato → tenta stesso stato: applicato=false', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Avvelenato')
    expect(tentaApplicaStato(i, 'Avvelenato').applicato).toBe(false)
  })
})

describe('risolviStatoInizioTurno - nessuno stato', () => {
  it('puoAgire=true, niente messaggi, niente danno', () => {
    const i = mkIstanza(1, 50) // hp 79 max (Media: 12 + trunc(45*1.5)=79)
    const r = risolviStatoInizioTurno(i, calcolaHPMax(i))
    expect(r.puoAgire).toBe(true)
    expect(r.dannoSubito).toBe(0)
    expect(r.messaggi).toHaveLength(0)
    expect(r.istanza).toEqual(i)
  })
})

describe('risolviStatoInizioTurno - Avvelenato', () => {
  it('espone alla UI la percentuale successiva anche nei vecchi salvataggi', () => {
    expect(percentualeProssimoTickVeleno({ tipo: 'Avvelenato', turniRimanenti: -1 })).toBe(10)
    expect(percentualeProssimoTickVeleno({ tipo: 'Avvelenato', turniRimanenti: -1, turniTrascorsi: 2 })).toBe(30)
  })
  it('normalizza contatori salvati non validi e tronca i valori frazionari', () => {
    for (const contatore of [-1, Number.NaN, Number.POSITIVE_INFINITY, '2', null]) {
      const stato = { tipo: 'Avvelenato', turniRimanenti: -1, turniTrascorsi: contatore } as unknown as Stato
      expect(percentualeProssimoTickVeleno(stato)).toBe(10)
    }
    expect(percentualeProssimoTickVeleno({ tipo: 'Avvelenato', turniRimanenti: -1, turniTrascorsi: 1.9 })).toBe(20)
  })
  it('subisce 10% di hpMax (min 1), stato persiste', () => {
    const base = mkIstanza(1, 50) // hpMax 79, hp 79
    const i = applicaStato(base, 'Avvelenato')
    const hpMax = calcolaHPMax(base)
    const r = risolviStatoInizioTurno(i, hpMax)
    expect(r.dannoSubito).toBe(Math.floor(hpMax * 0.1)) // 7
    expect(r.istanza.hp).toBe(hpMax - 7)
    expect(r.istanza.stato?.tipo).toBe('Avvelenato')
    expect(r.puoAgire).toBe(true) // veleno NON salta turno
  })
  it('hpMax basso → almeno 1 danno (clamp)', () => {
    const base = mkIstanza(1, 5, 12) // hpMax 12 → 10% = 1.2 → trunc 1
    const i = applicaStato(base, 'Avvelenato')
    const r = risolviStatoInizioTurno(i, 12)
    expect(r.dannoSubito).toBeGreaterThanOrEqual(1)
  })
  it('applica il 10%, 20% e 30% degli HP massimi, non di quelli correnti', () => {
    const iniziale = applicaStato({ ...mkIstanza(1, 5), hp: 100 }, 'Avvelenato')
    let corrente = iniziale
    const danni: number[] = []
    const hp: number[] = []
    for (let turno = 1; turno <= 3; turno++) {
      const risultato = risolviStatoInizioTurno(corrente, 100)
      danni.push(risultato.dannoSubito)
      hp.push(risultato.istanza.hp)
      expect(risultato.istanza.stato?.turniTrascorsi).toBe(turno)
      expect(risultato.istanza.stato?.turniRimanenti).toBe(-1)
      expect(risultato.tiroStato).toBeUndefined()
      corrente = risultato.istanza
    }
    expect(danni).toEqual([10, 20, 30])
    expect(hp).toEqual([90, 70, 40])
    expect(iniziale.hp).toBe(100)
    expect(iniziale.stato?.turniTrascorsi).toBe(0)
  })
  it('arrotonda ogni percentuale per difetto con HP massimi dispari', () => {
    let corrente = applicaStato(mkIstanza(1, 10), 'Avvelenato')
    expect(calcolaHPMax(corrente)).toBe(19)
    const danni: number[] = []
    for (let turno = 0; turno < 3; turno++) {
      const risultato = risolviStatoInizioTurno(corrente, 19)
      danni.push(risultato.dannoSubito)
      corrente = risultato.istanza
    }
    expect(danni).toEqual([1, 3, 5])
    expect(corrente.hp).toBe(10)
  })
  it('riprende il contatore serializzato dal tick successivo', () => {
    const primo = risolviStatoInizioTurno(applicaStato(mkIstanza(1, 10), 'Avvelenato'), 19)
    const secondo = risolviStatoInizioTurno(primo.istanza, 19)
    const ripristinato = JSON.parse(JSON.stringify(secondo.istanza)) as PokemonIstanza
    expect(ripristinato.stato?.turniTrascorsi).toBe(2)
    const terzo = risolviStatoInizioTurno(ripristinato, 19)
    expect(terzo.dannoSubito).toBe(5)
    expect(terzo.istanza.hp).toBe(10)
    expect(terzo.istanza.stato?.turniTrascorsi).toBe(3)
  })
  it('tratta un vecchio salvataggio senza contatore come primo tick', () => {
    const vecchio: PokemonIstanza = {
      ...mkIstanza(1, 10), stato: { tipo: 'Avvelenato', turniRimanenti: -1 },
    }
    const risultato = risolviStatoInizioTurno(vecchio, 19)
    expect(risultato.dannoSubito).toBe(1)
    expect(risultato.istanza.stato?.turniTrascorsi).toBe(1)
    expect(vecchio.stato?.turniTrascorsi).toBeUndefined()
  })
  it('il tick che causa KO consuma il contatore una sola volta e non produce danni successivi', () => {
    const iniziale: PokemonIstanza = {
      ...mkIstanza(1, 10, 2),
      stato: { tipo: 'Avvelenato', turniRimanenti: -1, turniTrascorsi: 1 },
    }
    const ko = risolviStatoInizioTurno(iniziale, 19)
    expect(ko.dannoSubito).toBe(3)
    expect(ko.istanza.hp).toBe(0)
    expect(ko.puoAgire).toBe(false)
    expect(ko.istanza.stato?.turniTrascorsi).toBe(2)
    const dopoKo = risolviStatoInizioTurno(ko.istanza, 19, () => {
      throw new Error('Un Pokémon KO non tira dadi')
    })
    expect(dopoKo.istanza).toBe(ko.istanza)
    expect(dopoKo.dannoSubito).toBe(0)
    expect(dopoKo.istanza.stato?.turniTrascorsi).toBe(2)
    expect(iniziale.hp).toBe(2)
    expect(iniziale.stato?.turniTrascorsi).toBe(1)
  })
})

describe('risolviStatoInizioTurno - Addormentato', () => {
  it('solo le facce 4, 5 e 6 svegliano: tre esiti su sei, 50%', () => {
    for (let faccia = 1; faccia <= 6; faccia++) {
      const risultato = risolviStatoInizioTurno(
        applicaStato(mkIstanza(1, 5), 'Addormentato'), 12, () => (faccia - 0.5) / 6,
      )
      expect(risultato.tiroStato).toBe(faccia)
      expect(risultato.puoAgire).toBe(faccia >= 4)
      expect(risultato.istanza.stato === undefined).toBe(faccia >= 4)
    }
  })
  it('salta al massimo tre turni falliti e al quarto agisce senza un altro tiro', () => {
    let corrente = applicaStato(mkIstanza(1, 5), 'Addormentato')
    for (let tentativo = 1; tentativo <= 3; tentativo++) {
      const risultato = risolviStatoInizioTurno(corrente, 12, () => 0)
      expect(risultato.tiroStato).toBe(1)
      expect(risultato.puoAgire).toBe(false)
      expect(risultato.istanza.stato?.turniRimanenti).toBe(tentativo < 3 ? 3 - tentativo : undefined)
      if (tentativo === 3) expect(risultato.messaggi.some((messaggio) => messaggio.includes('agirà al prossimo turno'))).toBe(true)
      corrente = risultato.istanza
    }
    const quarto = risolviStatoInizioTurno(corrente, 12, () => {
      throw new Error('Il sonno già terminato non richiede un quarto tiro')
    })
    expect(quarto.puoAgire).toBe(true)
    expect(quarto.tiroStato).toBeUndefined()
    expect(quarto.istanza.stato).toBeUndefined()
  })
  it('dado 4-6 → svegliato (stato pulito), puoAgire=true', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Addormentato')
    const r = risolviStatoInizioTurno(i, 12, () => 0.8)
    expect(r.istanza.stato).toBeUndefined()
    expect(r.puoAgire).toBe(true)
  })
  it('dado 1-3 → resta addormentato, turno saltato, durata -1', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Addormentato') // dur 3
    const r = risolviStatoInizioTurno(i, 12, () => 0.2)
    expect(r.puoAgire).toBe(false)
    expect(r.istanza.stato?.turniRimanenti).toBe(2)
  })
  it('durata 1 + dado 1-3 → cleared dopo turno saltato', () => {
    const base = mkIstanza(1, 5)
    const i: PokemonIstanza = {
      ...base,
      stato: { tipo: 'Addormentato', turniRimanenti: 1 },
    }
    const r = risolviStatoInizioTurno(i, 12, () => 0.2)
    expect(r.puoAgire).toBe(false)
    expect(r.istanza.stato).toBeUndefined()
  })
})

describe('risolviStatoInizioTurno - Confuso', () => {
  it('rng < 0.5 → self-hit (1d6 danno), turno perso, durata -1', () => {
    const base = mkIstanza(1, 5) // hpMax 12
    const i = applicaStato(base, 'Confuso') // dur 2
    // rng=0 → primo Math.random < 0.5 (self-hit), poi rollD6(1) con rng=0 → 1
    const r = risolviStatoInizioTurno(i, 12, () => 0)
    expect(r.puoAgire).toBe(false)
    expect(r.dannoSubito).toBeGreaterThanOrEqual(1)
    expect(r.dannoSubito).toBeLessThanOrEqual(6)
    expect(r.istanza.hp).toBe(12 - r.dannoSubito)
    expect(r.istanza.stato?.turniRimanenti).toBe(1)
  })
  it('rng >= 0.5 → agisce normalmente, durata -1', () => {
    const i = applicaStato(mkIstanza(1, 5), 'Confuso') // dur 2
    const r = risolviStatoInizioTurno(i, 12, () => 0.7)
    expect(r.puoAgire).toBe(true)
    expect(r.dannoSubito).toBe(0)
    expect(r.istanza.stato?.turniRimanenti).toBe(1)
  })
  it('durata 1 → cleared dopo questo turno', () => {
    const base = mkIstanza(1, 5)
    const i: PokemonIstanza = {
      ...base,
      stato: { tipo: 'Confuso', turniRimanenti: 1 },
    }
    const r = risolviStatoInizioTurno(i, 12, () => 0.7) // no self-hit
    expect(r.istanza.stato).toBeUndefined()
  })
})
