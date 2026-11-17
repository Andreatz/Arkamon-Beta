import { describe, expect, it } from 'vitest'
import { getLocalMap } from '@/data/localMaps'
import { getMossa, getPokemon, MOSSE } from '@/data'
import { migrateDefeatedTrainers, migrateLegacyInteraction } from '@/data/trainerMigration'
import {
  applicaMossaCura, calcolaDanno, difficoltaCattura, risolviStatoInizioTurno, sogliaCatturaD20,
  tentaApplicaStato, tentaCatturaSacchettino, èMossaDisponibile,
} from '@/engine/battleEngine'
import { getAdjacentLocalMapNodes, getLocalRoadPath, getLocalTravelPath, getReachableLocalMapNodes } from '@/engine/localMapMovement'
import { applyDamageBoost, boostBlockedReason } from '@/shop/battleBoost'
import { localMoveRange } from '@/shop/catalog'
import { newInteractionDefinition } from '@/interactions/types'
import type { PokemonIstanza, StatoBattaglia } from '@/types'

const mk = (specieId: number, livello = 30, hp?: number, patch: Partial<PokemonIstanza> = {}): PokemonIstanza => {
  const base: PokemonIstanza = { istanzaId: `t-${specieId}`, specieId, nome: getPokemon(specieId)!.nome, livello, hp: 1, xp: 0, ...patch }
  return { ...base, hp: hp ?? 1000 }
}

describe('cattura con Sacchettino (tabella d20 del Database)', () => {
  it('ricava la difficoltà dal tasso di cattura', () => {
    expect(difficoltaCattura(5)).toBe('Facile')
    expect(difficoltaCattura(3)).toBe('Medio')
    expect(difficoltaCattura(1)).toBe('Difficile')
  })

  it('usa le soglie del foglio per HP e stato', () => {
    const easy = mk(1, 5, 12) // Vyrath, tasso 5
    expect(sogliaCatturaD20(easy, 'base')).toMatchObject({ soglia: 11, difficolta: 'Facile', fascia: 'pieno' })
    expect(sogliaCatturaD20({ ...easy, hp: 6 }, 'base').soglia).toBe(9)
    expect(sogliaCatturaD20({ ...easy, hp: 3 }, 'mega').soglia).toBe(5)
    expect(sogliaCatturaD20({ ...easy, hp: 3, stato: { tipo: 'Avvelenato', turniRimanenti: -1 } }, 'ultra').soglia).toBe(2)
    expect(sogliaCatturaD20({ ...mk(107, 50), hp: 1 }, 'ultra')).toMatchObject({ difficolta: 'Difficile', soglia: 7 })
  })

  it('riesce con un d20 uguale o maggiore della soglia; il Supremo non tira', () => {
    const target = mk(1, 5, 12)
    expect(tentaCatturaSacchettino(target, 'base', () => 0.5)).toMatchObject({ roll: 11, soglia: 11, riuscita: true })
    expect(tentaCatturaSacchettino(target, 'base', () => 0.45)).toMatchObject({ roll: 10, riuscita: false })
    expect(tentaCatturaSacchettino(target, 'master', () => 0)).toMatchObject({ roll: null, riuscita: true })
  })
})

describe('mosse Status del Database', () => {
  const move = (rule: string) => MOSSE.find((entry) => entry.regolaStato === rule)!
  const owner = (moveId: number) => getPokemon([...Array(206).keys()].map((i) => i + 1).find((id) => getPokemon(id)?.mosse.includes(moveId))!)!

  it('Danno fisso: sempre 10 danni, senza dadi né efficacia', () => {
    const fixed = move('danno-fisso')
    const attacker = mk(owner(fixed.id).id, 60)
    const slot = getPokemon(attacker.specieId)!.mosse.indexOf(fixed.id) as 0 | 1 | 2
    const result = calcolaDanno(attacker, mk(1, 60), slot, () => 0.99)!
    expect(result).toMatchObject({ dannoFinale: 10, numDadi: 0, moltiplicatoreTipo: 1 })
  })

  it('Cura paralisi rimuove soltanto la paralisi', () => {
    const cure = move('cura-paralisi')
    const paralyzed = mk(1, 30, 5, { stato: { tipo: 'Paralizzato', turniRimanenti: -1 } })
    expect(applicaMossaCura(paralyzed, cure, 50).istanza.stato).toBeUndefined()
    expect(applicaMossaCura(paralyzed, cure, 50).istanza.hp).toBe(5)
    expect(applicaMossaCura(mk(1, 30, 5), cure, 50).istanza).toEqual(mk(1, 30, 5))
  })

  it('Immunità cura lo stato, blocca i nuovi per 5 turni e poi scade', () => {
    const immunity = move('immunita')
    const poisoned = mk(1, 30, 5, { stato: { tipo: 'Avvelenato', turniRimanenti: -1, turniTrascorsi: 0 } })
    let protectedOne = applicaMossaCura(poisoned, immunity, 50).istanza
    expect(protectedOne).toMatchObject({ immunitaStati: 5 })
    expect(protectedOne.stato).toBeUndefined()
    expect(tentaApplicaStato(protectedOne, 'Paralizzato').applicato).toBe(false)
    for (let turn = 0; turn < 5; turn++) protectedOne = risolviStatoInizioTurno(protectedOne, 50, () => 0.5).istanza
    expect(protectedOne.immunitaStati).toBeUndefined()
    expect(tentaApplicaStato(protectedOne, 'Paralizzato').applicato).toBe(true)
  })

  it('le mosse "Dal Lvl 22" non si possono usare prima', () => {
    const late = getMossa(230)!
    expect(èMossaDisponibile(late, 21)).toBe(false)
    expect(èMossaDisponibile(late, 22)).toBe(true)
  })
})

