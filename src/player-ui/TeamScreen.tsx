import { useState } from 'react'
import { getPokemon } from '@data/index'
import { SQUADRA_MAX } from '@engine/deposito'
import { isTeamWithinLevelCap, teamLevelRange, TEAM_LEVEL_GAP } from '@/engine/teamLevelCap'
import { useGameStore, type GameState } from '@store/gameStore'
import type { PokemonIstanza, StatoBattaglia } from '@/types'
import { CreaturePortrait, HealthBar, KitButton, KitFrame, KitIcon, KitPanel, PokemonHero, PokemonMoves, TypeBadge } from './kit'

export interface TeamScreenProps {
  playerId: 1 | 2
  onAnalyse: (instanceId: string) => void
  onBag: () => void
  onDeposit: () => void
}

/** Viewing another player's tools never changes the active turn. */
export function canManagePlayerTeam(
  state: Pick<GameState, 'battaglia' | 'interactionProgress' | 'giocatoreAttivo' | 'turnoOverworld' | 'challengeContext' | 'scenaCorrente'>,
  playerId: 1 | 2,
): boolean {
  return !state.battaglia && !state.interactionProgress.pendingBattle && !state.challengeContext
    && !['titolo', 'laboratorio', 'evoluzione'].includes(state.scenaCorrente.scena)
    && state.giocatoreAttivo === playerId
    && state.turnoOverworld.giocatoreAttivo === playerId
    && state.turnoOverworld.azioniRimaste > 0
}

/** During a fight, the settled battle instance contains the latest HP and status. */
export function liveOwnedPokemon(pokemon: PokemonIstanza, battle: StatoBattaglia | null): PokemonIstanza {
  if (!battle) return pokemon
  return [battle.pokemonA, battle.pokemonB, ...(battle.squadraA ?? []), ...(battle.squadraB ?? [])]
    .find((entry) => entry.istanzaId === pokemon.istanzaId) ?? pokemon
}

export function TeamScreen(props: TeamScreenProps) {
  return <PlayerTeamScreen key={props.playerId} {...props} />
}

