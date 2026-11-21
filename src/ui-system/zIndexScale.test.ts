import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
const value = (name: string) => {
  const match = tokens.match(new RegExp(`--${name}:\\s*(\\d+);`))
  if (!match) throw new Error(`Token --${name} mancante`)
  return Number(match[1])
}

describe('scala dei livelli (audit fase 10)', () => {
  it('ordina palco, HUD, sovrapposizioni, finestre, regia e avvisi', () => {
    const names = ['z-stage', 'z-hud', 'z-overlay', 'z-banner', 'z-transition', 'z-modal', 'z-modal-raised', 'z-admin', 'z-notice', 'z-notice-modal', 'z-dialog', 'z-fx', 'z-fx-raised', 'z-top']
    const order = names.map(value)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(new Set(order).size).toBe(order.length)
  })

  it('tiene tutta la battaglia sotto le finestre modali', () => {
    const battle = [...tokens.matchAll(/--battle-z-[a-z]+:\s*(\d+);/g)].map((match) => Number(match[1]))
    expect(battle.length).toBeGreaterThan(5)
    expect(Math.max(...battle)).toBeLessThan(value('z-modal'))
  })

  it('definisce i colori dei tipi usati dagli effetti', () => {
    for (const type of ['normale', 'fuoco', 'acqua', 'erba', 'elettro', 'terra', 'psico', 'oscurita']) expect(tokens).toMatch(new RegExp(`--arka-type-${type}:\\s*#`))
  })
})
