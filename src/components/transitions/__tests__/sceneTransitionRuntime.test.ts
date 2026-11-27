import { describe, expect, it } from 'vitest'
import { supportsViewTransitions } from '../sceneTransitionRuntime'

describe('capacità delle transizioni', () => {
  it('senza View Transitions API l’elemento condiviso ripiega sulla dissolvenza', () => {
    expect(supportsViewTransitions()).toBe(false)
  })
})
