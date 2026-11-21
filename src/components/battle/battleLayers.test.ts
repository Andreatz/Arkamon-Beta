import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BATTLE_DICE_EXIT_MS, battleDiceDismissDelayMs } from './battleDiceAssets'

const tokens = readFileSync(new URL('../../ui-system/tokens.css', import.meta.url), 'utf8')
const layer = (name: string) => {
  const match = tokens.match(new RegExp(`--battle-z-${name}:\\s*(\\d+);`))
  if (!match) throw new Error(`Livello --battle-z-${name} mancante`)
  return Number(match[1])
}

describe('ordine dei livelli della battaglia (audit fase 4)', () => {
  it('impila HUD, fascia, danno, dadi, Suprema ed esito in un ordine dichiarato', () => {
    const order = ['hud', 'banner', 'capture', 'damage', 'impact', 'dice', 'priority', 'cutin', 'result', 'audience'].map(layer)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(new Set(order).size).toBe(order.length)
    // Le finestre modali della battaglia (moneta, dado di stato, cambio) restano sopra tutto.
    expect(Math.max(...order)).toBeLessThan(880)
  })

  it.each([
    ['battleCinematics.css', '--battle-z-banner'],
    ['battleCinematics.css', '--battle-z-damage'],
    ['battleRpg.css', '--battle-z-result'],
    ['supremeCutIn.css', '--battle-z-cutin'],
    ['DiceRollOverlay.tsx', '--battle-z-dice'],
  ])('%s usa il livello %s invece di un numero', (file, token) => {
    expect(readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')).toContain(`var(${token})`)
  })

  it('chiude la carta dei dadi prima dei messaggi, senza attese con il movimento ridotto', () => {
    expect(battleDiceDismissDelayMs(false)).toBe(BATTLE_DICE_EXIT_MS)
    expect(BATTLE_DICE_EXIT_MS).toBeGreaterThan(0)
    expect(battleDiceDismissDelayMs(true)).toBe(0)
  })
})
