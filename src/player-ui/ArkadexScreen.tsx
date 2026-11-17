import { getArkadexText } from '@/data/arkadexTexts'
import { SpatialNavigation } from '@/components/rpg/SpatialNavigation'
import { usePlayerUiMemory, usePublishPlayerUiSelection } from './playerUiSession'
import { lazy, Suspense, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { UiPreviewViewContext } from '@/ui-studio/UiPreviewViewContext'
import { getPokemon, POKEMON_BASE, TABELLA_TIPI } from '@/data'
import { calcolaHPMax } from '@/engine/battleEngine'
import { getArkamonAnimationAsset } from '@/components/arkamon/arkamonAnimationManifest'
import {
  arkadexEvolutionLabel, deriveArkadexProgress, getArkadexEntries, getArkadexHabitats, getArkadexSpecimens,
  type ArkadexEntry, type ArkadexFilter, type ArkadexSnapshot,
} from '@/arkadex/arkadexModel'
import { getBackground } from '@/data/backgrounds'
import { useGameStore } from '@/store/gameStore'
import type { PokemonIstanza, PokemonSpecie, TipoPokemon } from '@/types'
import { KitButton, KitIcon, KitPanel, PokemonMoves, SpeciesPortrait, TypeBadge, TypeSeal } from './kit'
import { liveOwnedPokemon } from './currentRoster'
import { useSplashArtwork } from './reference/SplashArtworkContext'

const AnimatedArkamon = lazy(async () => ({ default: (await import('@/components/arkamon/ArkamonBattleSprite')).ArkamonBattleSprite }))
const statusLabels = { unknown: 'Da scoprire', seen: 'Visto', caught: 'Ottenuto' } as const
type ArkadexDetailTab = 'information' | 'moves' | 'evolution'

export interface ArkadexScreenProps {
  playerId: 1 | 2
  onPlayerChange?: (playerId: 1 | 2) => void
  showPlayerPicker?: boolean
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

/**
 * Monta il ritratto solo quando la riga si avvicina alla parte visibile della lista:
 * l'indice scorre su tutte le specie senza scaricare subito ogni immagine.
 */
function NearViewport({ children, eager = false }: { children: ReactNode; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(eager)
  useEffect(() => {
    if (near || !ref.current) return
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const observer = new IntersectionObserver((records) => {
      if (records.some((record) => record.isIntersecting)) { setNear(true); observer.disconnect() }
    }, { rootMargin: '240px 0px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [near])
  return <span ref={ref} className="pu-dex-row-art">{near ? children : null}</span>
}

function DexRowMark({ entry }: { entry: ArkadexEntry }) {
  return <span className={`pu-discovery-mark is-${entry.status}`} aria-hidden="true">{entry.status === 'caught' ? '●' : entry.status === 'seen' ? '◐' : '?'}</span>
}

/** Discovery and specimen data come from the campaign; unknown forms never request artwork. */
export function ArkadexScreen({ playerId, onPlayerChange, showPlayerPicker = true }: ArkadexScreenProps) {
  const previewView = useContext(UiPreviewViewContext)
  const state = useGameStore()
  const [viewPlayerId, setViewPlayerId] = useState<1 | 2>(playerId)
  const [search, setSearch] = usePlayerUiMemory(viewPlayerId, 'dex.search', '')
  const [status, setStatus] = usePlayerUiMemory<ArkadexFilter>(viewPlayerId, 'dex.status', 'all')
  const [type, setType] = usePlayerUiMemory<TipoPokemon | 'all'>(viewPlayerId, 'dex.type', 'all')
  const [selectedId, setSelectedId] = usePlayerUiMemory<number | null>(viewPlayerId, 'dex.species', null)
  const [selectedInstanceId, setSelectedInstanceId] = usePlayerUiMemory<string | null>(viewPlayerId, 'dex.instance', null)
  const [animatedSpeciesId, setAnimatedSpeciesId] = useState<number | null>(null)
  const [detailTab, setDetailTab] = usePlayerUiMemory<ArkadexDetailTab>(viewPlayerId, 'dex.tab', previewView === 'moves' || previewView === 'evolution' ? previewView : 'information')
  useEffect(() => { setViewPlayerId(playerId); setAnimatedSpeciesId(null) }, [playerId, state.campaignRevision])
  useEffect(() => { if (previewView === 'moves' || previewView === 'evolution') setDetailTab(previewView) }, [previewView, setDetailTab])
  const snapshot: ArkadexSnapshot = useMemo(() => ({
    giocatore1: state.giocatore1, giocatore2: state.giocatore2,
    giocatoreAttivo: state.giocatoreAttivo, battaglia: state.battaglia,
  }), [state.giocatore1, state.giocatore2, state.giocatoreAttivo, state.battaglia])
  const progress = useMemo(() => deriveArkadexProgress(state.arkadex, snapshot), [state.arkadex, snapshot])
  const entries = getArkadexEntries(progress, viewPlayerId, { search, status, type })
  const selected = entries.find((entry) => entry.id === selectedId)
    ?? entries.find((entry) => entry.status !== 'unknown') ?? entries[0]
  const species = selected?.species
  const arkadexText = species ? getArkadexText(species.id) : undefined
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
  usePublishPlayerUiSelection(viewPlayerId, { speciesId: species?.id, instanceId: specimen?.pokemon.istanzaId })
  const animated = canAnimate && animatedSpeciesId === species?.id
  const readySplash = useSplashArtwork()
  const splash = readySplash?.playerId === viewPlayerId && readySplash.speciesId === species?.id ? readySplash : null
  const habitats = species ? getArkadexHabitats(species.id) : []
  const habitatImage = habitats[0] ? getBackground(habitats[0].place) : null
  const listAnchor = useRef<HTMLSpanElement>(null)
  // La riga selezionata resta visibile quando cambiano filtri o scheda scelta da fuori.
  useEffect(() => {
    const row = listAnchor.current?.closest('.pu-dex-index')?.querySelector<HTMLElement>('.pu-dex-list .pu-dex-row[aria-pressed="true"]')
    row?.scrollIntoView?.({ block: 'nearest' })
  }, [selected?.id, search, status, type])

  function resetFilters() {
    setSearch(''); setStatus('all'); setType('all')
    setDetailTab('information')
  }

  return <section className="pu-dex-screen pu-u2-dex" aria-label="Arkadex" data-ui-view={detailTab} data-splash-artwork={splash ? 'ready' : undefined}>
    <div className="pu-screen-toolbar">
      {showPlayerPicker && <label className="pu-player-picker">Giocatore dell’Arkadex
        <select value={viewPlayerId} onChange={(event) => {
          const id = Number(event.target.value) as 1 | 2
          setViewPlayerId(id); onPlayerChange?.(id)
          setAnimatedSpeciesId(null)
        }}><option value={1}>G1 · {state.giocatore1.nome || 'Giocatore 1'}</option><option value={2}>G2 · {state.giocatore2.nome || 'Giocatore 2'}</option></select>
      </label>}
      <p className="pu-discovery-count"><strong>{player.nome || `Giocatore ${viewPlayerId}`}</strong><span className="sr-only">{seenIds.length} / {POKEMON_BASE.length} viste · {caughtIds.length} / {POKEMON_BASE.length} ottenute</span>
        <span className="pu-dex-counter" aria-hidden="true">Visti <b>{seenIds.length}</b><small>/ {POKEMON_BASE.length}</small></span>
        <span className="pu-dex-counter" aria-hidden="true">Catturati <b>{caughtIds.length}</b><small>/ {POKEMON_BASE.length}</small></span></p>
    </div>
    <div className="pu-dex-layout">
      <KitPanel className="pu-dex-index">
        <div className="pu-filter-grid">
          <label>Ricerca<input aria-label="Cerca specie scoperta o numero" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setDetailTab('information') }} placeholder="Nome o numero" /></label>
          <label>Scoperta<select value={status} onChange={(event) => { setStatus(event.target.value as ArkadexFilter); setDetailTab('information') }}>
            <option value="all">Tutte</option><option value="unknown">Da scoprire</option><option value="seen">Viste, ancora da ottenere</option><option value="caught">Ottenute</option>
          </select></label>
          <label>Tipo<select aria-label="Tipo conosciuto" value={type} onChange={(event) => { setType(event.target.value as TipoPokemon | 'all'); setDetailTab('information') }}>
            <option value="all">Tutti i tipi</option>{TABELLA_TIPI.tipi.map((name) => <option key={name} value={name}>{name}</option>)}
          </select></label>
          <KitButton className="pu-filter-reset" disabled={!search && status === 'all' && type === 'all'} onClick={resetFilters}>Azzera filtri</KitButton>
        </div>
        <p role="status" className="pu-result-count">{entries.length} schede corrispondenti. Nome e tipo sono ricercabili soltanto dopo la scoperta.</p>
        <span ref={listAnchor} hidden />
        <SpatialNavigation className="pu-dex-list" aria-label="Specie dell’Arkadex">
          {entries.map((entry) => <KitButton data-rpg-item key={entry.id} active={selected?.id === entry.id} className="pu-dex-row"
            aria-pressed={selected?.id === entry.id} data-discovery-state={entry.status}
            aria-label={`Numero ${entry.id}: ${entry.species?.nome ?? 'specie da scoprire'} · ${statusLabels[entry.status]}`}
            onClick={() => { setSelectedId(entry.id); setSelectedInstanceId(null); setAnimatedSpeciesId(null); setDetailTab('information') }}>
            {entry.species ? <NearViewport eager={selected?.id === entry.id}><SpeciesPortrait speciesId={entry.id} /></NearViewport> : <span className="pu-dex-row-art"><span className="pu-unknown-portrait" aria-hidden="true">?</span></span>}
            <span className="pu-dex-row-copy"><span className="pu-dex-row-title">{entry.species && <TypeSeal type={entry.species.tipo} labelled={false} />}<strong>{entry.species?.nome ?? '???'}</strong></span><small><span className="pu-dex-row-number">#{String(entry.id).padStart(3, '0')}</span> · {statusLabels[entry.status]}</small></span>
            <DexRowMark entry={entry} />
          </KitButton>)}
          {!entries.length && <p className="pu-empty">Nessuna specie corrisponde ai filtri scelti.</p>}
        </SpatialNavigation>
      </KitPanel>

      <div className="pu-dex-hero pu-hero" data-splash-animation={splash && animated ? 'playing' : undefined}>
        {species ? <>
          <span className="pu-species-number">ARKA / {String(species.id).padStart(3, '0')}</span>
          {animated ? <div className="pu-species-animation"><Suspense fallback={<p>Caricamento animazione…</p>}><AnimatedArkamon speciesId={species.id} name={species.nome} side="front" animation="idle" /></Suspense></div>
            : splash ? <div className="pu-splash-hero-presence" role="img" aria-label={splash.label} data-splash-species={species.id} data-splash-source={splash.src} /> : <SpeciesPortrait speciesId={species.id} large />}
          <div className="pu-hero-caption"><span className="pu-dex-hero-number">N. {String(species.id).padStart(3, '0')}</span><span className="pu-kicker">{statusLabels[selected.status]}</span><h2>{species.nome}</h2><TypeBadge type={species.tipo} /></div>
          <div className="pu-dex-habitat" data-habitat-place={habitats[0]?.place}>
            {habitatImage && <span className="pu-dex-habitat-art" style={{ backgroundImage: `url("${habitatImage}")` }} aria-hidden="true" />}
            <span className="pu-dex-habitat-label">{habitats.length ? <>Habitat: <strong>{habitats[0].label}</strong>{habitats.length > 1 && <small> e altri {habitats.length - 1} {habitats.length === 2 ? 'luogo' : 'luoghi'}</small>}</> : <>Habitat: <strong>nessun cespuglio</strong></>}</span>
          </div>
          {canAnimate && <KitButton className="pu-animation-toggle" active={animated} aria-pressed={animated} onClick={() => setAnimatedSpeciesId(animated ? null : species.id)}>{animated ? 'Ferma animazione' : 'Mostra animazione'}</KitButton>}
        </> : <div className="pu-unknown-hero"><KitIcon id="icon-arkadex" /><span aria-hidden="true">?</span><h2>{selected ? 'Specie da scoprire' : 'Nessuna scheda'}</h2><p>{selected ? `Nº ${String(selected.id).padStart(3, '0')}` : 'Modifica la ricerca per consultare l’Arkadex.'}</p></div>}
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
          <nav className="pu-tabs pu-dex-detail-tabs" aria-label="Sezioni della scheda Arkadex">
            {([['information', 'Informazioni'], ['moves', 'Mosse'], ['evolution', 'Evoluzioni']] as const).map(([id, label]) => <KitButton key={id} active={detailTab === id} aria-pressed={detailTab === id} onClick={() => setDetailTab(id)}>{label}</KitButton>)}
          </nav>
          <div className="pu-dex-tab-content" data-arkadex-detail={detailTab}>
          {detailTab === 'information' && <>
            <dl className="pu-facts"><div><dt>Tipo</dt><dd><TypeBadge type={species.tipo} /></dd></div><div><dt>Categoria</dt><dd>{species.categoria}</dd></div><div><dt>HP massimi</dt><dd>{calcolaHPMax(pokemon)}</dd></div><div><dt>HP attuali</dt><dd>{specimen ? pokemon.hp : '—'}</dd></div><div><dt>Tasso cattura</dt><dd>{species.tassoCattura} / 5</dd></div><div><dt>Livello</dt><dd>{pokemon.livello}</dd></div></dl>
            {specimen && <p>Status: {pokemon.stato?.tipo ?? 'nessuno'}.</p>}
            {arkadexText && <p className="pu-dex-entry-text" data-arkadex-text>{arkadexText}</p>}
            <section className="pu-dex-habitats" aria-label={`Habitat di ${species.nome}`}>
              <h3>Habitat</h3>
              {habitats.length ? <ul>{habitats.map((habitat) => <li key={habitat.place}><span>{habitat.label}</span><small>{habitat.rarity}</small></li>)}</ul>
                : <p>Non si incontra nei cespugli: si ottiene in laboratorio o per evoluzione.</p>}
            </section>
          </>}
          {detailTab === 'moves' && <><h3>Mosse al livello {pokemon.livello}</h3><PokemonMoves pokemon={pokemon} /></>}
          {detailTab === 'evolution' && <><h3>Linea evolutiva</h3><div className="pu-evolution">{chain.map((entry, index) => {
            const known = seen.has(entry.id)
            return <div className={`pu-evolution-step ${entry.id === species.id ? 'is-current' : ''}${known ? '' : ' is-locked'}`} key={entry.id}>
              {index > 0 && <span className="pu-evolution-arrow" aria-hidden="true">›</span>}
              {/* Le forme non scoperte restano una sagoma con lucchetto: nessuna immagine viene richiesta. */}
              {known ? <SpeciesPortrait speciesId={entry.id} /> : <span className="pu-unknown-portrait pu-evolution-lock" aria-hidden="true" />}
              <strong>{known ? entry.nome : 'Da scoprire'}</strong><small>{index === 0 ? 'Base' : seen.has(chain[index - 1].id) ? `Lv. ${chain[index - 1].livelloEvoluzione ?? '—'}` : 'Da scoprire'}</small>
            </div>
          })}</div><p className="pu-note">{arkadexEvolutionLabel(species, progress, viewPlayerId)}</p></>}
          </div>
        </article>}
      </KitPanel>
    </div>
  </section>
}
