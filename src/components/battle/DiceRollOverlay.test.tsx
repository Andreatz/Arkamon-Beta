import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DiceRollOverlay, type DiceRollDisplay } from './DiceRollOverlay'

function rollWith(rolls: number[], overrides: Partial<DiceRollDisplay> = {}): DiceRollDisplay {
  return {
    id: 17,
    side: 'A',
    moveName: 'Mossa di prova',
    rolls,
    increment: 2,
    damage: 9,
    ...overrides,
  }
}

describe('battle dice overlay', () => {
  it('preserves engine values while withholding final damage before dice are displayed', () => {
    const markup = renderToStaticMarkup(
      <DiceRollOverlay roll={rollWith([1, 2, 3, 4, 5, 6], { damage: 14 })} />,
    )
    expect(markup).toContain('Lancio giocatore')
    expect(markup).toContain('Mossa di prova')
    expect(markup.match(/role="img"/g)).toHaveLength(6)
    for (let value = 1; value <= 6; value++) {
      expect(markup).toContain(`aria-label="Dado: ${value}"`)
    }
    expect(markup).toContain('Dadi: 1 + 2 + 3 + 4 + 5 + 6 + 2 = 23')
    expect(markup).not.toContain('Danno finale')
    expect(markup).toContain('data-dice-revealed="false"')
    expect(markup.match(/class="battle-die-frames"/g)).toHaveLength(6)
  })

  it('keeps all twenty high-level dice and their exact sum in a grid that can wrap on mobile', () => {
    const rolls = Array.from({ length: 20 }, (_, index) => index % 6 + 1)
    const markup = renderToStaticMarkup(
      <DiceRollOverlay roll={rollWith(rolls, { increment: 4, damage: 100 })} />,
    )
    expect(markup.match(/aria-label="Dado: [1-6]"/g)).toHaveLength(20)
    expect(markup.match(/class="battle-die-frames"/g)).toHaveLength(20)
    for (let value = 1; value <= 6; value++) {
      const expectedCount = rolls.filter((result) => result === value).length
      expect(markup.match(new RegExp(`aria-label="Dado: ${value}"`, 'g')))
        .toHaveLength(expectedCount)
    }
    expect(markup).toContain(`Dadi: ${rolls.join(' + ')} + 4 = 70`)
    expect(markup).not.toContain('Danno finale')
    expect(markup).toContain('--battle-dice-columns:6')
    expect(markup).toContain('--battle-dice-mobile-columns:4')
  })

  it('preserves opponent values and totals when missing images need a numerical fallback', () => {
    const markup = renderToStaticMarkup(
      <DiceRollOverlay
        roll={rollWith([2, 6], { side: 'B', increment: 1, damage: 5 })}
        forceFallback
      />,
    )
    expect(markup).toContain('Lancio avversario')
    expect(markup).toContain('aria-label="Dado: 2"')
    expect(markup).toContain('aria-label="Dado: 6"')
    expect(markup.match(/class="battle-die-fallback"/g)).toHaveLength(2)
    expect(markup).not.toContain('battle-die-frames')
    expect(markup).toContain('Dadi: 2 + 6 + 1 = 9')
    expect(markup).not.toContain('Danno finale')
  })

  it('ingrandisce i dadi quando sono pochi e torna alla griglia compatta quando sono molti', () => {
    const single = renderToStaticMarkup(<DiceRollOverlay roll={rollWith([4])} />)
    expect(single).toContain('--battle-dice-cell-width:210px')
    const three = renderToStaticMarkup(<DiceRollOverlay roll={rollWith([2, 4, 6])} />)
    expect(three).toContain('--battle-dice-cell-width:168px')
    const twenty = renderToStaticMarkup(<DiceRollOverlay roll={rollWith(Array.from({ length: 20 }, () => 3))} />)
    expect(twenty).toContain('--battle-dice-cell-width:80px')
    expect(twenty).toContain('--battle-dice-mobile-cell-width:50px')
  })

  it('a risultato rivelato mostra il totale in grande, la riga testuale e l’efficacia', () => {
    const markup = renderToStaticMarkup(
      <DiceRollOverlay staticPreview roll={rollWith([2, 4, 6], { damage: 21, tone: 'super' })} />,
    )
    expect(markup).toContain('data-dice-tone="super"')
    // Il numero grande è decorativo; la riga testuale resta la fonte accessibile.
    expect(markup).toMatch(/<span aria-hidden="true" class="battle-dice-total arka-battle-font"[^>]*>21<\/span>/)
    expect(markup).toContain('Danno finale: 21')
    expect(markup).toContain('Superefficace!')
    const normal = renderToStaticMarkup(<DiceRollOverlay staticPreview roll={rollWith([1], { damage: 3 })} />)
    expect(normal).toContain('data-dice-tone="normal"')
    expect(normal).not.toContain('Superefficace!')
    expect(normal).not.toContain('Poco efficace')
  })
})
