import { describe, expect, it } from 'vitest'
import { nodeKindOf, nodeKinds } from '../localNodeKinds'

const isGymLeader = (id: number) => id === 100

describe('pallini tipizzati della mappa locale', () => {
  it('deduce il tipo dall’azione configurata', () => {
    expect(nodeKindOf({ kind: 'trainer', trainerId: 100 }, isGymLeader)).toBe('gym')
    expect(nodeKindOf({ kind: 'trainer', trainerId: 7 }, isGymLeader)).toBe('trainer')
    expect(nodeKindOf({ kind: 'bush', bush: 'A' }, isGymLeader)).toBe('grass')
    expect(nodeKindOf({ kind: 'encounter', speciesId: 3, level: 5 }, isGymLeader)).toBe('encounter')
    expect(nodeKindOf({ kind: 'heal' }, isGymLeader)).toBe('heal')
    expect(nodeKindOf({ kind: 'shop' }, isGymLeader)).toBe('shop')
    expect(nodeKindOf({ kind: 'dialogue' }, isGymLeader)).toBe('dialogue')
  })

  it('su un pallino con più interazioni mostra la più importante', () => {
    expect(nodeKinds([
      { nodeId: 'n1', action: { kind: 'dialogue' } },
      { nodeId: 'n1', action: { kind: 'shop' } },
      { nodeId: 'n2', action: { kind: 'bush', bush: 'B' } },
      { nodeId: 'n2', action: { kind: 'trainer', trainerId: 100 } },
      { nodeId: 'n3', action: { kind: 'encounter', speciesId: 1, level: 5 } },
    ], isGymLeader)).toEqual({ n1: 'shop', n2: 'gym', n3: 'encounter' })
  })

  it('senza interazioni nessun pallino ha un tipo', () => {
    expect(nodeKinds([], isGymLeader)).toEqual({})
  })
})
