import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BattleCaptureLayer, captureHidesTarget, type CaptureDisplay } from './BattleCaptureLayer'
import { SupremeCutIn } from './SupremeCutIn'
import { splashFocusPosition } from './splashFocus'

const display = (patch: Partial<CaptureDisplay>): CaptureDisplay => ({ id: 1, kind: 'dice', phase: 'throw', shake: 0, revealed: [], maxTotal: 10, ...patch })
const points = { from: { x: 27, y: 70 }, to: { x: 73, y: 36 } }

describe('momenti speciali della battaglia', () => {
  it('l’Arkamon selvatico è nascosto solo mentre è dentro la sfera', () => {
    expect(captureHidesTarget(null)).toBe(false)
    expect(captureHidesTarget(display({ phase: 'throw' }))).toBe(false)
    for (const phase of ['absorb', 'settle', 'shake', 'caught'] as const) expect(captureHidesTarget(display({ phase }))).toBe(true)
    expect(captureHidesTarget(display({ phase: 'escaped' }))).toBe(false)
  })

  it('senza cattura in corso non disegna nulla', () => {
    expect(renderToStaticMarkup(<BattleCaptureLayer capture={null} {...points} />)).toBe('')
  })

  it('mostra i dadi rivelati e la somma rispetto al massimo, sopra la sfera', () => {
    const markup = renderToStaticMarkup(<BattleCaptureLayer capture={display({ phase: 'shake', shake: 2, revealed: [{ die: 6, total: 6, holds: true }, { die: 6, total: 12, holds: false }] })} {...points} />)
    expect(markup).toContain('data-battle-capture="shake"')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup.match(/battle-capture__chip[ "]/g)).toHaveLength(2)
    expect(markup).toContain('battle-capture__chip is-break')
    expect(markup).toContain('data-capture-total="12"')
    expect(markup).toMatch(/battle-capture__total is-break">12<span> \/ 10<\/span>/)
    // Ancorata sopra il bersaglio, lontano dall'HUD in basso.
    expect(markup).toContain('left:73%;top:30%')
  })

  it('a cattura riuscita dichiara l’esito; con la Masterball non ci sono dadi', () => {
    const caught = renderToStaticMarkup(<BattleCaptureLayer capture={display({ phase: 'caught', revealed: [{ die: 2, total: 2, holds: true }, { die: 3, total: 5, holds: true }, { die: 4, total: 9, holds: true }] })} {...points} />)
    expect(caught).toContain('Catturato!')
    expect(caught).toContain('is-sealed')
    const master = renderToStaticMarkup(<BattleCaptureLayer capture={display({ kind: 'master', phase: 'caught', maxTotal: null, revealed: [{ die: null, total: 0, holds: true }] })} {...points} />)
    expect(master).toContain('data-capture-kind="master"')
    expect(master).toContain('Catturato!')
    expect(master).not.toContain('battle-capture__chip')
    expect(master).not.toContain('battle-capture__total')
  })

  it('lo stacco della Suprema usa l’illustrazione della specie e il colore del tipo', () => {
    expect(renderToStaticMarkup(<SupremeCutIn display={null} />)).toBe('')
    const markup = renderToStaticMarkup(<SupremeCutIn display={{ id: 4, side: 'A', speciesId: 9, pokemonName: 'Felyss', moveName: 'Sesto Senso', color: 'rgb(232, 121, 249)' }} />)
    expect(markup).toContain('data-supreme-cut-in="A"')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('--supreme-color:rgb(232, 121, 249)')
    expect(markup).toContain('arkamon-splash/')
    expect(markup).toContain('Mossa Suprema')
    expect(markup).toContain('Sesto Senso')
    expect(markup).toContain('Felyss')
    expect(markup).toContain('supreme-cut-in__band is-left')
  })

  it('senza illustrazione ripiega sullo sprite frontale', () => {
    const markup = renderToStaticMarkup(<SupremeCutIn display={{ id: 5, side: 'B', speciesId: 99999, pokemonName: 'Ignoto', moveName: 'Prova', color: 'white' }} />)
    expect(markup).toContain('front_sprites/99999.png')
    expect(markup).toContain('is-sprite')
    expect(markup).toContain('supreme-cut-in__band is-right')
  })

  it('centra il ritaglio sul soggetto dell’illustrazione', () => {
    expect(splashFocusPosition(undefined)).toBe('50% 50%')
    expect(splashFocusPosition({ objectPosition: '40% 60%', focusBounds: undefined })).toBe('40% 60%')
    expect(splashFocusPosition({ objectPosition: '50% 50%', focusBounds: { left: 0.316, top: 0.265, right: 0.552, bottom: 0.798 } })).toBe('43.4% 53.2%')
  })
})