function PlayerTeamScreen({ playerId, onAnalyse, onBag, onDeposit }: TeamScreenProps) {
  const player = useGameStore((state) => playerId === 1 ? state.giocatore1 : state.giocatore2)
  const battle = useGameStore((state) => state.battaglia)
  const mayManage = useGameStore((state) => canManagePlayerTeam(state, playerId))
  const ruleMessage = useGameStore((state) => state.teamRuleMessage)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const selected = player.squadra.find((pokemon) => pokemon.istanzaId === selectedId) ?? player.squadra[0]
  const current = selected ? liveOwnedPokemon(selected, battle) : undefined
  const range = teamLevelRange(player.squadra)
  const balanced = isTeamWithinLevelCap(player.squadra)

  function chooseSlot(index: number) {
    const state = useGameStore.getState()
    const livePlayer = playerId === 1 ? state.giocatore1 : state.giocatore2
    const target = livePlayer.squadra[index]
    if (!movingId) {
      if (target) setSelectedId(target.istanzaId)
      return
    }
    if (!canManagePlayerTeam(state, playerId)) {
      setMovingId(null)
      setMessage('La squadra è in consultazione. Potrai riordinarla durante il tuo turno.')
      return
    }
    const sourceIndex = livePlayer.squadra.findIndex((pokemon) => pokemon.istanzaId === movingId)
    if (sourceIndex < 0 || !target) {
      setMovingId(null)
      setMessage('Scegli un posto occupato per cambiare l’ordine della squadra.')
      return
    }
    if (sourceIndex !== index) {
      state.scambiaSlot(playerId, { tipo: 'squadra', indice: sourceIndex }, { tipo: 'squadra', indice: index })
      setMessage('Ordine della squadra aggiornato.')
    }
    setMovingId(null)
  }

  return (
    <section className="pu-screen pu-team-screen" aria-labelledby="pu-team-title">
      <header className="pu-screen-heading">
        <div><p className="pu-kicker">La tua squadra · {player.nome}</p><h1 id="pu-team-title">Gestione squadra</h1><p>Sei posti. I tuoi compagni di viaggio.</p></div>
        <span className="pu-count"><KitIcon id="icon-team" /> {player.squadra.length} / {SQUADRA_MAX} Arkamon</span>
      </header>
      <div className="pu-team-layout">
        <div className="pu-team-list" role="group" aria-label={`Squadra di ${player.nome}`}>
          {Array.from({ length: SQUADRA_MAX }, (_, index) => {
            const owned = player.squadra[index]
            const pokemon = owned ? liveOwnedPokemon(owned, battle) : undefined
            const species = pokemon ? getPokemon(pokemon.specieId) : undefined
            return (
              <button key={index} type="button"
                className={`pu-team-slot${pokemon && pokemon.istanzaId === current?.istanzaId ? ' is-selected' : ''}${movingId && mayManage && pokemon ? ' is-move-target' : ''}`}
                aria-label={`Squadra, posto ${index + 1}: ${pokemon ? `${pokemon.nome}, livello ${pokemon.livello}` : 'vuoto'}`}
                aria-pressed={!!pokemon && pokemon.istanzaId === current?.istanzaId}
                disabled={!pokemon}
                onClick={() => chooseSlot(index)}>
                <KitFrame id={pokemon?.istanzaId === current?.istanzaId ? 'card-selected-violet' : 'card-default'} />
                <span className="pu-slot-number" aria-hidden="true">{index + 1}</span>
                {pokemon ? <>
                  <CreaturePortrait pokemon={pokemon} selected={pokemon.istanzaId === current?.istanzaId} />
                  <span className="pu-team-slot-content">
                    <span className="pu-team-slot-title"><strong>{pokemon.nome}</strong><span>Lv. {pokemon.livello}</span></span>
                    <HealthBar pokemon={pokemon} />
                    <span className="pu-team-slot-meta">
                      {species && <TypeBadge type={species.tipo} />}
                      {pokemon.hp <= 0 ? <span className="pu-status-pill pu-status-ko">KO</span>
                        : pokemon.stato && <span className="pu-status-pill">{pokemon.stato.tipo}</span>}
                    </span>
                  </span>
                </> : <span className="pu-empty-slot">Posto libero</span>}
              </button>
            )
          })}
          <KitPanel className={`pu-team-cap${balanced ? '' : ' pu-warning'}`}>
            <KitIcon id="icon-activity" />
            <div><strong>{balanced ? 'Squadra in equilibrio' : 'Squadra fuori fascia'} · Δ {range.gap} livelli</strong>
              <p>{player.squadra.length ? `Fascia attuale: Lv. ${range.min}–${range.max}.` : 'Scegli il tuo starter per iniziare.'} Differenza massima: {TEAM_LEVEL_GAP}.</p></div>
          </KitPanel>
          <KitButton onClick={onDeposit}><KitIcon id="icon-box" /> Apri deposito</KitButton>
        </div>
        <div className="pu-hero-column">
          {current ? <PokemonHero pokemon={current} /> : <KitPanel className="pu-empty-state"><KitIcon id="icon-team" /><h2>Il viaggio sta per cominciare</h2><p>La tua squadra apparirà qui dopo la scelta dello starter.</p></KitPanel>}
        </div>
        <KitPanel className="pu-detail-panel">
          <p className="pu-kicker">Condizioni del compagno</p>
          <h2 className="pu-section-title">{current ? current.hp <= 0 ? 'Arkamon esausto' : current.stato ? current.stato.tipo : 'Pronto al viaggio' : 'Nessun Arkamon selezionato'}</h2>
          {current && <><HealthBar pokemon={current} /><p className="pu-note">Gli HP restano dopo ogni scontro. La cura è sempre esplicita.</p><h3>Mosse disponibili</h3><PokemonMoves pokemon={current} /><p className="pu-note">{current.xp} XP conservati.</p></>}
          {!mayManage && <p className="pu-readonly" role="status">Consultazione: il riordino è disponibile nel tuo turno, fuori dalla battaglia.</p>}
          {(message || (mayManage && ruleMessage)) && <p className="pu-note" role="status">{message || ruleMessage}</p>}
          {movingId && mayManage && <p className="pu-note" role="status">Scegli un altro Arkamon della squadra per scambiare i due posti.</p>}
          <div className="pu-actions">
            <KitButton active disabled={!current} onClick={() => current && onAnalyse(current.istanzaId)}><KitIcon id="icon-analysis" /> Analizza Arkamon</KitButton>
            <KitButton disabled={!current} onClick={onBag}><KitIcon id="icon-bag" /> Apri borsa</KitButton>
            <KitButton disabled={!current || !mayManage} onClick={() => { setMovingId(movingId ? null : current?.istanzaId ?? null); setMessage('') }}>{movingId ? 'Annulla spostamento' : 'Cambia ordine'}</KitButton>
          </div>
        </KitPanel>
      </div>
    </section>
  )
}
