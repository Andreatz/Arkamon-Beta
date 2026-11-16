import { describe, it, expect } from 'vitest'
import {
  calcolaHPMax,
  calcolaDanno,
  determinaIniziativa,
  rollD6,
  roundHalfUp,
  tentaCattura,
  tentaCatturaConSfera,
  applicaXP,
  xpGuadagnato,
  xpRichiestoPerLivello,
  esitoSquadre,
} from '@engine/battleEngine'
import { efficaciaTipo } from '@data/index'
import type { PokemonIstanza } from '@/types'

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

describe('rollD6', () => {
  it('2 dadi minimi (rng=0) === 2', () => {
    expect(rollD6(2, () => 0)).toBe(2)
  })
  it('2 dadi massimi (rng=0.99) === 12', () => {
    expect(rollD6(2, () => 0.99)).toBe(12)
  })
})

describe('roundHalfUp', () => {
  it('1.5 → 2', () => expect(roundHalfUp(1.5)).toBe(2))
  it('2.4 → 2', () => expect(roundHalfUp(2.4)).toBe(2))
  it('-1.5 → -2', () => expect(roundHalfUp(-1.5)).toBe(-2))
})

describe('calcolaHPMax', () => {
  it('Vyrath (Media) lvl 5 → 12', () => {
    expect(calcolaHPMax(mkIstanza(1, 5))).toBe(12)
  })
  it('Vyrath (Media) lvl 10 → 19', () => {
    expect(calcolaHPMax(mkIstanza(1, 10))).toBe(19)
  })
  it('Vyrath (Media) lvl 100 → 154', () => {
    expect(calcolaHPMax(mkIstanza(1, 100))).toBe(154)
  })
  it('Ao-shin (Leggendaria) lvl 100 → 310', () => {
    expect(calcolaHPMax(mkIstanza(107, 100))).toBe(310)
  })
})

describe('efficaciaTipo (matrice tipi)', () => {
  it('Acqua → Fuoco === 2 (superefficace)', () => {
    expect(efficaciaTipo('Acqua', 'Fuoco')).toBe(2)
  })
  it('Fuoco → Acqua === 0.5', () => {
    expect(efficaciaTipo('Fuoco', 'Acqua')).toBe(0.5)
  })
  it('Normale → Psico === 1', () => {
    expect(efficaciaTipo('Normale', 'Psico')).toBe(1)
  })
})

describe('determinaIniziativa', () => {
  it('lv A > lv B → A', () => expect(determinaIniziativa(10, 5)).toBe('A'))
  it('lv B > lv A → B', () => expect(determinaIniziativa(5, 10)).toBe('B'))
  it('pareggio + rng < 0.5 → A', () => {
    expect(determinaIniziativa(5, 5, () => 0.3)).toBe('A')
  })
  it('pareggio + rng >= 0.5 → B', () => {
    expect(determinaIniziativa(5, 5, () => 0.7)).toBe('B')
  })
})

describe('calcolaDanno messaggi', () => {
  it('non applica STAB solo perché mossa e attaccante hanno lo stesso tipo', () => {
    const attaccante = mkIstanza(1, 5)
    const difensore = mkIstanza(1, 5)

    const risultato = calcolaDanno(attaccante, difensore, 0, () => 0)

    expect(risultato?.stab).toBe(false)
    expect(risultato?.dannoFinale).toBe(2)
  })

  it('applica STAB quando il bersaglio è debole al tipo della mossa', () => {
    const attaccante = mkIstanza(1, 5)
    const difensoreAcqua = mkIstanza(56, 5)

    const risultato = calcolaDanno(attaccante, difensoreAcqua, 1, () => 0)

    expect(risultato?.stab).toBe(true)
    expect(risultato?.moltiplicatoreTipo).toBe(2)
    expect(risultato?.dannoFinale).toBe(4)
    expect(risultato?.messaggi).toContain('È superefficace!')
  })
})

describe('applicaXP (regola: 1 xp = 1 livello, cap a 100)', () => {
  it('xpRichiestoPerLivello sempre 1', () => {
    expect(xpRichiestoPerLivello(5)).toBe(1)
    expect(xpRichiestoPerLivello(50)).toBe(1)
    expect(xpRichiestoPerLivello(99)).toBe(1)
  })
  it('xpGuadagnato sempre 1', () => {
    expect(xpGuadagnato(mkIstanza(1, 5))).toBe(1)
    expect(xpGuadagnato(mkIstanza(1, 50))).toBe(1)
  })
  it('Vyrath lvl 5 + 1 xp → lvl 6', () => {
    const r = applicaXP(mkIstanza(1, 5), 1)
    expect(r.istanza.livello).toBe(6)
    expect(r.livelliGuadagnati).toBe(1)
    expect(r.istanza.xp).toBe(0)
    expect(r.evoluzionePendente).toBe(null)
  })
  it('il level-up conserva gli HP correnti', () => {
    const r = applicaXP(mkIstanza(1, 5, 4), 1)
    expect(r.istanza.livello).toBe(6)
    expect(r.istanza.hp).toBe(4)
  })
  it('Vyrath lvl 14 + 1 xp → lvl 15 con evoluzionePendente (id 2)', () => {
    const r = applicaXP(mkIstanza(1, 14), 1)
    expect(r.istanza.livello).toBe(15)
    expect(r.evoluzionePendente?.nuovaSpecieId).toBe(2)
  })
  it('Vyrath lvl 99 + 1 xp → lvl 100 (cap raggiunto)', () => {
    const r = applicaXP(mkIstanza(1, 99), 1)
    expect(r.istanza.livello).toBe(100)
    expect(r.istanza.xp).toBe(0)
  })
  it('Vyrath lvl 100 + 1 xp → resta lvl 100, no level-up', () => {
    const r = applicaXP(mkIstanza(1, 100), 1)
    expect(r.istanza.livello).toBe(100)
    expect(r.livelliGuadagnati).toBe(0)
  })
})

