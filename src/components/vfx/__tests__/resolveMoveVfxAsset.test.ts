import { describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import type { MossaDef, TipoPokemon } from '@/types'
import { getGifRuntimeSrc } from '../GifVfx'
import { resolveMoveVfxAsset } from '../resolveMoveVfxAsset'

function move(
  id: number,
  tipo: TipoPokemon,
  effetto: string | null = null,
  nome = 'Test'
): MossaDef {
  return {
    id,
    nome,
    tipo,
    effetto,
    valoreEffetto: null,
    dadiPerLivello: {},
    incrementoPerLivello: {},
  }
}

describe('resolveMoveVfxAsset', () => {
  it('resolves special effects before type fallbacks', () => {
    expect(resolveMoveVfxAsset(move(9001, 'Normale', 'CURA')).id).toBe('cure')
    expect(resolveMoveVfxAsset(move(9002, 'Normale', 'CONFUSIONE')).id).toBe('confuseGif')
    expect(resolveMoveVfxAsset(move(9003, 'Normale', 'SUPREMA')).id).toBe('burst')
  })

  it('resolves water and normal type fallbacks', () => {
    expect(resolveMoveVfxAsset(move(9004, 'Acqua')).id).toBe('waterGif')
    expect(['punch', 'thrust', 'gutsPunchGif']).toContain(
      resolveMoveVfxAsset(move(9005, 'Normale')).id
    )
  })

  it('applies move id overrides first', () => {
    expect(resolveMoveVfxAsset(move(146, 'Normale')).id).toBe('gutsPunchGif')
    expect(resolveMoveVfxAsset(move(157, 'Erba')).id).toBe('slash')
  })

  it('always resolves an asset for every configured move', () => {
    for (const configuredMove of MOSSE) {
      const asset = resolveMoveVfxAsset(configuredMove)
      expect(asset.id).toBeTruthy()
      expect(asset.src).not.toMatch(/^\//)
      expect(asset.durationMs).toBeGreaterThan(0)
    }
  })

  it('restarts gif URLs when the effect id changes', () => {
    expect(getGifRuntimeSrc('/vfx/water.gif', 11)).toBe('/vfx/water.gif?vfx=11')
    expect(getGifRuntimeSrc('/vfx/water.gif?quality=1', 12)).toBe(
      '/vfx/water.gif?quality=1&vfx=12'
    )
  })
})
