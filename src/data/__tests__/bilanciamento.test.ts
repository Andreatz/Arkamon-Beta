import { describe, expect, it } from 'vitest'
import {
  calcolaVariazioneMonete,
  DURATA_STATO,
} from '@engine/battleEngine'
import {
  ALLENATORI,
  INCONTRI,
  MAPPE,
  MOSSE,
} from '@data/index'
import {
  ECONOMIA_BILANCIAMENTO,
  PROGRESSIONE_MAPPE,
  SOGLIE_EFFETTI_SPECIALI,
} from '@data/bilanciamento'

describe('bilanciamento progressione', () => {
  it('copre tutte le mappe storiche nello stesso ordine di mappe.json', () => {
    expect(PROGRESSIONE_MAPPE).toEqual(MAPPE.map((m) => m.nome))
  })

  it('ogni allenatore del Database ha una squadra con livelli validi', () => {
    for (const allenatore of ALLENATORI) {
      const livelli = allenatore.squadra.map((p) => p.livello)
      expect(livelli.length, `Squadra vuota: ${allenatore.id}`).toBeGreaterThan(0)
      expect(livelli.length).toBeLessThanOrEqual(6)
      expect(Math.min(...livelli)).toBeGreaterThanOrEqual(5)
      expect(Math.max(...livelli)).toBeLessThanOrEqual(100)
    }
  })

  it('mantiene i capipalestra in crescita lungo la progressione', () => {
    const gymAces = ALLENATORI.filter((a) => a.tipo === 'Capopalestra').map(
      (a) => Math.max(...a.squadra.map((p) => p.livello))
    )

    for (let i = 1; i < gymAces.length; i++) {
      expect(gymAces[i]).toBeGreaterThan(gymAces[i - 1])
    }
  })
})

describe('bilanciamento incontri selvatici (Database)', () => {
  it('ogni luogo con incontri è sulla mappa o è il Percorso 15', () => {
    const luoghi = new Set([...MAPPE.map((m) => m.nome), 'Percorso_15'])
    for (const incontro of INCONTRI) expect(luoghi.has(incontro.luogo), incontro.luogo).toBe(true)
  })

  it('i livelli degli incontri sono validi e ordinati', () => {
    for (const incontro of INCONTRI) {
      expect(incontro.livelloMin).toBeGreaterThanOrEqual(5)
      expect(incontro.livelloMax).toBeLessThanOrEqual(100)
      expect(incontro.livelloMin).toBeLessThanOrEqual(incontro.livelloMax)
    }
  })

  it('ogni cespuglio offre almeno un incontro Comune', () => {
    const cespugli = new Set(INCONTRI.map((i) => `${i.luogo}:${i.cespuglio}`))
    for (const key of cespugli) {
      const [luogo, cespuglio] = key.split(':')
      expect(INCONTRI.some((i) => i.luogo === luogo && i.cespuglio === cespuglio && i.probabilita === 'Comune'), key).toBe(true)
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
    const totale = ALLENATORI.reduce((somma, a) => {
      if (a.tipo === 'NPC') return somma + calcolaVariazioneMonete('vittoria', 'NPC')
      if (a.tipo === 'Capopalestra') {
        return somma + calcolaVariazioneMonete('vittoria', 'Capopalestra')
      }
      return somma
    }, 0)

    // 102 NPC e 8 capipalestra del Database.
    expect(totale).toBeGreaterThan(0)
    expect(totale).toBeLessThanOrEqual(30000)
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

      if (
        !mossa.soloStato && (
        mossa.effetto === 'CONFUSIONE' ||
        mossa.effetto === 'SONNO' ||
        mossa.effetto === 'VELENO')
      ) {
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
