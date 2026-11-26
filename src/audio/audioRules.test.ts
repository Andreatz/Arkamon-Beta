import { describe, expect, it } from 'vitest'
import { SFX_IDS } from './sfxIds'
import { ALL_MOVE_SFX, BATTLE_PRELOAD_SFX, moveRate, moveSoundFor, panForSide } from './moveSounds'
import { chronicleSfx } from './battleSounds'
import { clickSfxFor } from './uiSounds'
import { MOVE_VFX_ASSIGNMENTS } from '@/components/vfx/moveVfxAssignments'
import { storeSfx, type AudioSnapshot } from '@/components/audio/AudioEventBridge'
import type { BattleLogEvent } from '@/types'

const known = new Set<string>(SFX_IDS)

describe('suoni delle mosse', () => {
  it('dà a ogni mossa del moveset un suono che esiste', () => {
    for (const move of MOVE_VFX_ASSIGNMENTS) {
      const sound = moveSoundFor({ id: move.gameMoveId ?? move.sourceMoveId, tipo: move.element, effetto: null }, move.tier, move.type)
      expect(known.has(sound.id), `${move.name} → ${sound.id}`).toBe(true)
    }
    for (const id of [...ALL_MOVE_SFX, ...BATTLE_PRELOAD_SFX]) expect(known.has(id), id).toBe(true)
    expect(ALL_MOVE_SFX).toHaveLength(24)
  })

  it('suona i colpi sull’impatto e gli stati all’avvio', () => {
    expect(moveSoundFor({ id: 1, tipo: 'Fuoco', effetto: null }, 'heavy')).toMatchObject({ id: 'move.fuoco.heavy', cue: 'impact' })
    expect(moveSoundFor({ id: 2, tipo: 'Oscurità', effetto: null }, 'light').id).toBe('move.oscurita.light')
    expect(moveSoundFor({ id: 3, tipo: 'Elettro', effetto: 'PARALISI' }, 'status', 'Status (Paralisi)')).toMatchObject({ id: 'status.paralysis', cue: 'start' })
    expect(moveSoundFor({ id: 4, tipo: 'Erba', effetto: null }, 'status', 'Status (Cura Paralisi)').id).toBe('status.cure')
    expect(moveSoundFor({ id: 5, tipo: 'Acqua', effetto: 'CURA' }, 'status', 'Status (Recupero Alto HP)').id).toBe('battle.heal')
    expect(moveSoundFor({ id: 6, tipo: 'Psico', effetto: null }, 'status', 'Status (Immunità da Status)').id).toBe('status.shield')
    // Il danno fisso è un colpo dell'elemento.
    expect(moveSoundFor({ id: 7, tipo: 'Terra', effetto: null }, 'status', 'Status (Danno Fisso)')).toMatchObject({ id: 'move.terra.medium', cue: 'impact' })
  })

  it('intona ogni mossa in modo stabile, entro un semitono e mezzo', () => {
    const rates = Array.from({ length: 300 }, (_, id) => moveRate(id))
    expect(Math.min(...rates)).toBeGreaterThanOrEqual(2 ** (-1.5 / 12) - 1e-9)
    expect(Math.max(...rates)).toBeLessThanOrEqual(2 ** (1.5 / 12) + 1e-9)
    expect(new Set(rates.map((rate) => rate.toFixed(4))).size).toBe(7)
    expect(moveRate(42)).toBe(moveRate(42))
    expect(panForSide('A')).toBeLessThan(0)
    expect(panForSide('B')).toBeGreaterThan(0)
  })
})

describe('suoni della Cronaca', () => {
  const event = (patch: Partial<BattleLogEvent>): BattleLogEvent => ({ id: 'x', kind: 'status', title: '', messages: [], ...patch })
  it('suona gli stati applicati sul bersaglio e quelli di inizio turno su chi li subisce', () => {
    expect(chronicleSfx([event({ id: 'a:status', side: 'A', title: 'Vyrath: Paralizzato' })])).toEqual([{ id: 'status.paralysis', pan: panForSide('B'), delayMs: 380 }])
    expect(chronicleSfx([event({ id: 'b:status', side: 'B', title: 'Vyrath · Avvelenato', hpBefore: 20, hpAfter: 18, damage: 2 })])).toEqual([{ id: 'status.tick', pan: panForSide('B') }])
    expect(chronicleSfx([event({ id: 'b:status', side: 'A', title: 'Vyrath · Addormentato', hpBefore: 20, hpAfter: 20, damage: 0 })])[0].id).toBe('status.sleep')
    expect(chronicleSfx([event({ kind: 'switch', side: 'B', title: 'Entra' })])[0].id).toBe('battle.switch-in')
    expect(chronicleSfx([event({ kind: 'attack', title: 'Colpo' }), event({ kind: 'ko', title: 'KO' })])).toEqual([])
  })
})

