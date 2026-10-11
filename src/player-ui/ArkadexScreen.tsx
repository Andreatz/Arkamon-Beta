import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { getPokemon, POKEMON_BASE, TABELLA_TIPI } from '@/data'
import { calcolaHPMax } from '@/engine/battleEngine'
import { getArkamonAnimationAsset } from '@/components/arkamon/arkamonAnimationManifest'
import {
  arkadexEvolutionLabel, deriveArkadexProgress, getArkadexEntries, getArkadexSpecimens,
  type ArkadexFilter, type ArkadexSnapshot,
} from '@/arkadex/arkadexModel'
import { useGameStore } from '@/store/gameStore'
import type { PokemonIstanza, PokemonSpecie, TipoPokemon } from '@/types'
import { KitButton, KitIcon, KitPanel, PokemonMoves, SpeciesPortrait, TypeBadge } from './kit'
import { liveOwnedPokemon } from './TeamScreen'

const AnimatedArkamon = lazy(async () => ({ default: (await import('@/components/arkamon/ArkamonBattleSprite')).ArkamonBattleSprite }))
const statusLabels = { unknown: 'Da scoprire', seen: 'Visto', caught: 'Ottenuto' } as const

export interface ArkadexScreenProps {
  playerId: 1 | 2
  onPlayerChange?: (playerId: 1 | 2) => void
}

function evolutionChain(species: PokemonSpecie): PokemonSpecie[] {
  let first = species
  const ancestors = new Set<number>([species.id])
  for (;;) {
    const previous = POKEMON_BASE.find((entry) => entry.evoluzioneId === first.id)
    if (!previous || ancestors.has(previous.id)) break
    first = previous
    ancestors.add(first.id)
  }
  const result: PokemonSpecie[] = [], visited = new Set<number>()
  let current: PokemonSpecie | undefined = first
  while (current && !visited.has(current.id)) {
    result.push(current)
    visited.add(current.id)
    current = current.evoluzioneId ? getPokemon(current.evoluzioneId) : undefined
  }
  return result
}

