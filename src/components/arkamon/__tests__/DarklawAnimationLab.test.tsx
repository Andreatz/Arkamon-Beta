import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DarklawAnimationLab } from '../DarklawAnimationLab'
import sourceCountsNovember16 from './fixtures/native-import-2026-11-16.json'

vi.mock('@/settings/gamePreferences', () => ({ useGameMotionPreferences: () => ({ speed: 1, reducedMotion: false }) }))
vi.mock('../ArkamonBattleSprite', () => ({ ArkamonBattleSprite: ({ speciesId }: { speciesId: number }) => <span data-test-native-sprite={speciesId} /> }))
vi.mock('../ArkamonAttackPreview', () => ({ ArkamonAttackPreview: () => <section data-test-attack-preview="true" /> }))

describe('laboratory for playable and unfinished forms', () => {
  it.each([205, 184, 206])('shows supplied sprite %s without fake animation controls or a missing back request', id => {
    const markup = renderToStaticMarkup(<DarklawAnimationLab initialSpeciesId={id} />)
    expect(markup).toContain(`data-preview-species="${id}"`)
    expect(markup).toContain('data-asset-status="game-data-present"')
    expect(markup).toContain('data-preview-available="false"')
    expect(markup).toContain(`data-asset-portrait="/sprites/front_sprites/${id}.png"`)
    expect(markup).not.toContain('data-asset-pending')
    expect(markup).toContain('Nessun video disponibile')
    expect(markup).toContain('disabled="">Retro</button>')
    expect(markup).not.toContain(`/back_sprites/${id}.png`)
    expect(markup).not.toContain('Prova la sequenza')
    expect(markup).not.toContain('Fotogramma sorgente')
    expect(markup).not.toContain('data-test-attack-preview')
    expect(markup).not.toContain('data-test-native-sprite')
    expect(markup).toContain('Catalogo grafico')
    expect(markup).toContain('Tutti · 204')
    expect(markup).toContain('Dati da definire · 1')
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

  it('enables move simulation for authored animated forms while keeping form 130 in preview', () => {
    const expansionAnimatedIds = [
      ...Array.from({ length: 56 }, (_, index) => index + 111),
      ...Object.keys(sourceCountsNovember16).map(Number),
    ]
    for (const id of expansionAnimatedIds) {
      const markup = renderToStaticMarkup(<DarklawAnimationLab initialSpeciesId={id} />)
      expect(markup).toContain(id === 130 ? 'data-asset-status="pending-game-data"' : 'data-asset-status="game-data-present"')
      expect(markup).toContain('data-preview-available="true"')
      if (id === 130) {
        expect(markup).toContain('Nome, mosse e attributi da definire')
        expect(markup).not.toContain('data-test-attack-preview')
      } else {
        expect(markup).not.toContain('data-asset-pending')
        expect(markup).toContain('data-test-attack-preview')
      }
      expect(markup).not.toContain(`/back_sprites/${id}.png`)
    }
  })
})
