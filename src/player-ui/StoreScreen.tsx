import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MAX_ITEM_QUANTITY, MAX_SHOP_QUANTITY, SHOP_ITEMS, type ShopCart, type ShopItemId } from '@/shop/catalog'
import { shopAvailabilityMessage, shopCartTotal } from '@/shop/purchase'
import { ITEM_ICONS, KitButton, KitIcon, KitPanel } from './kit'

export interface StoreScreenProps { playerId: 1 | 2; inputBlocked?: boolean }

/** Browsing is free; purchases use the existing atomic, persisted checkout action. */
export function StoreScreen({ playerId, inputBlocked = false }: StoreScreenProps) {
  const state = useGameStore()
  const player = state[playerId === 1 ? 'giocatore1' : 'giocatore2']
  const position = state[playerId === 1 ? 'posizione1' : 'posizione2']
  const location = state.scenaCorrente.scena === 'citta'
    ? typeof state.scenaCorrente.payload?.luogo === 'string' ? state.scenaCorrente.payload.luogo : 'Venezia'
    : position.luogo ?? position.mappaId
  const [selectedId, setSelectedId] = useState<ShopItemId>(SHOP_ITEMS[0].id)
  const [cart, setCart] = useState<ShopCart>({})
  const [message, setMessage] = useState('')
  useEffect(() => { setCart({}); setMessage(''); setSelectedId(SHOP_ITEMS[0].id) }, [playerId, location, state.campaignRevision])
  const unavailable = shopAvailabilityMessage(state, playerId, location)
  const selected = SHOP_ITEMS.find((item) => item.id === selectedId) ?? SHOP_ITEMS[0]
  const total = shopCartTotal(cart)
  const quantity = Object.values(cart).reduce((sum, value) => sum + (value ?? 0), 0)
  const insufficient = total > player.monete
  const capacityItem = SHOP_ITEMS.find((item) => (cart[item.id] ?? 0) + (player.inventario[item.id] ?? 0) > MAX_ITEM_QUANTITY)
  const editBlocked = inputBlocked || !!unavailable
  function setQuantity(itemId: ShopItemId, raw: number) {
    setCart((previous) => ({ ...previous, [itemId]: Number.isFinite(raw) ? Math.min(MAX_SHOP_QUANTITY, Math.max(0, Math.floor(raw))) : 0 }))
    setMessage('')
  }

  return <section className="pu-store-screen arka-store" aria-label={`Arkastore di ${location}`}>
    <header className="pu-screen-toolbar"><div><h2>Arkastore · {location}</h2><p>Oggetti per {player.nome || `Giocatore ${playerId}`}</p></div><strong className="pu-store-balance" aria-label={`Saldo: ${player.monete} monete`}>{player.monete.toLocaleString('it-IT')} ₳</strong></header>
    <p className="pu-note">Puoi consultare il negozio senza spendere azioni. Un acquisto del carrello completo conta come un’interazione e conclude il turno. Gli oggetti restano nella borsa di questo giocatore.</p>
    {unavailable && <p className="pu-warning" role="status">{unavailable}</p>}
    <div className="pu-store-layout">
      <KitPanel className="pu-store-catalog"><h3>Catalogo del negozio</h3><div className="pu-shop-list">
        {SHOP_ITEMS.map((item) => <article className={`pu-shop-row ${selected.id === item.id ? 'is-selected' : ''}`} key={item.id}>
          <KitButton className="pu-shop-row-main" active={selected.id === item.id} aria-pressed={selected.id === item.id} aria-label={`Seleziona ${item.name}`} onClick={() => setSelectedId(item.id)}>
            <KitIcon id={ITEM_ICONS[item.id]} /><span><strong>{item.name}</strong><small>{item.price} ₳ · In borsa: {player.inventario[item.id] ?? 0}</small></span>
          </KitButton>
          <label className="pu-shop-quantity">Quantità di {item.name}<input type="number" min={0} max={MAX_SHOP_QUANTITY} step={1} inputMode="numeric" value={cart[item.id] ?? 0}
            disabled={editBlocked} onFocus={() => setSelectedId(item.id)} onChange={(event) => setQuantity(item.id, Number(event.target.value))} /></label>
        </article>)}
      </div></KitPanel>

      <KitPanel className="pu-store-detail"><span className="pu-kicker">Articolo selezionato</span><div className="pu-item-hero"><KitIcon id={ITEM_ICONS[selected.id]} /></div><h2>{selected.name}</h2>
        <p className="pu-description">{selected.description}</p><dl className="pu-facts"><div><dt>Prezzo unitario</dt><dd>{selected.price} ₳</dd></div><div><dt>In borsa</dt><dd>{player.inventario[selected.id] ?? 0}</dd></div></dl>
        <div className="pu-quantity-control" aria-label={`Quantità nel carrello di ${selected.name}`}>
          <KitButton aria-label={`Diminuisci ${selected.name}`} disabled={editBlocked || !(cart[selected.id] ?? 0)} onClick={() => setQuantity(selected.id, (cart[selected.id] ?? 0) - 1)}>−</KitButton>
          <output aria-label={`${selected.name} nel carrello`}>{cart[selected.id] ?? 0}</output>
          <KitButton aria-label={`Aumenta ${selected.name}`} disabled={editBlocked || (cart[selected.id] ?? 0) >= MAX_SHOP_QUANTITY} onClick={() => setQuantity(selected.id, (cart[selected.id] ?? 0) + 1)}>+</KitButton>
        </div><p className="pu-note">Ogni articolo può essere acquistato in quantità da 0 a {MAX_SHOP_QUANTITY}.</p>
      </KitPanel>

      <KitPanel className="pu-store-cart"><span className="pu-kicker">Le tue scorte per il viaggio</span><h2>Carrello</h2>
        <div className="pu-cart-lines">{SHOP_ITEMS.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => <div className="pu-cart-line" key={item.id}>
          <KitIcon id={ITEM_ICONS[item.id]} /><span><strong>{item.name}</strong><small>{cart[item.id]} × {item.price} ₳</small></span><strong>{(cart[item.id] ?? 0) * item.price} ₳</strong>
          <button type="button" className="pu-cart-remove" aria-label={`Rimuovi ${item.name} dal carrello`} onClick={() => setQuantity(item.id, 0)}>×</button>
        </div>)}{!quantity && <p className="pu-empty">Il carrello è vuoto. Scegli le quantità nel catalogo.</p>}</div>
        <div className="pu-store-totals"><strong>Carrello: {quantity} oggetti · {total} ₳</strong><span>Saldo dopo l’acquisto: {Math.max(0, player.monete - total)} ₳</span></div>
        {insufficient && <p className="pu-warning">Ti mancano {total - player.monete} monete.</p>}
        {capacityItem && <p className="pu-warning">Non puoi portare più di {MAX_ITEM_QUANTITY} {capacityItem.name}.</p>}
        <div className="pu-store-actions"><KitButton disabled={!quantity} onClick={() => { setCart({}); setMessage('') }}>Svuota carrello</KitButton>
          <KitButton active disabled={editBlocked || !quantity || insufficient || !!capacityItem} onClick={() => {
            const result = state.acquistaOggetti(playerId, cart, location)
            setMessage(result.message)
            if (result.ok) setCart({})
          }}>Acquista carrello</KitButton></div>
        <p role="status" aria-live="polite" className="pu-store-result">{message}</p>
      </KitPanel>
    </div>
  </section>
}
