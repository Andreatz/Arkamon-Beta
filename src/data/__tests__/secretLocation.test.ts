import { describe, expect, it } from 'vitest'
import { ALLENATORI } from '@data/index'
import { SECRET_LOCATION_GYM_IDS, hasUnlockedSecretLocation, isSecretLocationConnection } from '@data/secretLocation'

describe('luogo segreto dopo tutte le palestre', () => {
  it('accetta le otto medaglie storiche oppure gli otto Capipalestra del database', () => {
    const historical = ALLENATORI.filter((a) => SECRET_LOCATION_GYM_IDS.includes(a.id))
    const authored = ALLENATORI.filter((a) => a.tipo === 'Capopalestra' && a.idDatabase !== undefined)
    expect(historical).toHaveLength(8)
    expect(authored).toHaveLength(8)
    expect(historical.some((a) => a.luogo === 'Roma')).toBe(true)
    for (const track of [historical, authored]) {
      expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set(track.map((gym) => gym.id)) })).toBe(true)
      expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set(track.slice(1).map((gym) => gym.id)) })).toBe(false)
    }
  })

  it('NPC e rivali sconfitti non sostituiscono una palestra', () => {
    expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set() })).toBe(false)
    expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set(ALLENATORI.filter((a) => a.tipo !== 'Capopalestra').map((a) => a.id)) })).toBe(false)
  })

  it('il collegamento nascosto porta esclusivamente da Roma al Percorso 15 e viceversa', () => {
    expect(isSecretLocationConnection('Roma', 'Percorso_15')).toBe(true)
    expect(isSecretLocationConnection('Percorso_15', 'Roma')).toBe(true)
    expect(isSecretLocationConnection('Venezia', 'Percorso_15')).toBe(false)
    expect(isSecretLocationConnection('Percorso_15', 'Percorso_14')).toBe(false)
  })
})
