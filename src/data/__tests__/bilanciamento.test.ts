import { describe, expect, it } from 'vitest'
import {
  calcolaVariazioneMonete,
  DURATA_STATO,
} from '@engine/battleEngine'
import {
  ALLENATORI,
  INCONTRI,
  getIncontri,
  getCespugliInLuogo,
  MAPPE,
  MOSSE,
} from '@data/index'
import {
  ECONOMIA_BILANCIAMENTO,
  PROGRESSIONE_MAPPE,
  RANGE_LIVELLI_ALLENATORI,
  SOGLIE_EFFETTI_SPECIALI,
} from '@data/bilanciamento'

describe('bilanciamento progressione', () => {
  it('copre tutte le mappe storiche nello stesso ordine di mappe.json', () => {
    expect(PROGRESSIONE_MAPPE).toEqual(MAPPE.map((m) => m.nome))
  })

  it('blocca i range livello di ogni allenatore della run principale', () => {
    for (const allenatore of ALLENATORI.filter((trainer) => trainer.idDatabase === undefined)) {
      const range = RANGE_LIVELLI_ALLENATORI[allenatore.id]
      expect(range, `Range mancante per allenatore ${allenatore.id}`).toBeTruthy()

      const livelli = allenatore.squadra.map((p) => p.livello)
      expect(Math.min(...livelli)).toBeGreaterThanOrEqual(range.min)
      expect(Math.max(...livelli)).toBeLessThanOrEqual(range.max)
    }
  })

  it('mantiene in crescita i livelli degli otto Capipalestra del foglio', () => {
    const gymAces = ALLENATORI.filter((trainer) => trainer.tipo === 'Capopalestra' && trainer.idDatabase !== undefined)
      .sort((first, second) => first.idDatabase! - second.idDatabase!)
      .map((trainer) => Math.max(...trainer.squadra.map((member) => member.livello)))
    expect(gymAces).toEqual([10, 19, 26, 31, 37, 40, 55, 60])
  })
})

describe('incontri selvatici del database', () => {
  it('usa i gruppi del foglio nelle città e nei percorsi con gruppi estesi', () => {
    expect(getIncontri('Venezia', 'A').map((row) => row.pokemonId)).toEqual([99, 196, 111, 101])
    expect(getIncontri('Percorso_1', 'A').map((row) => row.pokemonId)).toEqual([105, 89, 56, 19])
    expect(getCespugliInLuogo('Percorso_15')).toEqual('ABCDEFGHIJKLMNOP'.split(''))
    expect(getIncontri('Percorso_15', 'P')).toContainEqual({
      luogo: 'Percorso_15', cespuglio: 'P', pokemonId: 132, probabilita: 'Difficile', livelloMin: 70, livelloMax: 70,
    })
  })

  it('espone solo specie da battaglia con livelli e probabilità validi', () => {
    for (const encounter of INCONTRI) {
      expect(encounter.pokemonId).not.toBe(130)
      expect(encounter.livelloMin).toBeGreaterThanOrEqual(5)
      expect(encounter.livelloMax).toBeLessThanOrEqual(100)
      expect(encounter.livelloMin).toBeLessThanOrEqual(encounter.livelloMax)
      expect(['Comune', 'Medio', 'Difficile']).toContain(encounter.probabilita)
    }
  })
})

describe('bilanciamento economia', () => {
  it('mantiene il rapporto premio capopalestra / NPC a 5x', () => {
    expect(calcolaVariazioneMonete('vittoria', 'NPC')).toBe(
      ECONOMIA_BILANCIAMENTO.premioNpc
    )
    expect(calcolaVariazioneMonete('vittoria', 'Capopalestra')).toBe(
      ECONOMIA_BILANCIAMENTO.premioCapopalestra
    )
    expect(
      calcolaVariazioneMonete('vittoria', 'Capopalestra') /
        calcolaVariazioneMonete('vittoria', 'NPC')
    ).toBe(ECONOMIA_BILANCIAMENTO.rapportoCapopalestraNpc)
  })

  it('la penalita sconfitta resta uguale per NPC e capopalestra', () => {
    expect(calcolaVariazioneMonete('sconfitta', 'NPC')).toBe(
      ECONOMIA_BILANCIAMENTO.penalitaSconfittaTrainer
    )
    expect(calcolaVariazioneMonete('sconfitta', 'Capopalestra')).toBe(
      ECONOMIA_BILANCIAMENTO.penalitaSconfittaTrainer
    )
  })

  it('una run completa ha una ricompensa totale positiva ma non esplosiva', () => {
    const totale = ALLENATORI.filter((trainer) => trainer.idDatabase === undefined).reduce((somma, a) => {
      if (a.tipo === 'NPC') return somma + calcolaVariazioneMonete('vittoria', 'NPC')
      if (a.tipo === 'Capopalestra') {
        return somma + calcolaVariazioneMonete('vittoria', 'Capopalestra')
      }
      return somma
    }, 0)

    expect(totale).toBeGreaterThan(0)
    expect(totale).toBeLessThanOrEqual(15000)
  })
})

describe('bilanciamento stati, cure e Supreme', () => {
  it('mantiene durate stato entro soglie compatte', () => {
    expect(DURATA_STATO.Confuso).toBe(2)
    expect(DURATA_STATO.Addormentato).toBe(3)
    expect(DURATA_STATO.Avvelenato).toBe(-1)
  })

  it('limita cure percentuali, status value e autodanno Supreme', () => {
    for (const mossa of MOSSE) {
      if (mossa.effetto === 'CURA_PCT') {
        expect(mossa.valoreEffetto).toBeGreaterThanOrEqual(
          SOGLIE_EFFETTI_SPECIALI.curaPctMin
        )
        expect(mossa.valoreEffetto).toBeLessThanOrEqual(
          SOGLIE_EFFETTI_SPECIALI.curaPctMax
        )
      }

      if (!mossa.soloStato && (
        mossa.effetto === 'CONFUSIONE' ||
        mossa.effetto === 'SONNO' ||
        mossa.effetto === 'VELENO'
      )) {
        expect(mossa.valoreEffetto).toBeGreaterThanOrEqual(
          SOGLIE_EFFETTI_SPECIALI.statoValoreMin
        )
        expect(mossa.valoreEffetto).toBeLessThanOrEqual(
          SOGLIE_EFFETTI_SPECIALI.statoValoreMax
        )
      }

      if (mossa.effetto === 'SUPREMA') {
        expect(mossa.valoreEffetto).toBe(
          SOGLIE_EFFETTI_SPECIALI.supremaAutodannoPct
        )
      }
    }
  })
})
