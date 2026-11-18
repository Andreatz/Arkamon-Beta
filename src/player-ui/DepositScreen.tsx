import { SpatialNavigation } from '@/components/rpg/SpatialNavigation'
import { usePlayerUiMemory, usePublishPlayerUiSelection } from './playerUiSession'
import { useState, type DragEvent } from 'react'
import { getPokemon, TABELLA_TIPI } from '@data/index'
import { BOX_COUNT, SLOT_PER_BOX, SQUADRA_MAX, chiaveDeposito, getInSlot, type SlotRef } from '@engine/deposito'
import { isTeamWithinLevelCap, teamLevelRange } from '@/engine/teamLevelCap'
import { useGameStore } from '@store/gameStore'
import { CreaturePortrait, HealthBar, KitButton, KitIcon, KitPanel, TypeBadge, TypeSeal } from './kit'
import { canManagePlayerTeam } from '@/store/game/commandPolicy'
import { liveOwnedPokemon } from './currentRoster'
import { EMPTY_DEPOSIT_FILTERS, matchesDepositFilters, previewDepositSwap, type DepositFilters } from './depositTools'
import { GameArt } from '@/ui-system/GameArt'
import type { PokemonIstanza } from '@/types'

export interface DepositScreenProps { playerId: 1 | 2; onAnalyse?: (instanceId: string) => void }

function sameSlot(a: SlotRef | null, b: SlotRef): boolean {
  if (!a || a.tipo !== b.tipo) return false
  return a.tipo === 'squadra' && b.tipo === 'squadra' ? a.indice === b.indice
    : a.tipo === 'deposito' && b.tipo === 'deposito' && a.chiave === b.chiave
}

const DRAG_TYPE = 'application/x-arkamon-slot'
const twoDigits = (value: number) => String(value).padStart(2, '0')
function condition(pokemon: PokemonIstanza) { return pokemon.hp <= 0 ? 'KO' : pokemon.stato?.tipo ?? 'In salute' }

export function DepositScreen(props: DepositScreenProps) {
  return <PlayerDepositScreen key={props.playerId} {...props} />
}

/**
 * Fase U2: griglia a ritratti grandi, filtri secondari in un pannello, squadra in carte complete.
 * Lo spostamento resta un solo comando (`scambiaSlot`), sia con «Sposta o scambia» sia trascinando.
 */
