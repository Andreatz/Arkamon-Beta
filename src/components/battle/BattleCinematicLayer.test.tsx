import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BattleDamageNumber, BattleMoveBanner } from './BattleCinematicLayer'
import { HpBar } from './BattlePresentation'

describe('elementi scenici della battaglia', () => {
  it('senza nulla da mostrare non lascia elementi nel DOM', () => {
    expect(renderToStaticMarkup(<BattleMoveBanner banner={null} />)).toBe('')
    expect(renderToStaticMarkup(<BattleDamageNumber display={null} position={null} />)).toBe('')
    expect(renderToStaticMarkup(<BattleDamageNumber display={{ id: 1, side: 'B', amount: 5, tone: 'normal', ko: false }} position={null} />)).toBe('')
  })

  it('la fascia riporta la mossa, il lato e il colore del tipo senza duplicare gli annunci', () => {
    const markup = renderToStaticMarkup(<BattleMoveBanner banner={{ id: 3, side: 'B', name: 'Immersione', color: 'rgb(56, 189, 248)', suprema: false }} />)
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('data-battle-move-banner="B"')
    expect(markup).toContain('--battle-move-color:rgb(56, 189, 248)')
    expect(markup).toContain('Immersione')
    expect(markup).not.toContain('Mossa Suprema')
  })

  it('la Suprema ha la propria intestazione', () => {
    const markup = renderToStaticMarkup(<BattleMoveBanner banner={{ id: 4, side: 'A', name: 'Soffio', color: 'white', suprema: true }} />)
    expect(markup).toContain('is-supreme')
    expect(markup).toContain('Mossa Suprema')
    expect(markup).toContain('Soffio')
  })

  it('il numero del danno sta sul bersaglio e dichiara efficacia e KO', () => {
    const markup = renderToStaticMarkup(
      <BattleDamageNumber display={{ id: 9, side: 'B', amount: 24, tone: 'super', ko: true }} position={{ x: 73, y: 36 }} />,
    )
    expect(markup).toContain('data-battle-damage-number="B"')
    expect(markup).toContain('left:73%')
    expect(markup).toContain('top:36%')
    expect(markup).toContain('is-super')
    expect(markup).toContain('is-ko')
    expect(markup).toContain('−24')
    expect(markup).toContain('Superefficace!')
    const weak = renderToStaticMarkup(<BattleDamageNumber display={{ id: 10, side: 'A', amount: 2, tone: 'weak', ko: false }} position={{ x: 27, y: 70 }} />)
    expect(weak).toContain('Poco efficace…')
    expect(weak).not.toContain('is-ko')
  })

  it('la barra HP ha la scia del danno dietro il riempimento', () => {
    const markup = renderToStaticMarkup(<HpBar nome="Vyrath" livello={10} hp={12} hpMax={19} side="player" />)
    const ghost = markup.indexOf('data-battle-hp-ghost')
    expect(ghost).toBeGreaterThan(-1)
    // La scia è disegnata prima del riempimento, quindi resta sotto.
    expect(markup.match(/<rect/g)).toHaveLength(2)
    expect(ghost).toBeLessThan(markup.lastIndexOf('<rect'))
    expect(markup).toContain('data-battle-hp="12"')
  })
})
