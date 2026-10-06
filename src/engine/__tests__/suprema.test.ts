import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  èMossaSuprema,
  autodannoSuprema,
  calcolaAzioneSuprema,
  calcolaDanno,
  calcolaHPMax,
  costoSuprema,
  scegliMossaIA,
} from '@engine/battleEngine'
import * as gameData from '@data/index'
import type { PokemonIstanza, MossaDef } from '@/types'

afterEach(() => vi.restoreAllMocks())

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

function mkMossa(
  effetto: string | null,
  valoreEffetto: number | null,
  tipo: MossaDef['tipo'] = 'Normale'
): MossaDef {
  return {
    id: 999,
    nome: 'Suprema Test',
    tipo,
    effetto,
    valoreEffetto,
    dadiPerLivello: { '5': 1 },
    incrementoPerLivello: { '5': 0 },
  }
}

describe('èMossaSuprema', () => {
  it('riconosce solo SUPREMA', () => {
    expect(èMossaSuprema(mkMossa('SUPREMA', 50))).toBe(true)
    expect(èMossaSuprema(mkMossa('CURA', 50))).toBe(false)
    expect(èMossaSuprema(mkMossa('VELENO', 30))).toBe(false)
    expect(èMossaSuprema(mkMossa(null, null))).toBe(false)
  })
})

describe('autodannoSuprema', () => {
  it('default 50% di hpMax se valoreEffetto è null', () => {
    const m = mkMossa('SUPREMA', null)
    expect(autodannoSuprema(m, 100)).toBe(50)
  })
  it('usa sempre il 50% degli HP massimi ignorando percentuali legacy diverse', () => {
    expect(autodannoSuprema(mkMossa('SUPREMA', 30), 100)).toBe(50)
    expect(autodannoSuprema(mkMossa('SUPREMA', 75), 80)).toBe(40)
  })
  it('arrotonda per difetto con HP massimi dispari', () => {
    expect(autodannoSuprema(mkMossa('SUPREMA', 50), 19)).toBe(9)
  })
  it('clamp min 1 anche con hpMax molto basso', () => {
    expect(autodannoSuprema(mkMossa('SUPREMA', 50), 1)).toBe(1)
  })
  it('mossa non suprema → 0', () => {
    expect(autodannoSuprema(mkMossa('CURA', 50), 100)).toBe(0)
  })
})

describe('azione Suprema esplicita con dati reali', () => {
  it('raddoppia una mossa ordinaria di Vyrath e conserva dadi, tipo e bonus', () => {
    const att = mkIstanza(1, 5)
    const dif = mkIstanza(13, 5)
    const normale = calcolaDanno(att, dif, 0, () => 0, false)!
    const suprema = calcolaAzioneSuprema(att, dif, 0, () => 0)!
    expect(normale.dannoFinale).toBe(2)
    expect(suprema.dannoFinale).toBe(4)
    expect(suprema.tiriDado).toEqual([1])
    expect(suprema.incremento).toBe(normale.incremento)
    expect(suprema.moltiplicatoreTipo).toBe(normale.moltiplicatoreTipo)
    expect(suprema.mossa).toBe(normale.mossa)
    expect(suprema.autodanno).toBe(6)
    expect(suprema.suprema).toBe(true)
    expect(normale.suprema).toBe(false)
  })

  it('raddoppia il danno normale già arrotondato contro una resistenza', () => {
    const att = mkIstanza(1, 5)
    const dif = mkIstanza(32, 5) // Brezza Profumata Erba contro Blazion Fuoco: ×0.5.
    const normale = calcolaDanno(att, dif, 1, () => 0.2, false)!
    const suprema = calcolaAzioneSuprema(att, dif, 1, () => 0.2)!
    expect(normale.dannoBase).toBe(3)
    expect(normale.moltiplicatoreTipo).toBe(0.5)
    expect(normale.dannoFinale).toBe(2)
    expect(suprema.dannoFinale).toBe(4)
  })

  it('usa gli HP massimi dispari anche se gli HP correnti non bastano al costo', () => {
    const att = mkIstanza(1, 10, 1)
    const dif = mkIstanza(13, 5)
    const suprema = calcolaAzioneSuprema(att, dif, 0, () => 0)!
    expect(calcolaHPMax(att)).toBe(19)
    expect(suprema.autodanno).toBe(9)
    // Il motore restituisce il costo; la scena applica danno e contraccolpo nell'ordine previsto.
    expect(att.hp).toBe(1)
    expect(dif.hp).toBe(12)
  })

  it('esclude le cure senza tirare dadi o cambiare il loro effetto', () => {
    const att = mkIstanza(95, 5, 4) // Assorbilinfa, CURA_PCT.
    const cura = gameData.getMossa(gameData.getPokemon(95)!.mosse[0])!
    expect(cura.effetto).toBe('CURA_PCT')
    expect(calcolaAzioneSuprema(att, mkIstanza(13, 5), 0, () => {
      throw new Error('Una cura non deve tirare dadi per la Suprema')
    })).toBeNull()
    expect(cura.effetto).toBe('CURA_PCT')
    expect(att.hp).toBe(4)
  })

  it('preserva lo status di una mossa offensiva senza modificare i dati', () => {
    const att = mkIstanza(47, 5) // Predigestione applica veleno.
    const dif = mkIstanza(13, 5)
    const normale = calcolaDanno(att, dif, 0, () => 0, false)!
    const suprema = calcolaAzioneSuprema(att, dif, 0, () => 0)!
    expect(normale.statoApplicato).toBe('Avvelenato')
    expect(suprema.statoApplicato).toBe(normale.statoApplicato)
    expect(suprema.mossa.effetto).toBe('VELENO')
    expect(suprema.dannoFinale).toBe(normale.dannoFinale * 2)
    expect(dif.stato).toBeUndefined()
  })

  it('rifiuta uno slot vuoto o una specie mancante', () => {
    expect(calcolaAzioneSuprema(mkIstanza(1, 5), mkIstanza(13, 5), 2)).toBeNull()
    expect(calcolaAzioneSuprema(mkIstanza(999, 5), mkIstanza(13, 5), 0)).toBeNull()
  })
})

