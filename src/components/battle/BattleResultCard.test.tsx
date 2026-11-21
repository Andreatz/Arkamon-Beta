import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BattleChronicle } from '@/types'
import { BattleResultCard } from './BattleResultCard'

const chronicle: BattleChronicle = { version: 1, battleId: 'test', nextSequence: 0, omittedEvents: 0, events: [] }

describe('scheda di fine battaglia', () => {
  it('riporta gli ultimi tre messaggi, che non restano più coperti dal box', () => {
    const markup = renderToStaticMarkup(
      <BattleResultCard chronicle={chronicle} outcome="sconfitta" messages={['Primo', 'Vyrath non può più combattere!', 'Hai perso la battaglia...', '-200₳ persi']} />,
    )
    expect(markup).toContain('Squadra sconfitta')
    expect(markup).toContain('class="battle-result-messages" role="status" aria-live="polite"')
    expect(markup).not.toContain('Primo')
    expect(markup.indexOf('Vyrath non può più combattere!')).toBeLessThan(markup.indexOf('Hai perso la battaglia...'))
    expect(markup).toContain('-200₳ persi')
  })

  it('senza messaggi non aggiunge il riquadro', () => {
    const markup = renderToStaticMarkup(<BattleResultCard chronicle={chronicle} outcome="vittoria" />)
    expect(markup).toContain('Vittoria!')
    expect(markup).not.toContain('battle-result-messages')
  })

  it('mostra le monete guadagnate o perse nella scheda, con il segno', () => {
    const gain = renderToStaticMarkup(<BattleResultCard chronicle={chronicle} outcome="vittoria" coinDelta={200} />)
    expect(gain).toContain('battle-result-coins')
    expect(gain).toContain('data-delta="gain"')
    expect(gain).toContain('guadagnati')
    const loss = renderToStaticMarkup(<BattleResultCard chronicle={chronicle} outcome="sconfitta" coinDelta={-200} />)
    expect(loss).toContain('data-delta="loss"')
    expect(loss).toContain('persi')
    expect(renderToStaticMarkup(<BattleResultCard chronicle={chronicle} outcome="vittoria" />)).not.toContain('battle-result-coins')
  })

  it('elenca i livelli guadagnati con il loro incremento', () => {
    const levels: BattleChronicle = { ...chronicle, events: [
      { id: 'x', sequence: 1, kind: 'xp', side: 'A', title: 'XP', messages: [], actor: { instanceId: 'a', name: 'Darklaw', speciesId: 5, level: 7 }, levelBefore: 5, levelAfter: 7 } as never,
    ] }
    const markup = renderToStaticMarkup(<BattleResultCard chronicle={levels} outcome="vittoria" />)
    expect(markup).toContain('Darklaw · Lv. ')
    expect(markup).toContain('+2')
  })
})