/** Discovery and specimen data come from the campaign; unknown forms never request artwork. */
export function ArkadexScreen({ playerId, onPlayerChange }: ArkadexScreenProps) {
  const state = useGameStore()
  const [viewPlayerId, setViewPlayerId] = useState<1 | 2>(playerId)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ArkadexFilter>('all')
  const [type, setType] = useState<TipoPokemon | 'all'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [animatedSpeciesId, setAnimatedSpeciesId] = useState<number | null>(null)
  useEffect(() => {
    setViewPlayerId(playerId)
    setSearch(''); setStatus('all'); setType('all')
    setSelectedId(null); setSelectedInstanceId(null); setAnimatedSpeciesId(null)
  }, [playerId, state.campaignRevision])
  const snapshot: ArkadexSnapshot = useMemo(() => ({
    giocatore1: state.giocatore1, giocatore2: state.giocatore2,
    giocatoreAttivo: state.giocatoreAttivo, battaglia: state.battaglia,
  }), [state.giocatore1, state.giocatore2, state.giocatoreAttivo, state.battaglia])
  const progress = useMemo(() => deriveArkadexProgress(state.arkadex, snapshot), [state.arkadex, snapshot])
  const entries = getArkadexEntries(progress, viewPlayerId, { search, status, type })
  const selected = entries.find((entry) => entry.id === selectedId)
    ?? entries.find((entry) => entry.status !== 'unknown') ?? entries[0]
  const species = selected?.species
  const specimens = selected ? getArkadexSpecimens(snapshot, viewPlayerId, selected.id) : []
  const specimen = specimens.find((entry) => entry.pokemon.istanzaId === selectedInstanceId) ?? specimens[0]
  // A catalog reference is explicitly labelled; it is never inserted into the team or save.
  const pokemon: PokemonIstanza | undefined = species ? (specimen ? liveOwnedPokemon(specimen.pokemon, state.battaglia) : {
    istanzaId: 'arkadex-reference', specieId: species.id, nome: species.nome,
    livello: 5, hp: species.hpBase, xp: 0,
  }) : undefined
  const player = state[viewPlayerId === 1 ? 'giocatore1' : 'giocatore2']
  const seenIds = progress[viewPlayerId === 1 ? 'seen1' : 'seen2']
  const caughtIds = progress[viewPlayerId === 1 ? 'caught1' : 'caught2']
  const seen = new Set(seenIds)
  const chain = species ? evolutionChain(species) : []
  const canAnimate = !!species && !!getArkamonAnimationAsset(species.id, 'front', 'idle')
  const animated = canAnimate && animatedSpeciesId === species?.id

  return <section className="pu-dex-screen" aria-label="Arkadex">
    <div className="pu-screen-toolbar">
      <label className="pu-player-picker">Giocatore dell’Arkadex
        <select value={viewPlayerId} onChange={(event) => {
          const id = Number(event.target.value) as 1 | 2
          setViewPlayerId(id); onPlayerChange?.(id)
          setSelectedId(null); setSelectedInstanceId(null); setAnimatedSpeciesId(null)
        }}><option value={1}>G1 · {state.giocatore1.nome || 'Giocatore 1'}</option><option value={2}>G2 · {state.giocatore2.nome || 'Giocatore 2'}</option></select>
      </label>
      <p className="pu-discovery-count"><strong>{player.nome || `Giocatore ${viewPlayerId}`}</strong><span>{seenIds.length} / {POKEMON_BASE.length} viste · {caughtIds.length} / {POKEMON_BASE.length} ottenute</span></p>
    </div>
    <div className="pu-dex-layout">
      <KitPanel className="pu-dex-index">
        <div className="pu-filter-grid">
          <label>Cerca specie scoperta o numero<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome o numero" /></label>
          <label>Scoperta<select value={status} onChange={(event) => setStatus(event.target.value as ArkadexFilter)}>
            <option value="all">Tutte</option><option value="unknown">Da scoprire</option><option value="seen">Viste, ancora da ottenere</option><option value="caught">Ottenute</option>
          </select></label>
          <label>Tipo conosciuto<select value={type} onChange={(event) => setType(event.target.value as TipoPokemon | 'all')}>
            <option value="all">Tutti i tipi</option>{TABELLA_TIPI.tipi.map((name) => <option key={name} value={name}>{name}</option>)}
          </select></label>
        </div>
        <p role="status" className="pu-result-count">{entries.length} schede corrispondenti. Nome e tipo sono ricercabili soltanto dopo la scoperta.</p>
        <div className="pu-dex-list" aria-label="Specie dell’Arkadex">
          {entries.map((entry) => <KitButton key={entry.id} active={selected?.id === entry.id} className="pu-dex-row"
            aria-pressed={selected?.id === entry.id}
            aria-label={`Numero ${entry.id}: ${entry.species?.nome ?? 'specie da scoprire'} · ${statusLabels[entry.status]}`}
            onClick={() => { setSelectedId(entry.id); setSelectedInstanceId(null); setAnimatedSpeciesId(null) }}>
            {entry.species ? <SpeciesPortrait speciesId={entry.id} /> : <span className="pu-unknown-portrait" aria-hidden="true">?</span>}
            <span><small>Nº {String(entry.id).padStart(3, '0')}</small><strong>{entry.species?.nome ?? '???'}</strong><small>{statusLabels[entry.status]}</small></span>
            <span className="pu-discovery-mark" aria-hidden="true">{entry.status === 'caught' ? '◉' : entry.status === 'seen' ? '◇' : '?'}</span>
          </KitButton>)}
          {!entries.length && <p className="pu-empty">Nessuna specie corrisponde ai filtri scelti.</p>}
        </div>
      </KitPanel>

      <div className="pu-dex-hero pu-hero">
        {species ? <>
          <span className="pu-species-number">ARKA / {String(species.id).padStart(3, '0')}</span>
          {animated ? <div className="pu-species-animation"><Suspense fallback={<p>Caricamento animazione…</p>}><AnimatedArkamon speciesId={species.id} name={species.nome} side="front" animation="idle" /></Suspense></div>
            : <SpeciesPortrait speciesId={species.id} large />}
          <div className="pu-hero-caption"><span className="pu-kicker">{statusLabels[selected.status]}</span><h2>{species.nome}</h2><TypeBadge type={species.tipo} /></div>
          {canAnimate && <KitButton className="pu-animation-toggle" active={animated} aria-pressed={animated} onClick={() => setAnimatedSpeciesId(animated ? null : species.id)}>{animated ? 'Ferma animazione' : 'Mostra animazione'}</KitButton>}
        </> : <div className="pu-unknown-hero"><KitIcon id="icon-book" /><span aria-hidden="true">?</span><h2>{selected ? 'Specie da scoprire' : 'Nessuna scheda'}</h2><p>{selected ? `Nº ${String(selected.id).padStart(3, '0')}` : 'Modifica la ricerca per consultare l’Arkadex.'}</p></div>}
      </div>

      <KitPanel className="pu-dex-detail">
        {!selected ? <p className="pu-empty">Nessuna specie corrisponde ai filtri scelti.</p> : !species || !pokemon ? <article aria-label="Scheda da scoprire">
          <span className="pu-kicker">Arkadex · Nº {String(selected.id).padStart(3, '0')}</span><h2>Specie da scoprire</h2><p>Incontra questa specie durante la partita per rivelarne nome, tipo e mosse.</p>
        </article> : <article aria-label={`Scheda di ${species.nome}`}>
          <span className="pu-kicker">Arkadex · Nº {String(species.id).padStart(3, '0')}</span><h2>{species.nome}</h2>
          <p className="pu-discovery-state">{statusLabels[selected.status]} · {species.categoria}</p>
          {specimens.length > 1 && <label>Esemplare<select value={specimen?.pokemon.istanzaId} onChange={(event) => setSelectedInstanceId(event.target.value)}>
            {specimens.map((entry) => <option key={`${entry.source}-${entry.pokemon.istanzaId}`} value={entry.pokemon.istanzaId}>{entry.pokemon.nome} · Lv. {entry.pokemon.livello} · {entry.source}</option>)}
          </select></label>}
          <p>{specimen ? `Esemplare in ${specimen.source}: ${pokemon.nome}, livello ${pokemon.livello}.` : 'Dati di riferimento al livello 5: nessun esemplare di questa specie disponibile.'}</p>
          <dl className="pu-facts"><div><dt>Tipo</dt><dd><TypeBadge type={species.tipo} /></dd></div><div><dt>Categoria</dt><dd>{species.categoria}</dd></div><div><dt>HP massimi</dt><dd>{calcolaHPMax(pokemon)}</dd></div><div><dt>HP attuali</dt><dd>{specimen ? pokemon.hp : '—'}</dd></div><div><dt>Tasso cattura</dt><dd>{species.tassoCattura} / 5</dd></div><div><dt>Livello</dt><dd>{pokemon.livello}</dd></div></dl>
          {specimen && <p>Status: {pokemon.stato?.tipo ?? 'nessuno'}. XP: {pokemon.xp}.</p>}
          <h3>Mosse al livello {pokemon.livello}</h3><PokemonMoves pokemon={pokemon} />
          <h3>Linea evolutiva</h3><div className="pu-evolution">{chain.map((entry, index) => {
            const known = seen.has(entry.id)
            return <div className={`pu-evolution-step ${entry.id === species.id ? 'is-current' : ''}`} key={entry.id}>
              {known ? <SpeciesPortrait speciesId={entry.id} /> : <span className="pu-unknown-portrait" aria-hidden="true">?</span>}
              <strong>{known ? entry.nome : 'Da scoprire'}</strong><small>{index === 0 ? 'Base' : seen.has(chain[index - 1].id) ? `Lv. ${chain[index - 1].livelloEvoluzione ?? '—'}` : 'Da scoprire'}</small>
            </div>
          })}</div><p className="pu-note">{arkadexEvolutionLabel(species, progress, viewPlayerId)}</p>
        </article>}
      </KitPanel>
    </div>
  </section>
}
