import { useEffect, useState, type CSSProperties } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ItemUsePanel } from '@/shop/ItemUsePanel'
import { SHOP_ITEMS, type ShopItemId } from '@/shop/catalog'
import { ITEM_ICONS, KitButton, KitIcon, KitPanel, kitAsset } from './kit'

type BagCategory = 'all' | 'heal' | 'status' | 'capture'
export interface BagScreenProps { playerId: 1 | 2; onPlayerChange?: (playerId: 1 | 2) => void }

/** The existing use panel remains the single target/effect flow for real inventory items. */
export function BagScreen({ playerId, onPlayerChange }: BagScreenProps) {
  const state = useGameStore()
  const [viewPlayerId, setViewPlayerId] = useState<1 | 2>(playerId)
  const [category, setCategory] = useState<BagCategory>('all')
  const [selectedId, setSelectedId] = useState<ShopItemId | null>(null)
  useEffect(() => { setViewPlayerId(playerId); setSelectedId(null); setCategory('all') }, [playerId, state.campaignRevision])
  const player = state[viewPlayerId === 1 ? 'giocatore1' : 'giocatore2']
  const owned = SHOP_ITEMS.filter((item) => (player.inventario[item.id] ?? 0) > 0)
  const filtered = owned.filter((item) => category === 'all' || (category === 'heal' ? item.effect.kind === 'heal' || item.effect.kind === 'revive' : item.effect.kind === category))
  const selected = SHOP_ITEMS.find((item) => item.id === selectedId) ?? filtered[0]
  const unavailable = state.battaglia || state.interactionProgress.pendingBattle
    ? 'Durante la battaglia usa la borsa della pulsantiera di combattimento.'
    : viewPlayerId !== state.giocatoreAttivo || state.turnoOverworld.giocatoreAttivo !== viewPlayerId || state.turnoOverworld.azioniRimaste <= 0
      ? 'Puoi usare gli oggetti soltanto durante il turno di questo giocatore.'
      : ['titolo', 'laboratorio', 'evoluzione'].includes(state.scenaCorrente.scena)
        ? 'Concludi questa schermata prima di usare un oggetto.' : null
  const total = owned.reduce((sum, item) => sum + (player.inventario[item.id] ?? 0), 0)

  return <section className="pu-bag-screen arka-item-bag" aria-label="Borsa degli oggetti">
    <div className="pu-screen-toolbar">
      <label className="pu-player-picker">Giocatore della borsa<select value={viewPlayerId} onChange={(event) => {
        const id = Number(event.target.value) as 1 | 2
        setViewPlayerId(id); onPlayerChange?.(id); setSelectedId(null)
      }}><option value={1}>{state.giocatore1.nome || 'Giocatore 1'}</option><option value={2}>{state.giocatore2.nome || 'Giocatore 2'}</option></select></label>
      <p className="pu-inventory-count"><strong>{total} oggetti</strong><span>Scorte di {player.nome || `Giocatore ${viewPlayerId}`}</span></p>
    </div>
    <div className="pu-bag-layout">
      <KitPanel className="pu-bag-inventory">
        <div className="pu-tabs" aria-label="Categorie degli oggetti">{([
          ['all', 'Tutti'], ['heal', 'Cure'], ['status', 'Status'], ['capture', 'Cattura'],
        ] as const).map(([id, label]) => <KitButton key={id} active={category === id} aria-pressed={category === id} onClick={() => { setCategory(id); setSelectedId(null) }}>{label}</KitButton>)}</div>
        <h2>Le tue scorte</h2><p className="pu-note">Gli oggetti appartengono a questa borsa. Seleziona un articolo per consultarne l’effetto.</p>
        <div className="pu-item-grid">{filtered.map((item) => <KitButton key={item.id} className="pu-item-slot" active={selected?.id === item.id} aria-pressed={selected?.id === item.id}
          aria-label={`${item.name}: ${player.inventario[item.id]} disponibili`} onClick={() => setSelectedId(item.id)}>
          <KitIcon id={ITEM_ICONS[item.id]} className="pu-item-art" /><strong>{item.name}</strong><span className="pu-item-quantity">×{player.inventario[item.id]}</span>
        </KitButton>)}</div>
        {!filtered.length && <p className="pu-empty">{owned.length ? 'Nessun oggetto in questa categoria.' : 'La borsa è vuota. Trovi gli oggetti negli Arkastore delle città.'}</p>}
        <p className="pu-note">La Masterball è utilizzabile soltanto durante una battaglia selvatica.</p>
      </KitPanel>
      <KitPanel className="pu-bag-detail">
        {selected ? <>
          <span className="pu-kicker">Articolo selezionato</span><div className="pu-item-hero"><KitIcon id={ITEM_ICONS[selected.id]} /></div>
          <h2>{selected.name}</h2><p className="pu-description">{selected.description}</p><p className="pu-item-held">In borsa: <strong>{player.inventario[selected.id] ?? 0}</strong></p>
        </> : <div className="pu-empty"><KitIcon id="icon-bag" /><h2>Pronto per il viaggio</h2><p>Le scorte acquistate e raccolte compariranno nella borsa di questo giocatore.</p></div>}
        <div className="pu-item-use" style={{ '--pu-action-frame': `url("${kitAsset('button-primary')}")` } as CSSProperties}>
          <ItemUsePanel key={`${viewPlayerId}:${state.campaignRevision}`} squad={player.squadra} inventory={player.inventario} unavailableMessage={unavailable}
            renderItemIcon={itemId => <KitIcon id={ITEM_ICONS[itemId]} />}
            onUse={(itemId, instanceId) => { setSelectedId(itemId); return state.applicaOggetto(viewPlayerId, itemId, instanceId) }}
            actionNote="Scegli un Arkamon e un oggetto della sua borsa. Usare un oggetto è un’interazione e conclude il turno sulla mappa. Gli oggetti inutili non vengono consumati." />
        </div>
      </KitPanel>
    </div>
  </section>
}
