import { describe, expect, it } from 'vitest'
import { getPokemon, POKEMON_BASE } from '@/data'
import { ARKAMON_ASSET_CATALOG, filterArkamonAssetCatalog, getArkamonAssetEntry, getAssetPortraitViewBox } from '../arkamonAssetCatalog'

describe('graphic assets remain separate from playable forms', () => {
  it('catalogs a front sprite for every one of the 206 playable species', () => {
    expect(ARKAMON_ASSET_CATALOG).toHaveLength(206)
    expect(POKEMON_BASE).toHaveLength(206)
    expect(ARKAMON_ASSET_CATALOG.every(entry => entry.status === 'game-data-present')).toBe(true)
    for (const entry of ARKAMON_ASSET_CATALOG) {
      expect(Object.keys(entry).sort()).toEqual(['id', 'sprites', 'status'])
      expect(Boolean(getPokemon(entry.id))).toBe(true)
      expect(entry.sprites.front).toBeDefined()
      for (const sprite of Object.values(entry.sprites)) {
        expect(sprite!.source).toMatch(/^\/sprites\/(front_sprites|back_sprites|small_sprites)\/.+\.png$/)
        expect(sprite!.sha256).toMatch(/^[a-f0-9]{64}$/)
        expect(sprite!.bytes).toBeGreaterThan(0)
      }
    }
    // 194 e 195 (Flastorm) usano un segnaposto finché non arriva lo sprite.
    for (const id of [194, 195]) expect(getArkamonAssetEntry(id)?.sprites.front).toBeDefined()
    expect(getArkamonAssetEntry(207)).toBeUndefined()
  })

  it('filters animated assets; no species is still waiting for game data', () => {
    const animated = new Set([1, 111, 116, 117, 134, 139])
    expect(filterArkamonAssetCatalog('animated', animated).map(entry => entry.id)).toEqual([1, 111, 116, 117, 134, 139])
    expect(filterArkamonAssetCatalog('pending-game-data', animated)).toEqual([])
    expect(filterArkamonAssetCatalog('all', animated)).toHaveLength(206)
  })

  it('fits all visible pixels, including rectangular artwork, without changing source rasters', () => {
    const sprite = getArkamonAssetEntry(150)!.sprites.front!
    const [left, top, width, height] = getAssetPortraitViewBox(sprite).split(' ').map(Number)
    expect(left).toBeLessThan(sprite.alphaBounds[0])
    expect(top).toBeLessThan(sprite.alphaBounds[1])
    expect(left + width).toBeGreaterThan(sprite.alphaBounds[2])
    expect(top + height).toBeGreaterThan(sprite.alphaBounds[3])
    expect(getArkamonAssetEntry(150)!.sprites.back).toBeUndefined()
    expect(getAssetPortraitViewBox({ ...sprite, alphaBounds: [2, 1, 7, 5] })).toBe('1.8 0.8 5.4 4.4')
  })
})
