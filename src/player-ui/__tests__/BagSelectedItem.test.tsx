import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialGameSave } from '@/save/gamePersistence'
import type { GameState } from '@/store/gameStore'
import type { PokemonIstanza } from '@/types'
import { ItemUsePanel } from '@/shop/ItemUsePanel'
import { SHOP_ITEM_IDS, SHOP_ITEMS, type ShopInventory } from '@/shop/catalog'
import { BagScreen } from '../BagScreen'

const runtime = vi.hoisted(() => ({ state: undefined as unknown as GameState }))
vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector?: (state: GameState) => unknown) => selector ? selector(runtime.state) : runtime.state,
}))

const pokemon: PokemonIstanza = {
  istanzaId: 'selected-bag-target', specieId: 1, nome: 'Vyrath selezionato', livello: 5, hp: 3, xp: 2,
  stato: { tipo: 'Paralizzato', turniRimanenti: -1 },
}
const inventory: ShopInventory = Object.fromEntries(SHOP_ITEM_IDS.map(id => [id, 1]))
const useButtons = (markup: string) => [...markup.matchAll(/>Usa ([^<]+)<\/button>/g)].map(([, name]) => name)

beforeEach(() => {
  const state = initialGameSave()
  state.giocatore1.nome = 'Arianna'
  state.giocatore1.squadra = [pokemon]
  state.giocatore1.inventario = { potion: 2, 'paralysis-heal': 0, masterball: 1 }
  state.scenaCorrente = { scena: 'mappa-principale' }
  runtime.state = { ...state, campaignRevision: 0, applicaOggetto: vi.fn() } as unknown as GameState
})

describe('selected inventory item action view', () => {
  it('offers one action for the selected item without rendering the seven-item use catalog again', () => {
    const onUse = vi.fn()
    const markup = renderToStaticMarkup(<ItemUsePanel squad={[pokemon]} inventory={inventory} onUse={onUse}
      visibleItemIds={['paralysis-heal']} actionNote="Usare un oggetto conclude il turno." />)
    expect(useButtons(markup)).toEqual(['Antiparalisi'])
    expect(markup).toContain('is-single-item')
    expect(markup).toContain('value="selected-bag-target"')
    expect(markup).not.toContain('Oggetti disponibili')
    expect(markup).not.toContain(SHOP_ITEMS.find(item => item.id === 'paralysis-heal')!.description)
    expect(onUse).not.toHaveBeenCalled()
    expect(pokemon.hp).toBe(3)
    expect(pokemon.stato?.tipo).toBe('Paralizzato')
  })

  it('preserves the complete catalog and descriptions when the optional filter is omitted in battle', () => {
    const onUse = vi.fn()
    const markup = renderToStaticMarkup(<ItemUsePanel squad={[pokemon]} inventory={inventory} onUse={onUse}
      actionNote="Usare un oggetto consuma la mossa." />)
    expect(useButtons(markup)).toEqual(SHOP_ITEMS.map(item => item.name))
    expect(markup).not.toContain('is-single-item')
    expect(markup).toContain('Oggetti disponibili')
    for (const item of SHOP_ITEMS) expect(markup).toContain(item.description)
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Usa Masterball<\/button>/)
    expect(onUse).not.toHaveBeenCalled()
  })

  it('does not offer a depleted selected item or another item through the filtered action', () => {
    const onUse = vi.fn()
    const markup = renderToStaticMarkup(<ItemUsePanel squad={[pokemon]} inventory={{ potion: 2, 'paralysis-heal': 0 }}
      onUse={onUse} visibleItemIds={['paralysis-heal']} actionNote="Usare un oggetto conclude il turno." />)
    expect(useButtons(markup)).toEqual([])
    expect(markup).toContain('value="selected-bag-target"')
    expect(onUse).not.toHaveBeenCalled()
  })

  it('selects an item still in stock for the real bag and does not expose a depleted use action', () => {
    const playerBefore = structuredClone(runtime.state.giocatore1)
    const markup = renderToStaticMarkup(<BagScreen playerId={1} />)
    expect(useButtons(markup)).toEqual(['Pozione'])
    expect(markup).toContain('Pozione: 2 disponibili')
    expect(markup).toContain('Masterball: 1 disponibili')
    expect(markup).not.toContain('Antiparalisi: 0 disponibili')
    expect(markup).toContain('value="selected-bag-target"')
    expect(runtime.state.giocatore1).toEqual(playerBefore)
    expect(runtime.state.applicaOggetto).not.toHaveBeenCalled()
  })
})
