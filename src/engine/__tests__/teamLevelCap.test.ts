import { describe, expect, it } from 'vitest'
import type { Lato, PokemonIstanza } from '@/types'
import { applicaXP, calcolaAzioneSuprema, calcolaHPMax, costoSuprema } from '../battleEngine'
import { resolveBattleAttack } from '../battleResolution'
import { canJoinTeam, isTeamWithinLevelCap, TEAM_LEVEL_GAP, teamLevelRange, teamProgressionLimit } from '../teamLevelCap'

const pokemon = (id: string, level: number, hp = 3, xp = 0): PokemonIstanza => ({ istanzaId: id, specieId: 1, nome: id, livello: level, hp, xp })

describe('cap di cinque livelli fra tutti gli Arkamon in squadra', () => {
  it('uses the highest and lowest level, including KO members, without changing creatures', () => {
    const team = [pokemon('middle', 8), pokemon('low-ko', 5, 0), pokemon('high', 10)]
    const before = structuredClone(team)
    expect(TEAM_LEVEL_GAP).toBe(5)
    expect(teamLevelRange(team)).toEqual({ min: 5, max: 10, gap: 5 })
    expect(isTeamWithinLevelCap(team)).toBe(true)
    expect(isTeamWithinLevelCap([team[0], team[1], pokemon('higher', 11)])).toBe(false)
    expect(team).toEqual(before)
  })

  it('allows empty teams and a lone creature at any normal level', () => {
    expect(teamLevelRange([])).toEqual({ min: 0, max: 0, gap: 0 })
    expect(isTeamWithinLevelCap([])).toBe(true)
    expect(canJoinTeam([], pokemon('single', 100))).toBe(true)
    expect(teamProgressionLimit([pokemon('single', 70)], 'single')).toBe(100)
  })

  it('checks both directions of insertion and the independent six-slot limit', () => {
    expect(canJoinTeam([pokemon('one', 10)], pokemon('lower-boundary', 5))).toBe(true)
    expect(canJoinTeam([pokemon('one', 11)], pokemon('too-low', 5))).toBe(false)
    expect(canJoinTeam([pokemon('one', 5)], pokemon('upper-boundary', 10))).toBe(true)
    expect(canJoinTeam([pokemon('one', 5)], pokemon('too-high', 11))).toBe(false)
    expect(canJoinTeam(Array.from({ length: 6 }, (_, index) => pokemon(String(index), 5)), pokemon('seventh', 5))).toBe(false)
  })

  it('caps progression against the lowest teammate, even if that teammate is KO', () => {
    const attacker = pokemon('attacker', 10)
    expect(teamProgressionLimit([attacker, pokemon('ko', 5, 0), pokemon('other', 9)], attacker.istanzaId)).toBe(10)
    expect(teamProgressionLimit([attacker, pokemon('other', 9)], attacker.istanzaId)).toBe(14)
    expect(teamProgressionLimit([pokemon('attacker', 98), pokemon('other', 99)], 'attacker')).toBe(100)
  })

  it('banks XP at the cap and later uses banked XP without healing', () => {
    const attacker = pokemon('attacker', 10, 3, 3)
    const capped = applicaXP(attacker, 1, 10)
    expect(capped).toMatchObject({ livelliGuadagnati: 0, evoluzionePendente: null, istanza: { livello: 10, hp: 3, xp: 4 } })
    const unlocked = applicaXP(capped.istanza, 0, 13)
    expect(unlocked).toMatchObject({ livelliGuadagnati: 3, evoluzionePendente: null, istanza: { livello: 13, hp: 3, xp: 1 } })
    expect(attacker).toMatchObject({ livello: 10, hp: 3, xp: 3 })
  })

  it('does not downgrade an old creature when its current level exceeds the progression limit', () => {
    const previous = pokemon('old-save', 20, 2, 1)
    const result = applicaXP(previous, 1, 10)
    expect(result.istanza).toMatchObject({ livello: 20, hp: 2, xp: 2 })
    expect(result.livelliGuadagnati).toBe(0)
    expect(result.evoluzionePendente).toBeNull()
  })

  it('defers evolution until the earned level can fit within the cap', () => {
    const attacker = pokemon('attacker', 14, 3)
    const capped = applicaXP(attacker, 1, 14)
    expect(capped.istanza).toMatchObject({ livello: 14, xp: 1, hp: 3 })
    expect(capped.evoluzionePendente).toBeNull()
    const unlocked = applicaXP(capped.istanza, 0, 15)
    expect(unlocked.istanza).toMatchObject({ livello: 15, xp: 0, hp: 3 })
    expect(unlocked.evoluzionePendente).toEqual({ nuovaSpecieId: 2 })
  })

  it.each(['A', 'B'] as const)('computes Suprema recoil after the capped progression on side %s', (side: Lato) => {
    const attacker = pokemon('attacker', 14, 12)
    const teammate = pokemon('lowest-ko', 9, 0)
    const target = pokemon('target', 5, 1)
    const attack = calcolaAzioneSuprema(attacker, target, 0, () => 0)!
    const attackers = [attacker, teammate]
    const resolved = side === 'A'
      ? resolveBattleAttack(attack, side, attackers, [target], teamProgressionLimit(attackers, attacker.istanzaId), 100)
      : resolveBattleAttack(attack, side, [target], attackers, 100, teamProgressionLimit(attackers, attacker.istanzaId))
    expect(resolved.defender.hp).toBe(0)
    expect(resolved.attackerProgression).toMatchObject({ xpAssegnata: 1, livelliGuadagnati: 0, istanzaPrimaDelContraccolpo: { livello: 14, hp: 12, xp: 1 } })
    expect(resolved.attackerProgression.autodanno).toBe(costoSuprema(calcolaHPMax(attacker)))
    expect(resolved.attackerProgression.autodanno).toBe(12)
    expect(resolved.attacker).toMatchObject({ livello: 14, hp: 0, xp: 1 })
    expect(resolved.attackerProgression.messaggi.join(' ')).toContain('conserva l’XP')
    expect(resolved.winnerSide).toBe(side)
    expect(resolved.outcome).toBe(side === 'A' ? 'vittoria' : 'sconfitta')
  })

  it('allows the level-up before recoil when the weakest teammate has caught up', () => {
    const attacker = pokemon('attacker', 14, 13)
    const teammate = pokemon('lowest-ko', 10, 0)
    const target = pokemon('target', 5, 1)
    const attack = calcolaAzioneSuprema(attacker, target, 0, () => 0)!
    const resolved = resolveBattleAttack(attack, 'A', [attacker, teammate], [target], teamProgressionLimit([attacker, teammate], attacker.istanzaId))
    expect(resolved.attackerProgression.istanzaPrimaDelContraccolpo).toMatchObject({ livello: 15, hp: 13, xp: 0 })
    expect(resolved.attackerProgression.autodanno).toBe(13)
    expect(resolved.attacker.hp).toBe(0)
    expect(resolved.winnerSide).toBe('A')
  })
})