describe('costoSuprema per la UI', () => {
  it('restituisce lo stesso costo fisso per HP massimi pari, dispari e minimi', () => {
    expect(costoSuprema(12)).toBe(6)
    expect(costoSuprema(19)).toBe(9)
    expect(costoSuprema(1)).toBe(1)
  })
})

describe('compatibilità delle mosse legacy SUPREMA', () => {
  it.each([107, 110])('potenzia una sola volta la specie %i anche con attivazione esplicita', (id) => {
    const att = mkIstanza(id, 5)
    const dif = mkIstanza(1, 5)
    const normale = calcolaDanno(att, dif, 0, () => 0, false)!
    const legacy = calcolaDanno(att, dif, 0, () => 0)!
    const esplicita = calcolaAzioneSuprema(att, dif, 0, () => 0)!
    expect(normale.dannoFinale).toBe(2)
    expect(legacy.dannoFinale).toBe(4)
    expect(esplicita.dannoFinale).toBe(4)
    expect(legacy.autodanno).toBe(6)
    expect(esplicita.autodanno).toBe(6)
    expect(normale.autodanno).toBe(0)
    expect(normale.suprema).toBe(false)
    expect(normale.messaggi).not.toContain('💥 MOSSA SUPREMA! 💥')
  })

  it('raddoppia anche il minimo di 1 di Cannone Infernale senza ×4', () => {
    const att = mkIstanza(81, 5)
    const dif = mkIstanza(13, 5)
    const normale = calcolaDanno(att, dif, 1, () => 0, false)!
    expect(normale.numDadi).toBe(0)
    expect(normale.dannoFinale).toBe(1)
    expect(normale.autodanno).toBe(0)
    expect(calcolaDanno(att, dif, 1, () => 0)?.dannoFinale).toBe(2)
    expect(calcolaAzioneSuprema(att, dif, 1, () => 0)?.dannoFinale).toBe(2)
  })
})

describe('scegliMossaIA — euristica Suprema', () => {
  it('sceglie la Suprema di Ao-shin a HP pieni e la evita con HP insufficienti', () => {
    const dif = mkIstanza(1, 5)
    expect(scegliMossaIA(mkIstanza(107, 5), dif, () => 0)).toBe(0)
    expect(scegliMossaIA(mkIstanza(107, 5, 5), dif, () => 0)).toBe(1)
  })

  it.each([
    { valoreLegacy: 30, hp: 5, mossaAttesa: 1 },
    { valoreLegacy: 75, hp: 8, mossaAttesa: 0 },
  ])('valuta il costo fisso50 anche se il dato legacy vale $valoreLegacy', ({ valoreLegacy, hp, mossaAttesa }) => {
    const getMossaOriginale = gameData.getMossa
    vi.spyOn(gameData, 'getMossa').mockImplementation((id) => {
      const mossa = getMossaOriginale(id)
      return mossa?.effetto === 'SUPREMA' ? { ...mossa, valoreEffetto: valoreLegacy } : mossa
    })
    expect(scegliMossaIA(mkIstanza(107, 5, hp), mkIstanza(1, 5), () => 0)).toBe(mossaAttesa)
  })
})
