import { useEffect, useState } from 'react'
import { calcolaHPMax } from '@/engine/battleEngine'
import type { PokemonIstanza } from '@/types'
import { SHOP_ITEMS, type ShopInventory, type ShopItemId } from './catalog'
import { resolveItemEffect } from './itemEffects'
import './shop.css'

export interface ItemUsePanelProps {
  squad: PokemonIstanza[]
  inventory: ShopInventory
  onUse: (itemId: ShopItemId, instanceId: string) => { ok: boolean; message: string }
  disabled?: boolean
  unavailableMessage?: string | null
  actionNote: string
}

/** La stessa selezione di oggetto e bersaglio serve per la borsa e per il turno di battaglia. */
export function ItemUsePanel({ squad, inventory, onUse, disabled = false, unavailableMessage, actionNote }: ItemUsePanelProps) {
  const [selectedId, setSelectedId] = useState(squad[0]?.istanzaId ?? '')
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!squad.some((pokemon) => pokemon.istanzaId === selectedId)) setSelectedId(squad[0]?.istanzaId ?? '')
  }, [squad, selectedId])
  const target = squad.find((pokemon) => pokemon.istanzaId === selectedId) ?? squad[0]
  const owned = SHOP_ITEMS.filter((item) => (inventory[item.id] ?? 0) > 0)
  return <div className="arka-item-bag">
    <p className="arka-store-note">{actionNote}</p>
    {unavailableMessage && <p role="status" className="arka-store-warning">{unavailableMessage}</p>}
    {target ? <label className="arka-item-target">Arkamon da curare
      <select value={target.istanzaId} onChange={(event) => { setSelectedId(event.target.value); setMessage('') }}>
        {squad.map((pokemon) => <option key={pokemon.istanzaId} value={pokemon.istanzaId}>{pokemon.nome} · Lv {pokemon.livello} · HP {pokemon.hp}/{calcolaHPMax(pokemon)}{pokemon.hp === 0 ? ' · KO' : ''}{pokemon.stato ? ` · ${pokemon.stato.tipo}` : ''}</option>)}
      </select>
    </label> : <p>Scegli prima il tuo starter per usare gli oggetti.</p>}
    <h3 className="arka-item-bag-heading">Oggetti disponibili</h3>
    {!owned.length && <p>La borsa è vuota. Trovi gli oggetti negli Arkastore delle città.</p>}
    <div className="arka-store-catalog">
      {owned.map((item) => {
        const preview = target ? resolveItemEffect(target, item.id) : null
        const disabledReason = item.effect.kind === 'capture' ? 'Usa il pulsante Masterball durante una battaglia selvatica.' : preview && !preview.ok ? preview.message : null
        return <article key={item.id} className="arka-store-item">
          <div className="arka-store-item-title"><span aria-hidden="true">{item.icon}</span><h4>{item.name}</h4><strong>×{inventory[item.id]}</strong></div>
          <p>{item.description}</p>
          {disabledReason && <small>{disabledReason}</small>}
          <button type="button" className="arka-button" disabled={disabled || !!unavailableMessage || !target || !!disabledReason} onClick={() => {
            if (target) setMessage(onUse(item.id, target.istanzaId).message)
          }}>Usa {item.name}</button>
        </article>
      })}
    </div>
    <p role="status" aria-live="polite" className="arka-store-result">{message}</p>
  </div>
}