function PlayerDepositScreen({ playerId, onAnalyse }: DepositScreenProps) {
  const player = useGameStore((state) => playerId === 1 ? state.giocatore1 : state.giocatore2)
  const battle = useGameStore((state) => state.battaglia)
  const mayManage = useGameStore((state) => canManagePlayerTeam(state, playerId))
  const leagueRunning = useGameStore((state) => Object.values(state.league?.players ?? {}).some(progress => progress.status === 'running'))
  const [box, setBox] = usePlayerUiMemory(playerId, 'deposit.box', 1)
  const [selection, setSelection] = usePlayerUiMemory<SlotRef | null>(playerId, 'deposit.slot', () => {
    const firstKey = Array.from({ length: SLOT_PER_BOX }, (_, index) => chiaveDeposito(box, index + 1))
      .find((key) => player.deposito[key])
    return firstKey ? { tipo: 'deposito', chiave: firstKey }
      : player.squadra.length ? { tipo: 'squadra', indice: 0 } : null
  })
  const [moving, setMoving] = useState(false)
  const [dragSource, setDragSource] = useState<SlotRef | null>(null)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = usePlayerUiMemory<DepositFilters>(playerId, 'deposit.filters', EMPTY_DEPOSIT_FILTERS)
  const [previewTarget, setPreviewTarget] = useState<SlotRef | null>(null)
  const selected = selection ? getInSlot(player.squadra, player.deposito, selection) : undefined
  const pokemon = selected ? liveOwnedPokemon(selected, battle) : undefined
  const species = pokemon ? getPokemon(pokemon.specieId) : undefined
  usePublishPlayerUiSelection(playerId, { instanceId: pokemon?.istanzaId, speciesId: pokemon?.specieId })
  const previousBox = ((box - 2 + BOX_COUNT) % BOX_COUNT) + 1
  const nextBox = (box % BOX_COUNT) + 1
  const boxCount = Array.from({ length: SLOT_PER_BOX }, (_, index) => !!player.deposito[chiaveDeposito(box, index + 1)]).filter(Boolean).length
  const range = teamLevelRange(player.squadra)
  const filtering = Object.entries(filters).some(([key, value]) => value !== EMPTY_DEPOSIT_FILTERS[key as keyof DepositFilters])
  const advancedFilters = [filters.condition !== 'all', filters.minimum !== '', filters.maximum !== ''].filter(Boolean).length
  const matchingEntries = Object.entries(player.deposito).filter(([, entry]) => matchesDepositFilters(liveOwnedPokemon(entry, battle), filters))
  const matchingInBox = matchingEntries.filter(([key]) => key.startsWith(`${box}:`)).length
  const matchingBoxes = [...new Set(matchingEntries.map(([key]) => Number(key.split(':')[0])))].sort((a, b) => a - b)
  const nextMatchingBox = matchingBoxes.find(number => number > box) ?? matchingBoxes[0]
  const moveSource = dragSource ?? (moving ? selection : null)
  const swapPreview = moveSource && previewTarget ? previewDepositSwap(player.squadra, player.deposito, moveSource, previewTarget) : null
  const targeting = (moving || !!dragSource) && mayManage
  function changeBox(number: number) { setBox(number); setPreviewTarget(null) }

  /** Esegue lo spostamento con le stesse verifiche del comando «Sposta o scambia». */
  function moveBetween(source: SlotRef, target: SlotRef) {
    const state = useGameStore.getState()
    const owner = playerId === 1 ? state.giocatore1 : state.giocatore2
    setMoving(false)
    setDragSource(null)
    setPreviewTarget(null)
    if (!canManagePlayerTeam(state, playerId)) {
      setMessage('Le modifiche al deposito sono disponibili durante il tuo turno, fuori dalla battaglia.')
      return
    }
    if (sameSlot(source, target)) return
    const before = getInSlot(owner.squadra, owner.deposito, source)
    if (!before) {
      setSelection(null)
      setMessage('L’Arkamon selezionato non è più in questo posto.')
      return
    }
    const result = state.scambiaSlot(playerId, source, target)
    const after = useGameStore.getState()
    const updated = playerId === 1 ? after.giocatore1 : after.giocatore2
    // An empty team destination appends to the compact array, regardless of its displayed slot.
    const actualTeamIndex = target.tipo === 'squadra'
      ? updated.squadra.findIndex((entry) => entry.istanzaId === before.istanzaId) : -1
    if (result.ok && result.changed) {
      setSelection(target.tipo === 'squadra' ? { tipo: 'squadra', indice: actualTeamIndex } : target)
    }
    setMessage(result.message)
  }

  function chooseSlot(target: SlotRef) {
    const state = useGameStore.getState()
    const owner = playerId === 1 ? state.giocatore1 : state.giocatore2
    if (!moving || !selection) {
      setSelection(getInSlot(owner.squadra, owner.deposito, target) ? target : null)
      setMessage('')
      setPreviewTarget(null)
      return
    }
    moveBetween(selection, target)
  }

  /** Trascinamento con il mouse: solo i posti occupati partono, ogni posto può ricevere. */
  function dragProps(ref: SlotRef, occupied: boolean) {
    return {
      draggable: mayManage && occupied,
      onDragStart: (event: DragEvent<HTMLButtonElement>) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(ref))
        event.dataTransfer.setData('text/plain', event.currentTarget.getAttribute('aria-label') ?? '')
        setDragSource(ref); setSelection(ref); setMoving(false); setMessage('')
      },
      onDragEnd: () => { setDragSource(null); setPreviewTarget(null) },
      onDragOver: (event: DragEvent<HTMLButtonElement>) => {
        if (!dragSource) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (!previewTarget || !sameSlot(previewTarget, ref)) setPreviewTarget(ref)
      },
      onDrop: (event: DragEvent<HTMLButtonElement>) => {
        if (!dragSource) return
        event.preventDefault()
        moveBetween(dragSource, ref)
      },
    }
  }

  function slotClass(base: string, ref: SlotRef) {
    return `${base}${sameSlot(selection, ref) ? ' is-selected' : ''}${targeting ? ' is-move-target' : ''}${previewTarget && targeting && sameSlot(previewTarget, ref) ? ' is-drop-target' : ''}${dragSource && sameSlot(dragSource, ref) ? ' is-dragging' : ''}`
  }

  return (
    <section className="pu-screen pu-deposit-screen pu-u2-deposit" aria-labelledby="pu-deposit-title" data-deposit-moving={targeting ? 'true' : undefined}>
      <header className="pu-screen-heading"><div><p className="pu-kicker">Squadra e riserve · {player.nome}</p><h1 id="pu-deposit-title">Deposito Arkamon</h1><p>Un posto per ogni compagno di viaggio.</p></div><span className="pu-count"><KitIcon id="icon-deposit" /> Box {box} / {BOX_COUNT}</span></header>
      <div className="pu-deposit-layout">
        <KitPanel className="pu-deposit-grid-panel">
          <div className="pu-deposit-bar">
            <nav className="pu-box-toolbar" aria-label="Box del deposito">
              <KitButton artwork="previous" aria-label={`Vai al box ${previousBox}`} onClick={() => changeBox(previousBox)}>←</KitButton>
              <label className="pu-box-title"><span className="sr-only">Box</span>
                <select aria-label="Scegli box del deposito" value={box} onChange={(event) => changeBox(Number(event.target.value))}>{Array.from({ length: BOX_COUNT }, (_, index) => <option key={index + 1} value={index + 1}>Box {index + 1}</option>)}</select>
                <span className="pu-box-title-text" aria-hidden="true">Box {twoDigits(box)}<small>{boxCount} / {SLOT_PER_BOX}</small></span>
              </label>
              <KitButton artwork="next" aria-label={`Vai al box ${nextBox}`} onClick={() => changeBox(nextBox)}>→</KitButton>
              {filtering && <KitButton className="pu-next-match" disabled={!nextMatchingBox || nextMatchingBox === box} onClick={() => nextMatchingBox && changeBox(nextMatchingBox)}>Prossimo box con risultati</KitButton>}
              <span className="sr-only">{BOX_COUNT} box · {SLOT_PER_BOX} posti ciascuno</span>
            </nav>
            <div className="pu-deposit-filters" aria-label="Filtri del deposito">
              <label className="pu-deposit-search"><span className="sr-only">Nome o numero</span><input type="search" value={filters.search} placeholder="Cerca" onChange={event => setFilters({ ...filters, search: event.target.value })} /></label>
              <label className="pu-deposit-type"><span className="sr-only">Tipo</span><select value={filters.type} onChange={event => setFilters({ ...filters, type: event.target.value as DepositFilters['type'] })}><option value="all">Tipo</option>{TABELLA_TIPI.tipi.map(type => <option key={type}>{type}</option>)}</select></label>
              <details className="pu-deposit-more" open={advancedFilters > 0 || undefined}>
                <summary>Filtri{advancedFilters ? ` · ${advancedFilters}` : ''}</summary>
                <div className="pu-deposit-more-fields">
                  <label>Condizione<select value={filters.condition} onChange={event => setFilters({ ...filters, condition: event.target.value as DepositFilters['condition'] })}><option value="all">Tutte</option><option value="healthy">In salute</option><option value="status">Status</option><option value="ko">KO</option></select></label>
                  <label>Livello min.<input type="number" min={5} max={100} value={filters.minimum} placeholder="5" onChange={event => setFilters({ ...filters, minimum: event.target.value })} /></label>
                  <label>Livello max.<input type="number" min={5} max={100} value={filters.maximum} placeholder="100" onChange={event => setFilters({ ...filters, maximum: event.target.value })} /></label>
                </div>
              </details>
              {filtering && <KitButton className="pu-deposit-reset" onClick={() => setFilters(EMPTY_DEPOSIT_FILTERS)}>Azzera filtri</KitButton>}
            </div>
          </div>
          <p className="pu-deposit-filter-result" role="status">{filtering ? `${matchingInBox} risultati in questo box · ${matchingEntries.length} in tutto il deposito. I posti restano nella loro posizione.` : mayManage ? 'Trascina un compagno su un altro posto, oppure selezionalo e premi «Sposta o scambia».' : 'Seleziona un compagno per consultarne la scheda.'}</p>
          <SpatialNavigation columns={7} selectOnFocus={!moving} className="pu-box-grid" role="group" aria-label={`Contenuto del box ${box}`}>
            {Array.from({ length: SLOT_PER_BOX }, (_, index) => {
              const slot = index + 1
              const key = chiaveDeposito(box, slot)
              const owned = player.deposito[key]
              const occupant = owned ? liveOwnedPokemon(owned, battle) : undefined
              const ref: SlotRef = { tipo: 'deposito', chiave: key }
              const matching = !occupant || matchesDepositFilters(occupant, filters)
              const occupantSpecies = occupant ? getPokemon(occupant.specieId) : undefined
              return <button data-rpg-item key={key} type="button" className={slotClass(`pu-box-slot${matching ? '' : ' is-filtered-out'}${occupant ? '' : ' is-empty'}`, ref)}
                aria-label={`Box ${box}, posto ${slot}: ${occupant ? `${occupant.nome}, livello ${occupant.livello}` : 'vuoto'}`}
                aria-pressed={sameSlot(selection, ref)}
                data-filter-match={matching} data-condition={occupant ? (occupant.hp <= 0 ? 'ko' : occupant.stato ? 'status' : 'healthy') : undefined}
                title={occupant ? `${occupant.nome} · Lv. ${occupant.livello}${occupant.hp <= 0 ? ' · KO' : occupant.stato ? ` · ${occupant.stato.tipo}` : ''}` : 'Posto libero'}
                onFocus={() => moving && setPreviewTarget(ref)} onMouseEnter={() => moving && setPreviewTarget(ref)}
                onClick={() => chooseSlot(ref)} {...dragProps(ref, !!occupant)}>
                {occupant ? <>
                  <CreaturePortrait pokemon={occupant} selected={sameSlot(selection, ref)} />
                  {occupantSpecies && <TypeSeal type={occupantSpecies.tipo} labelled={false} />}
                  <span className="pu-box-slot-level">Lv. {occupant.livello}</span>
                </> : <span className="pu-empty-slot" aria-hidden="true">{slot}</span>}
              </button>
            })}
          </SpatialNavigation>
        </KitPanel>
        <KitPanel className="pu-detail-panel pu-deposit-detail">
          {pokemon ? <>
            <section className="pu-hero pu-deposit-hero" aria-label={`Arkamon selezionato: ${pokemon.nome}`}>
              <div className="pu-hero-caption">
                <h2>{pokemon.nome}</h2>
                {species && <TypeBadge type={species.tipo} />}
                <span className="pu-kicker">Lv. {pokemon.livello} · Nº {String(pokemon.specieId).padStart(3, '0')}{pokemon.hp <= 0 ? ' · KO' : pokemon.stato ? ` · ${pokemon.stato.tipo}` : ''}</span>
              </div>
              {/* Medaglione runico: la creatura sta nella finestra circolare della cornice. */}
              <div className="pu-deposit-stage">
                <div className="pu-deposit-medallion">
                  <GameArt id="summoning-ring" className="pu-deposit-ring" />
                  <CreaturePortrait pokemon={pokemon} large />
                </div>
              </div>
            </section>
            <HealthBar pokemon={pokemon} />
            <dl className="pu-deposit-facts">
              <div><dt>Livello</dt><dd>{pokemon.livello}</dd></div>
              <div><dt>Crescita</dt><dd>{species?.categoria ?? '—'}</dd></div>
              <div><dt>Condizione</dt><dd>{condition(pokemon)}</dd></div>
            </dl>
          </> : <div className="pu-empty-state"><KitIcon id="icon-deposit" /><h2>Scegli un Arkamon</h2><p>Seleziona un compagno nella squadra o nel box per consultare la sua scheda.</p></div>}
          {mayManage && moving && <p className="pu-note">Scegli un posto del box o della squadra. Un posto occupato scambia i due Arkamon.</p>}
          {swapPreview && <div className={`pu-swap-preview${swapPreview.allowed ? '' : ' is-blocked'}`} role="status" aria-live="polite">
            <span className="pu-kicker">Squadra dopo lo spostamento</span>
            <strong>{swapPreview.count} / 6 · Lv. {swapPreview.range.min}–{swapPreview.range.max} · Δ {swapPreview.range.gap} / 5</strong>
            <span>{swapPreview.balanced ? 'Fascia valida' : swapPreview.allowed ? 'Rimozione consentita: continua a riordinare la squadra fuori fascia.' : 'Scambio bloccato: supera la differenza massima di 5 livelli.'}</span>
          </div>}
          {/* Fase U6: il riquadro occupa già il suo spazio durante lo spostamento. Sul telefono la squadra sta
              sotto la scheda: se il riquadro comparisse al passaggio del dito, la fila scenderebbe sotto il tocco. */}
          {!swapPreview && mayManage && moving && <div className="pu-swap-preview is-pending" role="status" aria-live="polite">
            <span className="pu-kicker">Squadra dopo lo spostamento</span>
            <strong>—</strong>
            <span>Indica un posto per vedere la squadra risultante.</span>
          </div>}
          {!mayManage && <p className="pu-readonly" role="status">{leagueRunning ? 'Consultazione: concludi il tentativo della Lega prima di cambiare squadra.' : 'Consultazione: nessuno scambio durante una battaglia, un’interazione in corso o il turno dell’altro giocatore.'}</p>}
          {message && <p className="pu-note" role="status">{message}</p>}
          <div className="pu-actions">
            <KitButton active disabled={!pokemon || !mayManage} onClick={() => { setMoving(!moving); setMessage(''); setPreviewTarget(null) }}>{moving ? 'Annulla spostamento' : 'Sposta o scambia'}</KitButton>
            {onAnalyse && <KitButton disabled={!pokemon} onClick={() => pokemon && onAnalyse(pokemon.istanzaId)}><KitIcon id="icon-analysis" /> Analizza Arkamon</KitButton>}
          </div>
        </KitPanel>
        <section className="pu-deposit-team-strip" aria-labelledby="pu-deposit-team-title">
          <h3 id="pu-deposit-team-title">Squadra · {player.squadra.length} / {SQUADRA_MAX}</h3>
          <SpatialNavigation columns={6} selectOnFocus={!moving} className="pu-deposit-team" role="group" aria-label="Squadra">
            {Array.from({ length: SQUADRA_MAX }, (_, index) => {
              const owned = player.squadra[index]
              const occupant = owned ? liveOwnedPokemon(owned, battle) : undefined
              const occupantSpecies = occupant ? getPokemon(occupant.specieId) : undefined
              const ref: SlotRef = { tipo: 'squadra', indice: index }
              return <button data-rpg-item key={index} type="button" className={slotClass(`pu-box-slot pu-deposit-team-slot${occupant ? '' : ' is-empty'}`, ref)}
                aria-label={`Squadra, posto ${index + 1}: ${occupant ? `${occupant.nome}, livello ${occupant.livello}` : 'vuoto'}`}
                aria-pressed={sameSlot(selection, ref)} onClick={() => chooseSlot(ref)}
                onFocus={() => moving && setPreviewTarget(ref)} onMouseEnter={() => moving && setPreviewTarget(ref)} {...dragProps(ref, !!occupant)}>
                {occupant ? <>
                  <CreaturePortrait pokemon={occupant} />
                  <span className="pu-deposit-team-copy">
                    <span className="pu-deposit-team-name">{occupantSpecies && <TypeSeal type={occupantSpecies.tipo} labelled={false} />}{occupant.nome}</span>
                    <span className="pu-box-slot-level">Lv. {occupant.livello}</span>
                    <HealthBar pokemon={occupant} />
                  </span>
                </> : <span className="pu-empty-slot">Posto {index + 1}</span>}
              </button>
            })}
          </SpatialNavigation>
          <p className="pu-note">{isTeamWithinLevelCap(player.squadra) ? 'Squadra in equilibrio' : 'Squadra fuori fascia'} · Lv. {range.min}–{range.max} · differenza {range.gap} / 5.</p>
        </section>
      </div>
    </section>
  )
}
