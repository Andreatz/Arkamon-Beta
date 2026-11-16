import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ScreenFxLayer, useScreenFx } from '../ScreenFx'
import { Stage, StageLayer } from '../Stage'

function Fx() {
  const fx = useScreenFx()
  return <ScreenFxLayer fx={fx} />
}

describe('palco', () => {
  it('a riposo non altera la geometria del piano focale', () => {
    const markup = renderToStaticMarkup(
      <Stage className="battle-world" data-battle-world>
        <StageLayer depth={0.85} bleed={1.04} className="fondale" />
        <StageLayer><span data-attore /></StageLayer>
      </Stage>,
    )
    expect(markup).toContain('class="arka-motion-stage battle-world"')
    expect(markup).toContain('data-battle-world="true"')
    // Il mondo e il piano focale non hanno trasformazioni: le coordinate dei figli restano quelle del layout.
    expect(markup).toMatch(/<div class="arka-motion-world" data-stage-world="true" style="transform:none[^"]*">/)
    expect(markup).toMatch(/<div class="arka-motion-layer " data-stage-depth="1"><span data-attore="true"><\/span><\/div>/)
    // Il fondale riceve soltanto il margine fisso.
    expect(markup).toMatch(/class="arka-motion-layer fondale" data-stage-depth="0.85" style="transform:scale\(1\.04\)[^"]*"/)
  })

  it('fuori da un palco il livello resta un contenitore semplice', () => {
    expect(renderToStaticMarkup(<StageLayer depth={0.5} className="isolato" />)).toBe('<div class="arka-motion-layer isolato" data-stage-depth="0.5"></div>')
  })

  it('gli effetti a schermo intero partono invisibili e fuori dall’albero di accessibilità', () => {
    const markup = renderToStaticMarkup(<Fx />)
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toMatch(/arka-motion-fx__veil" style="opacity:0;background-color:var\(--motion-fx-black\)"/)
    expect(markup.match(/transform:scaleY\(0\)/g)).toHaveLength(2)
  })
})
