import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ArkamonBattleSprite,
  completeArkamonPlayback,
  requestArkamonPlayback,
  type ArkamonPlaybackState,
} from '../ArkamonBattleSprite'
import type { ArkamonBattleAnimation } from '../arkamonAnimationManifest'

const motionPreference = vi.hoisted(() => ({ reduced: false }))

vi.mock('framer-motion', async (importOriginal) => {
  const original = await importOriginal<typeof import('framer-motion')>()
  return { ...original, useReducedMotion: () => motionPreference.reduced }
})

describe('complete action playback', () => {
  const attack: ArkamonPlaybackState = {
    animation: 'attack', replayKey: 7, generation: 10,
    requestedAnimation: 'attack', requestedReplayKey: 7, completed: false,
  }

  it('finishes an attack before honoring the battle’s early idle request', () => {
    const earlyIdle = requestArkamonPlayback(attack, 'idle', 7, true)
    expect(earlyIdle.animation).toBe('attack')
    expect(earlyIdle.generation).toBe(attack.generation)
    expect(completeArkamonPlayback(earlyIdle, attack.generation).animation).toBe('idle')
  })

  it('lets an explicit new idle request interrupt a preview action', () => {
    const explicitIdle = requestArkamonPlayback(attack, 'idle', 8, false)
    expect(explicitIdle.animation).toBe('idle')
    expect(completeArkamonPlayback(explicitIdle, attack.generation)).toBe(explicitIdle)
  })

  it('ignores completion from an interrupted action and completes the new one', () => {
    const hit = requestArkamonPlayback(attack, 'hit', 8, true)
    expect(hit.animation).toBe('hit')
    expect(completeArkamonPlayback(hit, attack.generation)).toBe(hit)
    expect(completeArkamonPlayback(hit, hit.generation).animation).toBe('idle')
  })

  it('keeps KO after its full clip and permits a later return to idle', () => {
    const ko = requestArkamonPlayback(attack, 'ko', 8, true)
    const completed = completeArkamonPlayback(ko, ko.generation)
    expect(completed).toMatchObject({ animation: 'ko', completed: true })
    expect(completeArkamonPlayback(completed, completed.generation)).toBe(completed)
    expect(requestArkamonPlayback(completed, 'idle', 9, true).animation).toBe('idle')
  })
})

function renderDarklaw(animation: ArkamonBattleAnimation = 'idle', animationEnabled = true) {
  return renderToStaticMarkup(
    <ArkamonBattleSprite
      speciesId={5} name="Darklaw" side="front" animation={animation}
      animationEnabled={animationEnabled} scale={1.75} className="h-full w-full"
    />
  )
}

describe('Arkamon battle sprite visual selection', () => {
  beforeEach(() => { motionPreference.reduced = false })

  it('fills the battle slot with a named responsive atlas at the configured scale', () => {
    const markup = renderDarklaw()
    expect(markup).toContain('role="img" aria-label="Darklaw"')
    expect(markup).toContain('transform:scale(1.75)')
    expect(markup).toContain('transform-origin:center bottom')
    expect(markup).toContain('container-type:size')
    expect(markup).toContain('data-arkamon-renderer="sprite-sheet"')
    expect(markup).toContain('data-sprite-frame-count="96"')
    expect(markup).toContain('data-sprite-fps="24"')
  })

  it.each(['attack', 'hit', 'victory', 'ko'] as const)('selects the full dedicated %s clip without stacking procedural motion', (animation) => {
    const markup = renderDarklaw(animation)
    expect(markup).toContain(`data-arkamon-animation="${animation}"`)
    expect(markup).toContain(`data-arkamon-asset-animation="${animation}"`)
    expect(markup).toContain('data-arkamon-motion="none"')
    expect(markup).toContain(`/sprites/arkamon/5/front/${animation}.webp`)
    expect(markup).not.toContain('/front_sprites/5.png')
    expect(markup).not.toContain('/front/idle.webp')
    expect(markup).toContain('data-sprite-paused="false"')
  })

  it('uses reduced motion when the preference is set at mount', () => {
    motionPreference.reduced = true
    expect(renderDarklaw()).toContain('data-sprite-paused="true"')
  })

  it('uses the original PNG when animations are explicitly disabled', () => {
    const markup = renderDarklaw('idle', false)
    expect(markup).toContain('data-arkamon-playback="paused"')
    expect(markup).toContain('/front_sprites/5.png')
    expect(markup).not.toContain('/arkamon/5/front/idle.webp')
  })

  it.each([
    { speciesId: 5, side: 'back', src: '/back_sprites/5.png' },
    { speciesId: 1, side: 'front', src: '/front_sprites/1.png' },
    { speciesId: 110, side: 'back', src: '/back_sprites/110.png' },
  ] as const)('preserves existing art for species $speciesId, view $side', ({ speciesId, side, src }) => {
    const markup = renderToStaticMarkup(
      <ArkamonBattleSprite speciesId={speciesId} name="Arkamon" side={side} animation="attack" scale={0.75} />
    )
    expect(markup).toContain('data-arkamon-renderer="procedural"')
    expect(markup).toContain('transform:scale(0.75)')
    expect(markup).toContain(src)
    expect(markup).toContain('alt="Arkamon"')
  })
})