describe('suoni dell’interfaccia', () => {
  type Fake = { attrs: Record<string, string>; text?: string; className?: string; disabled?: boolean; parent?: Fake; tag?: string }
  const element = (fake: Fake): Element => {
    const matches = (node: Fake, selector: string) => selector.split(',').some((part) => {
      const s = part.trim()
      if (s === 'button') return node.tag === 'button'
      const attr = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(s)
      return !!attr && (attr[2] === undefined ? node.attrs[attr[1]] !== undefined : node.attrs[attr[1]] === attr[2])
    })
    const wrap = (node: Fake): Element => ({
      closest: (selector: string) => {
        for (let current: Fake | undefined = node; current; current = current.parent) if (matches(current, selector)) return wrap(current)
        return null
      },
      getAttribute: (name: string) => node.attrs[name] ?? null,
      textContent: node.text ?? '',
      className: node.className ?? '',
      disabled: node.disabled ?? false,
    }) as unknown as Element
    return wrap(fake)
  }
  it('sceglie il suono dal tipo di comando', () => {
    expect(clickSfxFor(element({ tag: 'button', attrs: {}, text: 'Borsa' }))).toBe('ui.select')
    expect(clickSfxFor(element({ tag: 'button', attrs: {}, text: 'Chiudi' }))).toBe('ui.back')
    expect(clickSfxFor(element({ tag: 'button', attrs: { 'aria-label': 'Indietro' } }))).toBe('ui.back')
    expect(clickSfxFor(element({ tag: 'button', attrs: { 'data-game-button': 'primary' }, text: 'Inizia' }))).toBe('ui.confirm')
    expect(clickSfxFor(element({ tag: 'button', attrs: {}, disabled: true }))).toBe('ui.error')
    expect(clickSfxFor(element({ tag: 'div', attrs: { role: 'tab' } }))).toBe('ui.tab')
    expect(clickSfxFor(element({ tag: 'button', attrs: { 'data-sfx': 'map.select' } }))).toBe('map.select')
    expect(clickSfxFor(element({ tag: 'span', attrs: {}, parent: { tag: 'section', attrs: { 'data-sfx': 'none' } } }))).toBeNull()
    expect(clickSfxFor(element({ tag: 'span', attrs: {} }))).toBeNull()
  })
})

describe('suoni della mappa', () => {
  const player = (monete = 100, inventario: Record<string, number> = {}, sconfitti: number[] = []) =>
    ({ monete, inventario, allenatoriSconfitti: new Set(sconfitti) })
  const snap = (patch: Partial<AudioSnapshot> = {}): AudioSnapshot => ({
    scena: 'citta', turno: 1, luogo1: 'Venezia', luogo2: 'Venezia', locali1: { Venezia: 'n1' }, locali2: {},
    hp: new Map([['a', 10]]), players: [player(), player()], ...patch,
  })
  const gym = (id: number) => id === 9
  it('riconosce viaggi, passi, turni, acquisti, monete, oggetti e cure', () => {
    expect(storeSfx(snap(), snap({ luogo1: 'Roma' }), gym)).toEqual(['map.travel'])
    expect(storeSfx(snap(), snap({ locali1: { Venezia: 'n2' } }), gym)).toEqual(['map.step'])
    expect(storeSfx(snap(), snap({ locali1: { Venezia: 'n1', Roma: 'n5' } }), gym)).toEqual([])
    expect(storeSfx(snap(), snap({ turno: 2 }), gym)).toEqual(['map.turn'])
    expect(storeSfx(snap(), snap({ players: [player(60, { potion: 1 }), player()] }), gym)).toEqual(['ui.purchase'])
    expect(storeSfx(snap(), snap({ players: [player(100, { potion: 1 }), player()] }), gym)).toEqual(['jingle.item'])
    expect(storeSfx(snap(), snap({ players: [player(150), player()] }), gym)).toEqual(['ui.coins'])
    expect(storeSfx(snap(), snap({ hp: new Map([['a', 20]]) }), gym)).toEqual(['battle.heal'])
  })
  it('tace in battaglia e alla sua chiusura, salvo la medaglia', () => {
    expect(storeSfx(snap(), snap({ scena: 'battaglia', turno: 2 }), gym)).toEqual([])
    const leaving = storeSfx(snap({ scena: 'battaglia' }), snap({ hp: new Map([['a', 30]]), players: [player(500, {}, [9]), player()] }), gym)
    expect(leaving).toEqual(['jingle.medal'])
    expect(storeSfx(snap({ scena: 'battaglia' }), snap({ players: [player(500, {}, [3]), player()] }), gym)).toEqual([])
  })
})
