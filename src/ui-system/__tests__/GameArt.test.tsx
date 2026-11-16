import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import catalog from '@/data/gameArt.json'
import { GameArt, gameArtForIcon, gameArtForMenu, gameArtUrl, hasGameArt } from '../GameArt'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('GameArt', () => {
  it('ogni voce del catalogo ha il file pubblico e misure valide', () => {
    for (const asset of catalog.assets) {
      expect(existsSync(resolve('public/ui/game-art', asset.file)), asset.file).toBe(true)
      expect(asset.width).toBeGreaterThan(0)
      expect(asset.height).toBeGreaterThan(0)
    }
  })

  it('disegna l’illustrazione con le misure del catalogo', () => {
    const markup = renderToStaticMarkup(<GameArt id="logo" className="extra" />)
    expect(markup).toContain('data-game-art="logo"')
    expect(markup).toContain('src="/ui/game-art/logo.webp"')
    expect(markup).toContain('class="game-art extra"')
    expect(markup).toMatch(/width="\d+"/)
  })

  it('non disegna nulla per un id assente', () => {
    expect(hasGameArt('non-esiste')).toBe(false)
    expect(gameArtUrl('non-esiste')).toBeUndefined()
    expect(renderToStaticMarkup(<GameArt id="non-esiste" />)).toBe('')
  })

  it('collega icone e voci del menù solo alle illustrazioni presenti', () => {
    expect(gameArtForIcon('item-potion')).toBe('item-potion')
    expect(gameArtForIcon('item-coin')).toBe('coin')
    expect(gameArtForIcon('icon-team')).toBeUndefined()
    expect(gameArtForMenu('icon-team')).toBe('menu-team')
    expect(gameArtForMenu('item-potion')).toBeUndefined()
  })
})
