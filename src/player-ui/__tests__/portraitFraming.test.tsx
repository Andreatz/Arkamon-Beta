import { renderToStaticMarkup } from 'react-dom/server'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { SpeciesPortrait } from '../kit'
import { getPortraitFraming } from '../portraitFraming'

const samples = [
  '/sprites/front_sprites/13.png', '/sprites/front_sprites/25.png',
  '/sprites/front_sprites/56.png', '/sprites/front_sprites/76.png', '/sprites/front_sprites/110.png',
  '/sprites/arkamon/13/front/idle-poster.webp', '/sprites/arkamon/19/front/idle-poster.webp',
  '/sprites/arkamon/24/front/idle-poster.webp',
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

  it('uses each source’s own geometry for a poster and its static fallback', () => {
    const poster = getPortraitFraming('/sprites/arkamon/13/front/idle-poster.webp')
    const fallback = getPortraitFraming('/sprites/front_sprites/13.png')
    expect(poster.width).not.toBe(fallback.width)
    expect(poster.viewBox).not.toBe(fallback.viewBox)
    const markup = renderToStaticMarkup(<SpeciesPortrait speciesId={13} />)
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"')
    expect(markup).toContain('data-creature-source="/sprites/arkamon/13/front/idle-poster.webp"')
    expect(markup).toContain(`viewBox="${poster.viewBox}"`)
  })

  it('renders a species without animation using its complete original sprite', () => {
    const markup = renderToStaticMarkup(<SpeciesPortrait speciesId={110} large />)
    expect(markup).toContain('data-creature-source="/sprites/front_sprites/110.png"')
    expect(markup).toContain(`viewBox="${getPortraitFraming('/sprites/front_sprites/110.png').viewBox}"`)
    expect(markup).not.toContain('idle-poster.webp')
  })
})
