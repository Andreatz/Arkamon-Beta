import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ArkamonBattleSprite } from '../ArkamonBattleSprite'
import type { ArkamonBattleAnimation } from '../arkamonAnimationManifest'

const motionPreference = vi.hoisted(() => ({ reduced: false }))

vi.mock('framer-motion', async (importOriginal) => {
  const original = await importOriginal<typeof import('framer-motion')>()
  return { ...original, useReducedMotion: () => motionPreference.reduced }
})

function renderDarklaw(animation: ArkamonBattleAnimation = 'idle', animationEnabled = true) {
  return renderToStaticMarkup(
    <ArkamonBattleSprite
      speciesId={5}
      name="Darklaw"
      side="front"
      animation={animation}
      animationEnabled={animationEnabled}
      scale={1.75}
      className="h-full w-full"
    />
  )
}

describe('Arkamon battle sprite visual selection', () => {
  beforeEach(() => { motionPreference.reduced = false })

  it('renders the idle as a named, contained responsive atlas at the admin scale', () => {
    const markup = renderDarklaw()
    expect(markup).toContain('role="img" aria-label="Darklaw"')
    expect(markup).toContain('transform:scale(1.75)')
    expect(markup).toContain('transform-origin:center bottom')
    expect(markup).toContain('container-type:size')
    expect(markup).toContain('width:min(100cqw, 100cqh)')
    expect(markup).toContain('height:min(100cqh, 100cqw)')
    expect(markup).toContain('aspect-ratio:1')
    expect(markup).toContain('data-arkamon-renderer="sprite-sheet"')
    expect(markup).toContain('data-arkamon-motion="none"')
    expect(markup).toContain('data-arkamon-playback="playing"')
    expect(markup).toContain('/sprites/arkamon/5/front/idle.webp')
    expect(markup).toContain('background-size:800% 600%')
    expect(markup).toContain('width:100%;height:100%;background-image:')
  })

  it.each(['physical', 'special', 'hit', 'victory'] as const)(
    'keeps the idle artwork and adds procedural %s motion',
    (animation) => {
      const markup = renderDarklaw(animation)
      expect(markup).toContain(`data-arkamon-animation="${animation}"`)
      expect(markup).toContain('data-arkamon-asset-animation="idle"')
      expect(markup).toContain('data-arkamon-motion="procedural"')
      expect(markup).toContain('data-arkamon-playback="playing"')
      expect(markup).toContain('/sprites/arkamon/5/front/idle.webp')
      expect(markup).not.toContain('/front_sprites/5.png')
    }
  )

  it('pauses the same idle visual for KO or reduced motion', () => {
    const markup = renderDarklaw('ko')
    expect(markup).toContain('data-arkamon-playback="paused"')
    expect(markup).toContain('/sprites/arkamon/5/front/idle.webp')
    expect(markup).not.toContain('/front_sprites/5.png')
    motionPreference.reduced = true
    expect(renderDarklaw()).toContain('data-arkamon-playback="paused"')
  })

  it('uses the original PNG without procedural movement when animations are explicitly disabled', () => {
    const markup = renderDarklaw('idle', false)
    expect(markup).toContain('data-arkamon-renderer="procedural"')
    expect(markup).toContain('data-arkamon-playback="paused"')
    expect(markup).toContain('/front_sprites/5.png')
    expect(markup).not.toContain('/arkamon/5/front/idle.webp')
  })

  it.each([
    { speciesId: 5, side: 'back', src: '/back_sprites/5.png' },
    { speciesId: 1, side: 'front', src: '/front_sprites/1.png' },
    { speciesId: 110, side: 'back', src: '/back_sprites/110.png' },
  ] as const)('preserves static art for species $speciesId, view $side', ({ speciesId, side, src }) => {
    const markup = renderToStaticMarkup(
      <ArkamonBattleSprite speciesId={speciesId} name="Arkamon" side={side} animation="physical" scale={0.75} />
    )
    expect(markup).toContain('data-arkamon-renderer="procedural"')
    expect(markup).toContain('transform:scale(0.75)')
    expect(markup).toContain(src)
    expect(markup).toContain('alt="Arkamon"')
    expect(markup).not.toContain('/arkamon/5/front/idle.webp')
  })
})
