import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { SceneId } from '@/types'
import { assetUrl } from '@/utils/assetUrl'
import { SceneTransitionOverlay } from '../SceneTransitionOverlay'
import { getSceneTransitionProfile, TRANSITION_VIDEO_PATH, type SceneTransitionProfile } from '../sceneTransitionProfiles'

function overlayMarkup(scena: SceneId, phase: 'cover' | 'reveal', startCovered = false, profile?: SceneTransitionProfile) {
  return renderToStaticMarkup(
    <SceneTransitionOverlay
      phase={phase}
      startCovered={startCovered}
      profile={profile ?? getSceneTransitionProfile({ scena })}
      onCovered={vi.fn()}
      onRevealed={vi.fn()}
    />,
  )
}

describe('scene transition artwork selection', () => {
  it('does not hide ordinary navigation behind the special D6 sequence', () => {
    const markup = overlayMarkup('mappa-principale', 'cover')
    expect(markup).toContain('data-transition-mode="fade"')
    expect(markup).not.toContain('data-transition-artwork')
    expect(markup).not.toContain('<video')
  })
  it.each(['cover', 'reveal'] as const)('never mounts a die at battle entry during %s', (phase) => {
    for (const startCovered of [false, true]) {
      const markup = overlayMarkup('battaglia', phase, startCovered)
      expect(markup).toContain('data-transition-mode="battle-vs"')
      // Senza battaglia nello store la scheda mostra soltanto il titolo.
      expect(markup).toContain('data-battle-vs="generic"')
      expect(markup).toContain('Battaglia!')
      expect(markup).not.toContain('<video')
      expect(markup).not.toContain('data-transition-artwork')
      expect(markup).not.toContain('arkamon-d6-closed.webp')
      expect(markup).not.toContain('arkamon-d6-open.webp')
      expect(markup).not.toContain('arka-d6-board')
      expect(markup).not.toContain('arka-d6-fallback')
      expect(markup).not.toContain('data-transition-light="dice-interior"')
    }
  })

  it('la modalità video resta disponibile se un profilo la richiede', () => {
    const markup = overlayMarkup('battaglia', 'reveal', false, { ...getSceneTransitionProfile({ scena: 'battaglia' }), mode: 'battle-video' })
    expect(markup).toContain('data-transition-mode="battle-video"')
    expect(markup).toContain(`src="${assetUrl(TRANSITION_VIDEO_PATH)}"`)
    expect(markup).toContain('data-ready="false"')
    expect(markup).not.toContain('data-battle-vs')
  })

  it.each(['evoluzione'] as const)('retains both D6 poses for %s', (scena) => {
    const markup = overlayMarkup(scena, 'cover')
    expect(markup).toContain('data-transition-mode="arkamon-dice"')
    expect(markup).toContain('data-transition-artwork="arkamon-d6"')
    expect(markup).toContain('arkamon-d6-closed.webp')
    expect(markup).toContain('arkamon-d6-open.webp')
    expect(markup).not.toContain('<video')
  })
})

describe('livelli della libreria di transizioni', () => {
  const map = { scena: 'mappa-principale' } as const
  const venice = { scena: 'citta', payload: { luogo: 'Venezia' } } as const

  it('l’iride dello zoom si centra sul nodo ricevuto', () => {
    const markup = renderToStaticMarkup(<SceneTransitionOverlay phase="cover" startCovered={false}
      profile={getSceneTransitionProfile(venice, map)} anchor={{ x: 41.5, y: 22 }} onCovered={vi.fn()} onRevealed={vi.fn()} />)
    expect(markup).toContain('data-transition-mode="zoom-in"')
    expect(markup).toContain('data-transition-layer="iris"')
    expect(markup).toContain('--tx-x:41.5%')
    expect(markup).toContain('--tx-y:22%')
  })

  it('senza nodo il punto di fuga è il centro', () => {
    const markup = overlayMarkup('mappa-principale', 'reveal', false, getSceneTransitionProfile(map, { scena: 'laboratorio' }))
    expect(markup).toContain('data-transition-layer="iris"')
    expect(markup).toContain('--tx-x:50%')
  })

  it('disegna lama diagonale e pennellate come livelli propri', () => {
    const diagonal = overlayMarkup('percorso', 'cover', false, getSceneTransitionProfile({ scena: 'percorso', payload: { luogo: 'Percorso_2' } }, venice))
    expect(diagonal).toContain('data-transition-layer="diagonal"')
    const brush = overlayMarkup('laboratorio', 'cover', false, getSceneTransitionProfile({ scena: 'laboratorio' }, { scena: 'titolo' }))
    expect(brush).toContain('data-transition-layer="brush"')
    expect(brush.match(/arka-tx-brush__stroke/g)).toHaveLength(5)
  })

  it('bianco, nero ed elemento condiviso non montano livelli aggiuntivi', () => {
    for (const profile of [getSceneTransitionProfile(map, { scena: 'battaglia' }), getSceneTransitionProfile({ scena: 'deposito' }, map), getSceneTransitionProfile({ scena: 'titolo' }, map)]) {
      const markup = overlayMarkup('mappa-principale', 'cover', false, profile)
      expect(markup).toContain(`data-transition-mode="${profile.mode}"`)
      expect(markup).not.toContain('data-transition-layer')
    }
  })
})