describe('tentaCattura — formula VBA (3 - hp/hpMax)', () => {
  // BR.3: formula riallineata al VBA → soglia = tasso * (3 - hp/hpMax)
  // A HP pieno (12/12): soglia = 5 * (3 - 1) = 10
  // A HP vuoto (0/12): soglia = 5 * (3 - 0) = 15
  it('rng=0 (roll=3), tasso=5, hp pieno → soglia=10, riuscita=true', () => {
    const v = mkIstanza(1, 5) // Vyrath, tasso=5, hp=12 di 12
    const ris = tentaCattura(v, () => 0)
    expect(ris.roll).toBe(3)
    expect(ris.soglia).toBe(10)
    expect(ris.riuscita).toBe(true)
  })
  it('rng=0.99 (roll=18), tasso=5, hp pieno → soglia=10, riuscita=false', () => {
    const v = mkIstanza(1, 5)
    const ris = tentaCattura(v, () => 0.99)
    expect(ris.roll).toBe(18)
    expect(ris.soglia).toBe(10)
    expect(ris.riuscita).toBe(false)
  })
  it('hp a metà (6/12) → soglia=12.5, più generosa di hp pieno', () => {
    const v = mkIstanza(1, 5, 6) // hp = 6 di 12
    const ris = tentaCattura(v, () => 0) // roll=3
    expect(ris.soglia).toBeCloseTo(12.5)
    expect(ris.riuscita).toBe(true)
  })
  it('espone i tre tiri singoli, nello stesso ordine e con la stessa somma, senza consumare altri numeri', () => {
    const v = mkIstanza(1, 5)
    const sequence = [0.05, 0.55, 0.95, 0.4]
    let drawn = 0
    const ris = tentaCattura(v, () => sequence[drawn++])
    expect(ris.tiri).toEqual([1, 4, 6])
    expect(ris.roll).toBe(11)
    expect(drawn).toBe(3)
    expect(ris.riuscita).toBe(false)
  })
})

describe('d20 delle Arkaball', () => {
  const rarity = ['Comune', 'Medio', 'Difficile'] as const
  const hpBands = [
    { hp: 12 }, { hp: 6 }, { hp: 3 },
    { hp: 6, stato: { tipo: 'Paralizzato', turniRimanenti: -1 } },
    { hp: 3, stato: { tipo: 'Paralizzato', turniRimanenti: -1 } },
  ] satisfies Partial<PokemonIstanza>[]
  it.each([
    ['arkaball', [[11, 15, 19], [9, 13, 17], [7, 11, 15], [8, 12, 16], [6, 10, 14]]],
    ['mega-arkaball', [[9, 13, 17], [7, 11, 15], [5, 9, 13], [6, 10, 14], [4, 8, 12]]],
    ['ultra-arkaball', [[7, 9, 11], [5, 7, 9], [3, 5, 7], [4, 6, 8], [2, 4, 6]]],
  ] as const)('%s applica tutte le soglie di difficoltà, HP e status', (ball, matrix) => {
    for (const [level, target] of hpBands.entries()) {
      for (const [column, difficulty] of rarity.entries()) {
        const subject = { ...mkIstanza(1, 5), ...target, difficoltaCattura: difficulty }
        const soglia = matrix[level][column]
        expect(tentaCatturaConSfera(subject, ball, () => (soglia - 1 + .5) / 20))
          .toEqual({ riuscita: true, roll: soglia, soglia })
        expect(tentaCatturaConSfera(subject, ball, () => (soglia - 2 + .5) / 20))
          .toEqual({ riuscita: false, roll: soglia - 1, soglia })
      }
    }
  })

  it('garantisce la Master Arkaball soltanto contro un bersaglio vivo e giocabile', () => {
    const unusedRandom = () => { throw new Error('La Master Arkaball non lancia dadi.') }
    expect(tentaCatturaConSfera(mkIstanza(1, 5), 'masterball', unusedRandom)).toMatchObject({ riuscita: true, roll: 0 })
    expect(tentaCatturaConSfera(mkIstanza(1, 5, 0), 'masterball', unusedRandom).riuscita).toBe(false)
    expect(tentaCatturaConSfera({ ...mkIstanza(1, 5), specieId: 130 }, 'masterball', unusedRandom).riuscita).toBe(false)
  })

  it('usa il tasso storico o la difficoltà media se manca la provenienza', () => {
    expect(tentaCatturaConSfera(mkIstanza(1, 5), 'arkaball', () => 0).soglia).toBe(11)
    expect(tentaCatturaConSfera(mkIstanza(111, 5), 'arkaball', () => 0).soglia).toBe(15)
  })
})

describe('team outcome after damage and supreme recoil', () => {
  it('treats simultaneous last-Pokémon KO consistently as defeat', () => {
    expect(esitoSquadre([mkIstanza(1, 5, 0)], [mkIstanza(13, 5, 0)])).toBe('sconfitta')
  })
  it('wins after simultaneous active KO when a healthy player reserve remains', () => {
    expect(esitoSquadre([mkIstanza(1, 5, 0), mkIstanza(5, 5, 1)], [mkIstanza(13, 5, 0)])).toBe('vittoria')
  })
  it('continues when both players have healthy replacements', () => {
    expect(esitoSquadre([mkIstanza(1, 5, 0), mkIstanza(5, 5, 1)], [mkIstanza(13, 5, 0), mkIstanza(20, 5, 1)])).toBeNull()
  })
})
