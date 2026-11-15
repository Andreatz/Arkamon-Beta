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
})
