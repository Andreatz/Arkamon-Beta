import { renderToStaticMarkup } from 'react-dom/server'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { POKEMON_BASE } from '@/data'
import { SpeciesPortrait } from '../kit'
import { getPortraitFraming } from '../portraitFraming'

const samples = [
  '/sprites/front_sprites/13.png', '/sprites/front_sprites/25.png',
  '/sprites/front_sprites/56.png', '/sprites/front_sprites/76.png', '/sprites/front_sprites/110.png',
  '/sprites/front_sprites/19.png', '/sprites/front_sprites/24.png',
  '/sprites/front_sprites/34.png', '/sprites/front_sprites/35.png',
  '/sprites/front_sprites/36.png', '/sprites/front_sprites/37.png', '/sprites/front_sprites/38.png',
]

describe('Whole-creature portrait framing', () => {
  it.each(samples)('centres every visible pixel of %s without changing its aspect ratio', async source => {
    const { data, info } = await sharp(resolve(`public${source}`)).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true })
    let left = info.width, top = info.height, right = 0, bottom = 0
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[y * info.width + x] === 0) continue
        left = Math.min(left, x); top = Math.min(top, y)
        right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1)
      }
    }
    const frame = getPortraitFraming(source)
    const [x, y, width, height] = frame.viewBox.split(' ').map(Number)
    expect(frame.width).toBe(info.width)
    expect(frame.height).toBe(info.height)
    expect(width).toBe(height)
    expect(width).toBeGreaterThan(Math.max(right - left, bottom - top))
    expect(x).toBeLessThan(left)
    expect(y).toBeLessThan(top)
    expect(x + width).toBeGreaterThan(right)
    expect(y + height).toBeGreaterThan(bottom)
    expect(x + width / 2).toBeCloseTo((left + right) / 2)
    expect(y + height / 2).toBeCloseTo((top + bottom) / 2)
  })

  it('uses the official front sprite and its own geometry for every species, with or without animation', () => {
    expect(POKEMON_BASE).toHaveLength(110)
    for (const species of POKEMON_BASE) {
      const source = `/sprites/front_sprites/${species.id}.png`
      for (const large of [false, true]) {
        const markup = renderToStaticMarkup(<SpeciesPortrait speciesId={species.id} large={large} selected />)
        expect(markup).toContain(`data-creature-source="${source}"`)
        expect(markup).toContain(`viewBox="${getPortraitFraming(source).viewBox}"`)
        expect(markup).toContain('preserveAspectRatio="xMidYMid meet"')
        expect(markup).not.toContain('/sprites/arkamon/')
        expect(markup).not.toContain('idle-poster.webp')
      }
    }
  })
})
