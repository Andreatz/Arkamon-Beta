import { afterEach, describe, expect, it } from 'vitest'
import { getMossa, MOSSE, POKEMON_BASE } from '@/data'
import { useVfxAdminStore } from '@/store/vfxAdminStore'
import { getMoveVfxAssignment } from '../moveVfxAssignments'
import { battleImpactDelay, battleSequence } from '../signature/battleSequence'
import { formMotifs, motifs, moveMotifs } from '../signature/motifs'
import { getMoveVfxPlaybackSources } from '../preloadVfxAssets'

afterEach(() => useVfxAdminStore.setState({ overrides: {} }))
describe('sequenze illustrate per mossa e forma', () => {
  it('copre ogni coppia del moveset e la mossa di catalogo senza assegnazione giocabile', () => {
    const keys = new Set<string>()
    for (const move of MOSSE) {
      const owners = POKEMON_BASE.filter(species => species.mosse.includes(move.id))
      const forms = owners.length ? owners : getMoveVfxAssignment(move)?.arkamon ?? []
      expect(forms.length).toBeGreaterThan(0)
      for (const form of forms) {
        const s = battleSequence(move, form.id)!
        expect(s.key).toBe(move.id + '-' + form.id)
        expect(s.motif).toBe(moveMotifs[move.id-1])
        expect(s.seal).toBe(formMotifs[form.id-1])
        expect(s.accent).toMatch(/^#[0-9a-f]{6}$/i)
        expect(s.impact).toBeGreaterThan(0)
        expect(s.impact).toBeLessThan(s.duration)
        expect(battleImpactDelay(move,form.id)).toBe(s.impact)
        keys.add(s.key)
      }
    }
    expect(keys.size).toBe(548)
  })
  it('distingue i due Boro Breath e le forme che usano la stessa mossa', () => {
    const oniros = battleSequence(getMossa(217)!,109)!
    const voider = battleSequence(getMossa(218)!,110)!
    expect([motifs[oniros.motif], motifs[oniros.seal]]).toEqual(['eye','prism'])
    expect([motifs[voider.motif], motifs[voider.seal]]).toEqual(['eclipse','fang'])
    const shared = getMossa(467)!
    expect(battleSequence(shared,112)?.key).toBe('467-112')
    expect(battleSequence(shared,113)?.key).toBe('467-113')
    expect(getMoveVfxPlaybackSources(shared,1,true,112)).toEqual(getMoveVfxPlaybackSources(shared,2,true,113))
  })
  it('racchiude il bersaglio delle paralisi e distingue le mosse di cura', () => {
    for (const move of MOSSE.filter(move => move.soloStato)) {
      const form = POKEMON_BASE.find(p => p.mosse.includes(move.id))?.id ?? 44
      expect(battleSequence(move,form)?.motion === 'cage').toBe(move.effetto === 'PARALISI')
    }
    expect(battleSequence(getMossa(256)!,44)?.motion).toBe('cage')
  })
  it('mantiene gli eventi precedenti e le scelte esplicite del GM', () => {
    const move = getMossa(217)!
    expect(battleSequence(move)).toBeUndefined()
    const override = { moveId: move.id, assetId: 'punch', scale: 1, offsetX: 0, offsetY: 0, durationMs: 400, anchor: 'target', layer: 'over-pokemon', mirrorForEnemy: true, blendMode: 'normal' } as const
    useVfxAdminStore.setState({ overrides: { [move.id]: override } })
    expect(battleSequence(move,109)).toBeUndefined()
    expect(getMoveVfxPlaybackSources(move,1,true,109)).toEqual(getMoveVfxPlaybackSources(move,1))
  })
})