describe('Boost', () => {
  const battle = (patch: Partial<StatoBattaglia>): StatoBattaglia => ({ tipo: 'Selvatico', pokemonA: mk(1), pokemonB: mk(5), hpMaxA: 1, hpMaxB: 1, turnoCorrente: 'A', luogoRitorno: 'Percorso_1', log: [], evoluzioneInAttesa: null, ...patch } as StatoBattaglia)

  it('valgono con selvatici e NPC, non con capipalestra, rivale, Superquattro e Mascherati', () => {
    expect(boostBlockedReason(battle({}))).toBeNull()
    expect(boostBlockedReason(battle({ tipo: 'NPC', allenatoreId: 208 }))).toBeNull()
    expect(boostBlockedReason(battle({ tipo: 'NPC', allenatoreId: 203 }))).toMatch(/capipalestra/)
    expect(boostBlockedReason(battle({ tipo: 'PVP', allenatoreId: 256 }))).toMatch(/rivale/)
    expect(boostBlockedReason(battle({ tipo: 'NPC', allenatoreId: 201 }))).toMatch(/Mascherati/)
    expect(boostBlockedReason(battle({ tipo: 'NPC', allenatoreId: 204 }))).toMatch(/Mascherati/)
  })

  it('Boost danno: +25% arrotondato, solo sugli attacchi con danno', () => {
    const result = calcolaDanno(mk(1, 30), mk(5, 30), 0, () => 0.5)!
    const boosted = applyDamageBoost(result)
    expect(boosted.dannoFinale).toBe(Math.round(result.dannoFinale * 1.25))
  })
})

describe('veicoli sulle mappe locali', () => {
  it('Bicicletta nei percorsi, Monopattino nelle città: fino a due pallini', () => {
    expect(localMoveRange({ bicycle: 1 }, 'Percorso_1')).toBe(2)
    expect(localMoveRange({ bicycle: 1 }, 'Venezia')).toBe(1)
    expect(localMoveRange({ scooter: 1 }, 'Venezia')).toBe(2)
    const map = getLocalMap('Percorso_1')!
    const start = map.startNode
    const one = getAdjacentLocalMapNodes(map, start)
    const two = getReachableLocalMapNodes(map, start, 2)
    expect(two.length).toBeGreaterThan(one.length)
    const far = two.find((id) => !one.includes(id))!
    expect(getLocalRoadPath(map, start, far)).toEqual([])
    expect(getLocalTravelPath(map, start, far, 2).length).toBeGreaterThan(2)
  })
})

describe('migrazione degli allenatori storici', () => {
  it('conserva le medaglie per città, azzera gli NPC storici e lascia gli altri ID', () => {
    expect([...migrateDefeatedTrainers(new Set([203, 302, 311, 202, 250, 999]))]).toEqual([203, 220, 287, 999])
  })

  it('ricollega le palestre nello stesso luogo e disattiva gli altri allenatori', () => {
    const gym = { ...newInteractionDefinition('Milano', 'n1', 'gym'), action: { kind: 'trainer' as const, trainerId: 302 } }
    expect(migrateLegacyInteraction(gym).action).toEqual({ kind: 'trainer', trainerId: 220 })
    const npc = { ...newInteractionDefinition('Percorso_1', 'n1', 'npc'), action: { kind: 'trainer' as const, trainerId: 202 }, requirements: { ...gym.requirements, gymIds: [203, 302] } }
    const migrated = migrateLegacyInteraction(npc)
    expect(migrated).toMatchObject({ enabled: false, action: { kind: 'dialogue' } })
    expect(migrated.title).toMatch(/^Da riassegnare/)
    expect(migrated.requirements.gymIds).toEqual([203, 220])
  })
})
