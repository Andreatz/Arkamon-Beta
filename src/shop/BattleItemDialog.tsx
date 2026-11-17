import { useEffect, useState } from 'react'
import { GameDialog } from '@/components/ui/GameDialog'
import { RpgWindow, RpgCommand } from '@/components/rpg'
import { itemIconId, KitIcon } from '@/player-ui/kit'
import { assetUrl } from '@/utils/assetUrl'
import { calcolaHPMax } from '@/engine/battleEngine'
import type { PokemonIstanza } from '@/types'
import { SHOP_ITEMS, type ShopInventory, type ShopItemId } from './catalog'
import { resolveItemEffect } from './itemEffects'
import './battleBag.css'

export interface BattleItemDialogProps {
  squad: PokemonIstanza[]
  inventory: ShopInventory
  onUse: (itemId: ShopItemId, instanceId: string) => { ok: boolean; message: string }
  onClose: () => void
  disabled?: boolean
  /** Motivo per cui i Boost non valgono in questa sfida (null = consentiti). */
  boostBlocked?: string | null
  /** Boost già attivi in questa sfida. */
  activeBoosts?: { velocita?: boolean; danno?: boolean }
}

/** The same real item effects as the management bag, in bounded pages over the battlefield. */
export function BattleItemDialog({ squad, inventory, onUse, onClose, disabled = false, boostBlocked = null, activeBoosts = {} }: BattleItemDialogProps) {
  const owned = SHOP_ITEMS.filter(item => (inventory[item.id] ?? 0) > 0)
  const [itemId, setItemId] = useState<ShopItemId | undefined>(owned[0]?.id)
  const [targetId, setTargetId] = useState(squad[0]?.istanzaId ?? '')
  const [page, setPage] = useState(0)
  const [message, setMessage] = useState('')
  const item = owned.find(entry => entry.id === itemId) ?? owned[0]
  const target = squad.find(entry => entry.istanzaId === targetId) ?? squad[0]
  const boost = item?.effect.kind === 'boost' ? item.effect.boost : null
  const preview = target && item && !boost ? resolveItemEffect(target, item.id) : undefined
  const reason = item?.effect.kind === 'capture' ? 'Per la cattura usa i comandi dei Sacchettini nel campo di battaglia.'
    : boost ? (boostBlocked ?? (activeBoosts[boost] ? 'Questo Boost è già attivo in questa sfida.' : undefined))
    : preview?.ok ? undefined : preview?.message
  const pageCount = Math.max(1, Math.ceil(owned.length / 4))
  useEffect(() => { setPage(current => Math.min(current, pageCount - 1)) }, [pageCount])
  return <GameDialog title="Borsa in battaglia" className="battle-item-dialog" onClose={onClose}>
    <p className="battle-bag-note">Un oggetto sostituisce la mossa del turno. Viene consumato soltanto se ha effetto.</p>
    <div className="battle-bag-layout">
      <RpgWindow className="battle-bag-catalog" aria-label="Oggetti disponibili">
        <h3>Oggetti disponibili</h3>
        <div className="battle-bag-items">
          {owned.slice(page * 4, page * 4 + 4).map(entry => <RpgCommand key={entry.id} selected={item?.id === entry.id} onClick={() => { setItemId(entry.id); setMessage('') }}>
            <KitIcon id={itemIconId(entry.id)} /><span>{entry.name}</span><strong>×{inventory[entry.id]}</strong>
          </RpgCommand>)}
          {!owned.length && <p>La borsa è vuota.</p>}
        </div>
        <nav aria-label="Pagine oggetti" className="battle-bag-pages"><RpgCommand disabled={page === 0} onClick={() => setPage(value => value - 1)}>←</RpgCommand><span>{page + 1} / {pageCount}</span><RpgCommand disabled={page + 1 >= pageCount} onClick={() => setPage(value => value + 1)}>→</RpgCommand></nav>
      </RpgWindow>
      <RpgWindow className="battle-bag-detail">
        {item ? <><header role="presentation"><KitIcon id={itemIconId(item.id)} /><div><h3>{item.name}</h3><p>{item.description}</p></div></header>
          {boost ? <div className="battle-bag-preview" role="status"><span>{reason ?? 'Vale per tutta la sfida e sostituisce la mossa di questo turno.'}</span></div> : <><h4>Scegli il compagno</h4><div className="battle-bag-squad" role="group" aria-label="Arkamon da curare">
            {squad.map(pokemon => <RpgCommand key={pokemon.istanzaId} selected={target?.istanzaId === pokemon.istanzaId} aria-pressed={target?.istanzaId === pokemon.istanzaId} onClick={() => { setTargetId(pokemon.istanzaId); setMessage('') }}>
              <img src={assetUrl(`/sprites/front_sprites/${pokemon.specieId}.png`)} alt=""/><span><strong>{pokemon.nome}</strong><small>Lv. {pokemon.livello} · {pokemon.hp}/{calcolaHPMax(pokemon)} HP{pokemon.hp === 0 ? ' · KO' : pokemon.stato ? ` · ${pokemon.stato.tipo}` : ''}</small></span>
            </RpgCommand>)}
          </div>
          <div className="battle-bag-preview" role="status">{target && preview?.ok && preview.pokemon ? <><strong>{target.nome} · {target.hp} → {preview.pokemon.hp} HP</strong><span>{preview.message}</span></> : <span>{reason ?? 'Scegli un Arkamon.'}</span>}</div></>}
          <RpgCommand tone="primary" className="battle-bag-confirm" disabled={disabled || (!boost && (!target || !preview?.ok)) || !!reason} onClick={() => {
            if (!boost && !target) return
            const result = onUse(item.id, boost ? '' : target!.istanzaId)
            if (result.ok) onClose()
            else setMessage(result.message)
          }}>Usa {item.name}</RpgCommand>
        </> : <p>Puoi acquistare gli oggetti negli Arkastore delle città.</p>}
        {message && <p role="alert">{message}</p>}
      </RpgWindow>
    </div>
  </GameDialog>
}
