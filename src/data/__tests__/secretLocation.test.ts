import { describe, expect, it } from 'vitest'
import { ALLENATORI, getAllenatoriInLuogo } from '@data/index'
import { HIDDEN_LOCATIONS, SECRET_LOCATION_GYM_IDS, canAccessSecretLocation, canEnterHiddenLocation, hasUnlockedSecretLocation, hiddenLocationFrom, isSecretLocationConnection } from '@data/secretLocation'
import { getLocalMap } from '@data/localMaps'

describe('luogo segreto dopo tutte le palestre', () => {
  it('richiede tutti gli otto capipalestra reali del Database', () => {
    const capi = ALLENATORI.filter((a) => a.tipo === 'Capopalestra')
    expect(capi).toHaveLength(8)
    expect(SECRET_LOCATION_GYM_IDS).toEqual(capi.map((a) => a.id))
    expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set(SECRET_LOCATION_GYM_IDS) })).toBe(true)
  })

  it.each(ALLENATORI.filter((a) => a.tipo === 'Capopalestra'))('resta chiuso quando manca $nome', (capo) => {
    const altri = ALLENATORI.filter((a) => a.id !== capo.id).map((a) => a.id)
    expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set(altri) })).toBe(false)
  })

  it('NPC e rivali sconfitti non sostituiscono una palestra', () => {
    expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set() })).toBe(false)
    expect(hasUnlockedSecretLocation({ allenatoriSconfitti: new Set(ALLENATORI.filter((a) => a.tipo !== 'Capopalestra').map((a) => a.id)) })).toBe(false)
  })

  it('il collegamento nascosto porta esclusivamente da Roma alla Lega di Roma e viceversa', () => {
    expect(isSecretLocationConnection('Roma', 'Lega_Roma')).toBe(true)
    expect(isSecretLocationConnection('Lega_Roma', 'Roma')).toBe(true)
    expect(isSecretLocationConnection('Venezia', 'Lega_Roma')).toBe(false)
    expect(isSecretLocationConnection('Lega_Roma', 'Percorso_15')).toBe(false)
    // Percorso 15 è ora Via Vittoria, una strada ordinaria e sempre aperta.
    expect(isSecretLocationConnection('Roma', 'Percorso_15')).toBe(false)
  })

})

describe('luoghi nascosti dei Percorsi 3, 9, 11 e 12', () => {
  const free = [
    ['Percorso_3', 'Leggendario_Percorso_3'],
    ['Percorso_9', 'Nascondiglio_Team_Towers'],
    ['Percorso_11', 'Leggendario_Percorso_11'],
    ['Percorso_12', 'Leggendario_Percorso_12'],
  ] as const

  it.each(free)('%s porta a %s e ritorno, ad accesso libero', (origin, id) => {
    expect(hiddenLocationFrom(origin)?.id).toBe(id)
    expect(isSecretLocationConnection(origin, id)).toBe(true)
    expect(isSecretLocationConnection(id, origin)).toBe(true)
    expect(isSecretLocationConnection('Roma', id)).toBe(false)
    expect(canEnterHiddenLocation({ allenatoriSconfitti: new Set() }, id)).toBe(true)
    expect(canAccessSecretLocation({ allenatoriSconfitti: new Set() }, { mappaId: 'mappa-principale', luogo: id, x: 0, y: 0, direzione: 'S' })).toBe(true)
  })

  it('soltanto la Lega richiede le otto medaglie', () => {
    expect(HIDDEN_LOCATIONS.filter((entry) => entry.requiresAllGyms).map((entry) => entry.id)).toEqual(['Lega_Roma'])
    expect(canEnterHiddenLocation({ allenatoriSconfitti: new Set() }, 'Lega_Roma')).toBe(false)
  })

  it('nessun contenuto inventato: niente allenatori, mappe o passaggi da altri luoghi', () => {
    for (const entry of HIDDEN_LOCATIONS) {
      expect(getAllenatoriInLuogo(entry.id)).toEqual([])
      expect(ALLENATORI.some((trainer) => trainer.luogo === entry.id)).toBe(false)
      expect(getLocalMap(entry.id)).toBeUndefined()
    }
    expect(hiddenLocationFrom('Venezia')).toBeUndefined()
    expect(hiddenLocationFrom('Percorso_15')).toBeUndefined()
  })

  it('la posizione deve coincidere con il luogo richiesto', () => {
    const position = { mappaId: 'mappa-principale', luogo: 'Leggendario_Percorso_3', x: 0, y: 0, direzione: 'S' as const }
    expect(canAccessSecretLocation({ allenatoriSconfitti: new Set() }, position, 'Leggendario_Percorso_11')).toBe(false)
  })
})
