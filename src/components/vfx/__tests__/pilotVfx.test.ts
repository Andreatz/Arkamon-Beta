import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MOSSE } from '@data/index'
import { useVfxAdminStore } from '@store/vfxAdminStore'
import { MOVE_VFX_ASSETS } from '../vfxManifest'
import { PILOT_VFX_ASSETS, PILOT_VFX_MOVES, getPilotVfxAssetId, pilotVfxAssetId } from '../pilotVfx'
import { getMoveVfxImpactDelayMs, resolveMoveVfxAsset, resolveMoveVfxRecipe } from '../resolveMoveVfxAsset'

describe('lotto pilota dei VFX', () => {
  afterEach(() => useVfxAdminStore.getState().resetOverrides())

  it('copre otto mosse, una per tipo, con Arkamon diversi', () => {
    expect(PILOT_VFX_MOVES).toHaveLength(8)
    expect(new Set(PILOT_VFX_MOVES.map(move => move.type)).size).toBe(8)
    expect(new Set(PILOT_VFX_MOVES.map(move => move.arkamon)).size).toBe(8)
  })

  it('usa in battaglia la variante attiva, senza ricetta, con i file presenti', () => {
    for (const entry of PILOT_VFX_MOVES) {
      const move = MOSSE.find(item => item.id === entry.moveId)!
      expect(move.nome.toLocaleLowerCase('it')).toBe(entry.name.toLocaleLowerCase('it'))
      const id = pilotVfxAssetId(entry.moveId, entry.active)
      expect(getPilotVfxAssetId(move)).toBe(id)
      const asset = resolveMoveVfxAsset(move)
      expect(asset).toEqual(MOVE_VFX_ASSETS[id])
      expect(resolveMoveVfxRecipe(move)).toBeUndefined()
      expect(getMoveVfxImpactDelayMs(move)).toBeGreaterThan(0)
      expect(getMoveVfxImpactDelayMs(move)).toBeLessThan(asset.durationMs)
    }
    for (const asset of Object.values(PILOT_VFX_ASSETS)) {
      expect(existsSync(resolve('public', asset.src)), asset.src).toBe(true)
      expect(asset.sprite!.frameCount).toBeLessThanOrEqual(asset.sprite!.columns * asset.sprite!.rows)
    }
  })

  it('non tocca una mossa con lo stesso id ma un altro nome', () => {
    expect(getPilotVfxAssetId({ id: 37, nome: 'Altra mossa' })).toBeUndefined()
  })

  it('lascia la precedenza all\'editor Admin', () => {
    const move = MOSSE.find(item => item.id === 37)!
    useVfxAdminStore.getState().setOverride({
      moveId: 37, assetId: 'punch', scale: 1, offsetX: 0, offsetY: 0, durationMs: 500, anchor: 'target',
      layer: 'over-pokemon', mirrorForEnemy: true, blendMode: 'normal',
    })
    expect(resolveMoveVfxAsset(move).id).toBe('punch')
  })
})
