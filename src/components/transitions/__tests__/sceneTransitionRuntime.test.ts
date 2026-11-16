import { describe, expect, it } from 'vitest'
import { measureTransitionAnchor, supportsViewTransitions } from '../sceneTransitionRuntime'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect
}

/** Scena minima: solo ciò che la misura usa (ambiente di test senza DOM). */
function fakeScene(box: DOMRect, anchors: Record<string, DOMRect>) {
  const selectors: string[] = []
  const scene = {
    getBoundingClientRect: () => box,
    querySelector: (selector: string) => {
      selectors.push(selector)
      const name = /data-transition-anchor="([^"]+)"/.exec(selector)?.[1]
      const anchor = name ? anchors[name] : undefined
      return anchor ? { getBoundingClientRect: () => anchor } : null
    },
  }
  return { scene: scene as unknown as Element, selectors }
}

describe('misure delle transizioni', () => {
  it('trova il centro del nodo in percentuale della scena, anche con il palco scalato', () => {
    const { scene, selectors } = fakeScene(rect(100, 50, 800, 400), { Percorso_2: rect(290, 140, 20, 20) })
    expect(measureTransitionAnchor(scene, 'Percorso_2')).toEqual({ x: 25, y: 25 })
    expect(selectors).toEqual(['[data-transition-anchor="Percorso_2"]'])
  })

  it('rifiuta nomi non sicuri senza interrogare il DOM, nodi assenti e scene senza dimensioni', () => {
    const unsafe = fakeScene(rect(0, 0, 100, 100), {})
    expect(measureTransitionAnchor(unsafe.scene, 'Roma"] , [x')).toBeNull()
    expect(unsafe.selectors).toEqual([])
    expect(measureTransitionAnchor(fakeScene(rect(0, 0, 100, 100), {}).scene, 'Milano')).toBeNull()
    expect(measureTransitionAnchor(fakeScene(rect(0, 0, 0, 0), { Roma: rect(0, 0, 1, 1) }).scene, 'Roma')).toBeNull()
  })

  it('limita il punto ai bordi dello schermo', () => {
    const { scene } = fakeScene(rect(0, 0, 100, 100), { Roma: rect(140, -40, 10, 10) })
    expect(measureTransitionAnchor(scene, 'Roma')).toEqual({ x: 100, y: 0 })
  })

  it('senza View Transitions API l’elemento condiviso ripiega sulla dissolvenza', () => {
    expect(supportsViewTransitions()).toBe(false)
  })
})
