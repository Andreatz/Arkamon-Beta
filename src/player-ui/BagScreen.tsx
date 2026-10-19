import { SpatialNavigation } from '@/components/rpg/SpatialNavigation'
import { usePlayerUiMemory, usePublishPlayerUiSelection, usePlayerUiSession } from './playerUiSession'
import { useEffect, useState, type CSSProperties } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ItemUsePanel } from '@/shop/ItemUsePanel'
import { SHOP_ITEMS, type ShopItemId } from '@/shop/catalog'
import { ITEM_ICONS, CreaturePortrait, HealthBar, KitButton, KitIcon, KitPanel, kitAsset } from './kit'
import { currentRoster } from './currentRoster'

type BagCategory = 'all' | 'heal' | 'status' | 'capture'
export interface BagScreenProps { playerId: 1 | 2; onPlayerChange?: (playerId: 1 | 2) => void; showPlayerPicker?: boolean }

/** The existing use panel remains the single target/effect flow for real inventory items. */
export function BagScreen({ playerId, onPlayerChange, showPlayerPicker = true }: BagScreenProps) {
  const state = useGameStore()
  const [viewPlayerId, setViewPlayerId] = useState<1 | 2>(playerId)
  const [category, setCategory] = usePlayerUiMemory<BagCategory>(viewPlayerId, 'bag.category', 'all')
  const [selectedId, setSelectedId] = usePlayerUiMemory<ShopItemId | null>(viewPlayerId, 'bag.item', null)
  useEffect(() => { setViewPlayerId(playerId) }, [playerId])
  const player = state[viewPlayerId === 1 ? 'giocatore1' : 'giocatore2']
  const squad = currentRoster(player.squadra, state.battaglia)
  const owned = SHOP_ITEMS.filter((item) => (player.inventario[item.id] ?? 0) > 0)
  const filtered = owned.filter((item) => category === 'all' || (category === 'heal' ? item.effect.kind === 'heal' || item.effect.kind === 'revive' : item.effect.kind === category))
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0]
  const [targetId, setTargetId] = usePlayerUiMemory<string>(viewPlayerId, 'bag.target', () => usePlayerUiSession.getState().selection[viewPlayerId]?.instanceId ?? player.squadra[0]?.istanzaId ?? '')
  usePublishPlayerUiSelection(viewPlayerId, { instanceId: targetId, itemId: selected?.id })
  const leagueRunning = state.league?.players[viewPlayerId].status === 'running'
  const unavailable = state.battaglia || state.interactionProgress.pendingBattle
    ? 'Durante la battaglia usa la borsa della pulsantiera di combattimento.'
    : leagueRunning && !state.league?.config?.betweenBattleItems ? 'Gli oggetti fra gli incontri della Lega non sono consentiti dalla configurazione della partita.'
    : viewPlayerId !== state.giocatoreAttivo || state.turnoOverworld.giocatoreAttivo !== viewPlayerId || (!leagueRunning && state.turnoOverworld.azioniRimaste <= 0)
      ? 'Puoi usare gli oggetti soltanto durante il turno di questo giocatore.'
      : ['titolo', 'laboratorio', 'evoluzione'].includes(state.scenaCorrente.scena)
        ? 'Concludi questa schermata prima di usare un oggetto.' : null
  const total = owned.reduce((sum, item) => sum + (player.inventario[item.id] ?? 0), 0)

  return <section className="pu-bag-screen arka-item-bag" aria-label="Borsa degli oggetti">
    <div className="pu-screen-toolbar">
      {showPlayerPicker && <label className="pu-player-picker">Giocatore della borsa<select value={viewPlayerId} onChange={(event) => {
        const id = Number(event.target.value) as 1 | 2
        setViewPlayerId(id); onPlayerChange?.(id)
      }}><option value={1}>{state.giocatore1.nome || 'Giocatore 1'}</option><option value={2}>{state.giocatore2.nome || 'Giocatore 2'}</option></select></label>}
      <p className="pu-inventory-count"><strong>{total} oggetti</strong><span>Scorte di {player.nome || `Giocatore ${viewPlayerId}`}</span></p>
    </div>
    <div className="pu-bag-layout">
      <KitPanel className="pu-bag-inventory">
        <div className="pu-tabs" aria-label="Categorie degli oggetti">{([
          ['all', 'Tutti'], ['heal', 'Cure'], ['status', 'Status'], ['capture', 'Cattura'],
        ] as const).map(([id, label]) => <KitButton key={id} active={category === id} aria-pressed={category === id} onClick={() => { setCategory(id); setSelectedId(null) }}>{label}</KitButton>)}</div>
        <h2>Le tue scorte</h2>
        <SpatialNavigation columns={4} className="pu-item-grid">{filtered.map((item) => <KitButton data-rpg-item key={item.id} className="pu-item-slot" active={selected?.id === item.id} aria-pressed={selected?.id === item.id}
          aria-label={`${item.name}: ${player.inventario[item.id]} disponibili`} onClick={() => setSelectedId(item.id)}>
          <KitIcon id={ITEM_ICONS[item.id]} className="pu-item-art" /><strong>{item.name}</strong><span className="pu-item-quantity">×{player.inventario[item.id]}</span>
        </KitButton>)}</SpatialNavigation>
        {!filtered.length && <p className="pu-empty">{owned.length ? 'Nessun oggetto in questa categoria.' : 'La borsa è vuota. Trovi gli oggetti negli Arkastore delle città.'}</p>}
      </KitPanel>
      <KitPanel className="pu-bag-detail">
        {selected ? <>
          <span className="pu-kicker">Articolo selezionato</span><div className="pu-item-hero"><KitIcon id={ITEM_ICONS[selected.id]} /></div>
          <h2>{selected.name}</h2><p className="pu-description">{selected.description}</p><p className="pu-item-held">In borsa: <strong>{player.inventario[selected.id] ?? 0}</strong></p>
        </> : <div className="pu-empty"><KitIcon id="icon-bag" /><h2>Pronto per il viaggio</h2><p>Le scorte acquistate e raccolte compariranno nella borsa di questo giocatore.</p></div>}
        {selected && <div className="pu-item-use pu-item-use-single" style={{ '--pu-action-frame': `url("${kitAsset('button-primary')}")` } as CSSProperties}>
          <ItemUsePanel key={`${viewPlayerId}:${state.campaignRevision}`} squad={squad} inventory={player.inventario} selectedInstanceId={targetId} onTargetChange={setTargetId} unavailableMessage={unavailable}
            visibleItemIds={[selected.id]}
            renderItemIcon={itemId => <KitIcon id={ITEM_ICONS[itemId]} />}
            renderEffectPreview={(target, _itemId, result) => <div className="pu-cure-preview" aria-label={`Anteprima su ${target.nome}`}>
              <CreaturePortrait pokemon={target} /><div><span className="pu-kicker">Prima di usare l’oggetto</span><strong>{target.nome}</strong><HealthBar pokemon={target} /></div>
              {result.ok && result.pokemon ? <div className="pu-cure-after"><span className="pu-kicker">Dopo</span><HealthBar pokemon={result.pokemon} /><span>{result.recoveredHp ? `+${result.recoveredHp} HP` : 'Status rimosso'} · {result.pokemon.stato?.tipo ?? (result.pokemon.hp > 0 ? 'In salute' : 'KO')}</span></div> : <span className="pu-cure-no-effect">Nessun effetto sul compagno selezionato.</span>}
            </div>}
            onUse={(itemId, instanceId) => { setSelectedId(itemId); return state.applicaOggetto(viewPlayerId, itemId, instanceId) }}
            actionNote={leagueRunning ? 'Gli oggetti consentiti fra gli incontri non interrompono la serie della Lega. Gli oggetti inutili non vengono consumati.' : 'Usare un oggetto conclude il turno. Gli oggetti inutili non vengono consumati.'} />
        </div>}
      </KitPanel>
    </div>
  </section>
}
