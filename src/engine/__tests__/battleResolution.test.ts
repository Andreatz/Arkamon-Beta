import { describe, expect, it } from 'vitest'
import { calcolaAzioneSuprema, calcolaDanno } from '../battleEngine'
import { resolveBattleAttack } from '../battleResolution'
import type { Lato, PokemonIstanza } from '@/types'

const creature = (id: string, level: number, hp: number): PokemonIstanza => ({ istanzaId: id, specieId: 1, nome: id, livello: level, hp, xp: 0 })
function squads(attacker: PokemonIstanza, defender: PokemonIstanza, side: Lato) { return side === 'A' ? [[attacker], [defender]] : [[defender], [attacker]] }

describe('risoluzione comune ai due lati', () => {
  it.each(['A', 'B'] as const)('risolve doppio KO da Suprema %s con XP prima del costo e vittoria dell’attaccante', (side) => {
    const attacker = creature('attacker', 14, 13)
    const defender = creature('defender', 5, 1)
    const result = calcolaAzioneSuprema(attacker, defender, 0, () => 0)!
    const [a, b] = squads(attacker, defender, side)
    const resolved = resolveBattleAttack(result, side, a, b)
    expect(resolved.attackerProgression.istanzaPrimaDelContraccolpo).toMatchObject({ livello: 15, hp: 13 })
    expect(resolved.attackerProgression.autodanno).toBe(13)
    expect(resolved.attacker).toMatchObject({ livello: 15, hp: 0 })
    expect(resolved.defender.hp).toBe(0)
    expect(resolved.defenderProgression).toBeUndefined()
    expect(resolved.winnerSide).toBe(side)
    expect(resolved.outcome).toBe(side === 'A' ? 'vittoria' : 'sconfitta')
    expect(attacker).toMatchObject({ livello: 14, hp: 13 })
    expect(defender.hp).toBe(1)
  })

  it.each(['A', 'B'] as const)('premia il bersaglio sopravvissuto quando %s cede al contraccolpo', (side) => {
    const attacker = creature('attacker', 10, 1)
    const defender = creature('defender', 20, 20)
    const result = calcolaAzioneSuprema(attacker, defender, 0, () => 0)!
    const [a, b] = squads(attacker, defender, side)
    const resolved = resolveBattleAttack(result, side, a, b)
    expect(resolved.attackerProgression.xpAssegnata).toBe(0)
    expect(resolved.defenderProgression?.xpAssegnata).toBe(1)
    expect(resolved.defender).toMatchObject({ livello: 21, hp: 20 - result.dannoFinale })
    expect(resolved.defenderAfterImpact.livello).toBe(20)
    expect(resolved.winnerSide).toBe(side === 'A' ? 'B' : 'A')
  })

  it('un normale attacco conserva il danno e non applica costi o XP senza KO', () => {
    const a = creature('A', 5, 12)
    const b = creature('B', 5, 12)
    const result = calcolaDanno(a, b, 0, () => 0, false)!
    const resolved = resolveBattleAttack(result, 'A', [a], [b])
    expect(resolved.attacker.hp).toBe(12)
    expect(resolved.defender.hp).toBe(12 - result.dannoFinale)
    expect(resolved.attackerProgression.xpAssegnata).toBe(0)
    expect(resolved.winnerSide).toBeUndefined()
    expect(resolved.outcome).toBeNull()
  })

  it('gli Arkamon controllati dal gioco non guadagnano EXP né livelli', () => {
    const npc = creature('npc', 14, 13)
    const player = creature('player', 5, 1)
    const ko = calcolaAzioneSuprema(npc, player, 0, () => 0)!
    const resolved = resolveBattleAttack(ko, 'B', [player], [npc], 100, 100, false)
    expect(resolved.defender.hp).toBe(0)
    expect(resolved.attackerProgression).toMatchObject({ xpAssegnata: 0, livelliGuadagnati: 0 })
    expect(resolved.attackerProgression.messaggi.join(' ')).not.toContain('EXP')
    expect(resolved.attacker.livello).toBe(14)

    // Il giocatore cade per il contraccolpo della Suprema: l'NPC sopravvissuto non viene premiato.
    const fragile = creature('player-fragile', 10, 1)
    const sturdyNpc = creature('npc-sturdy', 20, 20)
    const recoil = calcolaAzioneSuprema(fragile, sturdyNpc, 0, () => 0)!
    const survived = resolveBattleAttack(recoil, 'A', [fragile], [sturdyNpc], 100, 100, false)
    expect(survived.defenderProgression).toBeUndefined()
    expect(survived.defender.livello).toBe(20)
    expect(survived.winnerSide).toBe('B')
  })
})
