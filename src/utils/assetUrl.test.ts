import { describe, expect, it } from 'vitest'
import { resolveAssetUrl } from './assetUrl'

const revision = 'a'.repeat(40)
describe('immutable media distribution and local graphics', () => {
  it('keeps local UI, maps and native portraits under the Pages base', () => {
    for (const value of ['/ui/game/button.svg', '/maps/Mappa-Finale.jpg', '/sprites/arkamon/13/front/idle-poster.webp']) {
      expect(resolveAssetUrl(value, '/Arkamon-Beta/', revision)).toBe('/Arkamon-Beta' + value)
    }
  })
  it('pins heavy native, VFX and sound files to the same immutable revision', () => {
    for (const value of ['/sprites/arkamon-paged/13/front/attack/page-01.webp', '/vfx/moves/attack.webp', '/sounds/a #1/50%?.wav']) {
      const expected = value.slice(1).split('/').map(encodeURIComponent).join('/')
      expect(resolveAssetUrl(value, '/Arkamon-Beta/', revision)).toBe(`https://raw.githubusercontent.com/Andreatz/Arkamon-Beta/${revision}/public/${expected}`)
    }
  })
  it('uses an explicit CDN without credentials or URL suffixes and encodes filenames once', () => {
    expect(resolveAssetUrl('/sounds/a #1.wav', '/', revision, 'https://media.example/arkamon/v2')).toBe('https://media.example/arkamon/v2/sounds/a%20%231.wav')
    for (const origin of ['javascript:alert(1)', 'https://key@media.example/', 'https://media.example/?key=a', 'https://media.example/#a']) {
      expect(() => resolveAssetUrl('/sounds/a.wav', '/', revision, origin)).toThrow('Invalid media origin')
    }
  })
  it('retains a fully local offline build and existing external/blob/data sources', () => {
    expect(resolveAssetUrl('/sprites/arkamon-paged/13/front/attack/page-01.webp', '/')).toBe('/sprites/arkamon-paged/13/front/attack/page-01.webp')
    expect(resolveAssetUrl('sounds/a #1.wav', '/', undefined, undefined, true)).toBe('/sounds/a%20%231.wav')
    for (const url of ['https://example/a.webp', 'blob:example', 'data:image/png;base64,AA']) expect(resolveAssetUrl(url, '/', revision)).toBe(url)
  })
})
