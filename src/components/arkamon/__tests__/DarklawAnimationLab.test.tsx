import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DarklawAnimationLab } from '../DarklawAnimationLab'
import sourceCountsNovember16 from './fixtures/native-import-2026-11-16.json'

vi.mock('@/settings/gamePreferences', () => ({ useGameMotionPreferences: () => ({ speed: 1, reducedMotion: false }) }))
vi.mock('../ArkamonBattleSprite', () => ({ ArkamonBattleSprite: ({ speciesId }: { speciesId: number }) => <span data-test-native-sprite={speciesId} /> }))
vi.mock('../ArkamonAttackPreview', () => ({ ArkamonAttackPreview: () => <section data-test-attack-preview="true" /> }))

describe('laboratory for unfinished graphic assets', () => {
  it.each([205, 184, 206])('shows Database species %s as playable, with the front sprite and without a missing back request', id => {
    const markup = renderToStaticMarkup(<DarklawAnimationLab initialSpeciesId={id} />)
    expect(markup).toContain(`data-preview-species="${id}"`)
    expect(markup).toContain('data-asset-status="game-data-present"')
    expect(markup).not.toContain('Nome, mosse e attributi da definire')
    expect(markup).not.toContain(`/back_sprites/${id}.png`)
    expect(markup).toContain('Catalogo grafico')
    expect(markup).toContain('Tutti · 206')
    expect(markup).toContain('Dati da definire · 0')
  })

  it('retains complete native actions and the real move preview for playable forms', () => {
    const markup = renderToStaticMarkup(<DarklawAnimationLab initialSpeciesId={5} />)
    expect(markup).toContain('data-asset-status="game-data-present"')
    expect(markup).toContain('data-preview-available="true"')
    expect(markup).toContain('Prova la sequenza')
    expect(markup).toContain('Fotogramma sorgente')
    expect(markup).toContain('data-test-attack-preview')
    expect(markup).not.toContain('data-asset-pending')
  })

  it('treats the supplied new animation forms as playable Database species', () => {
    const animatedIds = [
      ...Array.from({ length: 56 }, (_, index) => index + 111),
      ...Object.keys(sourceCountsNovember16).map(Number),
    ]
    for (const id of animatedIds) {
      const markup = renderToStaticMarkup(<DarklawAnimationLab initialSpeciesId={id} />)
      expect(markup).toContain('data-asset-status="game-data-present"')
      expect(markup).not.toContain('Nome, mosse e attributi da definire')
      expect(markup).not.toContain(`/back_sprites/${id}.png`)
    }
  })
})
