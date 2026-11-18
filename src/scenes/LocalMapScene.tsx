import { GameButton } from '@/components/ui/GameButton'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { LocalMapBoard, type LocalMapPlayer } from '@/components/map/LocalMapBoard'
import { getLocalMap, type LocalMapDefinition } from '@/data/localMaps'
import { SECRET_LOCATION_ID, SECRET_LOCATION_ORIGIN, canAccessSecretLocation, hasUnlockedSecretLocation } from '@/data/secretLocation'
import { getReachableLocalMapNodes, getLocalMapNode } from '@/engine/localMapMovement'
import { localMoveRange } from '@/shop/catalog'
import { useGameStore } from '@/store/gameStore'
import { useSceneInputBlocked } from '@/components/transitions/SceneNavigationContext'
import { makeDialogBackgroundInert } from '@/components/battle/modalFocus'
import { useInteractionStore } from '@/interactions/interactionStore'
import { ConfiguredInteractionPanel } from '@/interactions/ConfiguredInteractionPanel'
import { TurnSummary } from '@/journal/TurnSummary'
import { useAdminStore } from '@/store/adminStore'
import './localMapScene.css'
import { isReferenceUi } from '@/player-ui/reference/referenceTheme'
import { CreaturePortrait, HealthBar, KitIcon } from '@/player-ui/kit'
import { assetUrl } from '@/utils/assetUrl'
import { openPlayerUi } from '@/player-ui/navigation'
import './referenceLocalMap.css'
import './stageLocalMap.css'
import { LOCAL_NODE_KIND_LABELS, nodeKinds, type LocalNodeKind } from '@/components/map/localNodeKinds'
import { GameArt, hasGameArt } from '@/ui-system/GameArt'
import { ALLENATORI } from '@/data'

const gymLeaders = new Set(ALLENATORI.filter(trainer => trainer.tipo === 'Capopalestra').map(trainer => trainer.id))
const isGymLeader = (trainerId: number) => gymLeaders.has(trainerId)

/** Testo della scheda del punto quando l'interazione non ha una battuta propria. */
const KIND_LINES: Record<LocalNodeKind, string> = {
  gym: 'La Capopalestra ti aspetta.', trainer: 'Un allenatore cerca una sfida.', grass: 'Un incontro ti attende.',
  encounter: 'Qualcosa si muove qui vicino.', heal: 'Un posto dove far riposare la squadra.', shop: 'L’Arkastore è aperto.',
  dialogue: 'Qualcuno ha qualcosa da dirti.',
}

/** Ritratto del giocatore (lotto 1), con l'avatar come riserva. */
function PlayerFace({ playerId }: { playerId: 1 | 2 }) {
  const id = `portrait-player-${playerId}`
  return hasGameArt(id) ? <GameArt id={id} className="ref-local-face" /> : <img className="ref-local-face" src={assetUrl(`/ui/player${playerId}_avatar.png`)} alt="" />
}

function ActivityDialog({ open, onClose, children, title = 'Attività del luogo' }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open || !dialog.current) return
    const element = dialog.current
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const release = makeDialogBackgroundInert(element)
    close.current?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const controls = Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter((control) => control.getClientRects().length)
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    element.addEventListener('keydown', keyboard)
    return () => { element.removeEventListener('keydown', keyboard); release(); before?.focus() }
  }, [open, onClose])
  return <div ref={dialog} hidden={!open} role="dialog" aria-modal="true" aria-label={title} className="local-map-activities">
    <header><div><h2>{title}</h2><p>Un’interazione conclude il turno.</p></div><GameButton ref={close} onClick={onClose}>Chiudi attività</GameButton></header>
    <div className="local-map-activities-content">{children}</div>
  </div>
}

/** Le azioni sono condivise con la mappa principale; cambiare vista non spende un'azione. */
export function LocalMapScene({ map, activities }: { map: LocalMapDefinition; activities: ReactNode }) {
  const actor = useGameStore((s) => s.giocatoreAttivo)
  const turn = useGameStore((s) => s.turnoOverworld)
  const world1 = useGameStore((s) => s.posizione1)
  const world2 = useGameStore((s) => s.posizione2)
  const positions1 = useGameStore((s) => s.posizioniLocali1)
  const positions2 = useGameStore((s) => s.posizioniLocali2)
  const player1 = useGameStore((s) => s.giocatore1)
  const player2 = useGameStore((s) => s.giocatore2)
  const battle = useGameStore((s) => s.battaglia)
  const definitions = useInteractionStore((s) => s.interactions)
  const initialize = useGameStore((s) => s.inizializzaPosizioneLocale)
  const move = useGameStore((s) => s.muoviAvatarMappaLocale)
  const pass = useGameStore((s) => s.passaTurnoMappaLocale)
  const navigate = useGameStore((s) => s.vaiAScena)
  const crossSecretPassage = useGameStore((s) => s.attraversaPassaggioSegreto)
  const blocked = useSceneInputBlocked()
  const [activitiesOpen, setActivitiesOpen] = useState(false)
  const closeActivities = useCallback(() => setActivitiesOpen(false), [])
  useEffect(() => {
    const openGmActivities = () => { if (useAdminStore.getState().enabled && !blocked) setActivitiesOpen(true) }
    window.addEventListener('arkamon:gm-activities', openGmActivities)
    return () => window.removeEventListener('arkamon:gm-activities', openGmActivities)
  }, [blocked])
  const [selected, setSelected] = useState<string | null>(null)
  // Fase U4: la camera segue la pedina; «Mappa intera» mostra tutto il luogo.
  const stage = isReferenceUi()
  const [overview, setOverview] = useState(false)
  const [interactionOpen, setInteractionOpen] = useState(false)
  const closeInteraction = useCallback(() => setInteractionOpen(false), [])
  const samePlace = (world: typeof world1) => world.mappaId === 'mappa-principale' && world.luogo === map.id
  const allowedPlayer = (world: typeof world1, player: typeof player1) => samePlace(world)
    && (map.id !== SECRET_LOCATION_ID || canAccessSecretLocation(player, world))

  useEffect(() => {
    if (allowedPlayer(world1, player1)) initialize(1, map.id)
    if (allowedPlayer(world2, player2)) initialize(2, map.id)
    setSelected(null)
    setActivitiesOpen(false)
    setInteractionOpen(false)
  }, [map.id, world1.luogo, world1.mappaId, world2.luogo, world2.mappaId, initialize, actor])

  const players: LocalMapPlayer[] = []
  if (allowedPlayer(world1, player1)) players.push({ id: 1, name: player1.nome, nodeId: getLocalMapNode(map, positions1[map.id]).id })
  if (allowedPlayer(world2, player2)) players.push({ id: 2, name: player2.nome, nodeId: getLocalMapNode(map, positions2[map.id]).id })
  const current = players.find((p) => p.id === actor)
  const remaining = turn.giocatoreAttivo === actor ? turn.azioniRimaste : 0
  const canMove = !!current && remaining > 0 && !blocked && !battle
  const moveRange = localMoveRange((actor === 1 ? player1 : player2).inventario, map.id)
  const adjacent = current ? getReachableLocalMapNodes(map, current.nodeId, moveRange) : []
  const currentNode = current ? getLocalMapNode(map, current.nodeId) : null
  const pointInteractions = definitions.filter((entry) => entry.enabled && entry.mapId === map.id && entry.nodeId === currentNode?.id)
  const interactionLabels = Object.fromEntries(definitions.filter((entry) => entry.enabled && entry.mapId === map.id).map((entry) => [entry.nodeId, entry.title]))
  const interactionKinds = nodeKinds(definitions.filter((entry) => entry.enabled && entry.mapId === map.id), isGymLeader)
  const nodeLabel = (id: string) => getLocalMapNode(map, id).label ?? id
  const placeName = map.id.replace(/_/g, ' ')
  const currentKind = currentNode ? interactionKinds[currentNode.id] : undefined
  const player = actor === 1 ? player1 : player2
  const actorWorld = actor === 1 ? world1 : world2
  const secret = map.id === SECRET_LOCATION_ID
  const secretAccess = canAccessSecretLocation(player, actorWorld)
  const secretPassageVisible = map.id === SECRET_LOCATION_ORIGIN && !!current && hasUnlockedSecretLocation(player)
  const moveTo = (id: string) => {
    if (!canMove) return false
    const moved = move(actor, map.id, id)
    if (moved) setSelected(null)
    return moved
  }
  const passTurn = () => {
    if (blocked) return
    useGameStore.getState().eseguiTransazione(read => {
      if (!pass()) return
      const state = read()
      const world = state.giocatoreAttivo === 1 ? state.posizione1 : state.posizione2
      const target = world.mappaId === 'mappa-principale' ? getLocalMap(world.luogo ?? '') : undefined
      if (target && state.apriMappaLocale(state.giocatoreAttivo, target.id)) {
        navigate(target.id.startsWith('Percorso_') ? 'percorso' : 'citta', { luogo: target.id })
      } else navigate('mappa-principale')
    })
  }

  if (secret && !secretAccess) return <section className="local-map-scene" aria-label="Luogo non disponibile">
    <p>Questo luogo non è disponibile per il giocatore attivo.</p>
    <GameButton onClick={() => navigate('mappa-principale')}>Mappa principale</GameButton>
  </section>

  const passage = (secretPassageVisible || secret) && <GameButton
    disabled={!canMove || activitiesOpen || interactionOpen} onClick={() => { if (!blocked) crossSecretPassage(actor) }}>
    {secret ? 'Torna a Roma' : 'Passaggio segreto'} · 1 movimento
  </GameButton>
  const budget = <span className="local-map-budget" role="status">{remaining} {remaining === 1 ? 'azione' : 'azioni'}</span>
  const pointInfo = <div className="local-map-point-info" role="status">
    {currentNode ? <><strong>{pointInteractions[0]?.title ?? nodeLabel(selected ?? currentNode.id)}</strong><span>{pointInteractions.length
      ? (stage ? pointInteractions[0]?.dialogue?.trim() || (currentKind ? KIND_LINES[currentKind] : `${pointInteractions.length} interazioni disponibili sul punto`) : `${pointInteractions.length} interazioni disponibili sul punto`)
      : 'Nessuna interazione configurata sul punto'}</span></> : <span>Questo giocatore si trova in un altro luogo.</span>}
  </div>
  const neighbours = <nav aria-label="Punti raggiungibili" className="local-map-neighbours">
    {adjacent.map((id) => <GameButton key={id} disabled={!canMove} onClick={() => moveTo(id)}>Vai a {nodeLabel(id)} · 1 azione</GameButton>)}
  </nav>
  const interact = pointInteractions.length > 0 && <GameButton tone={stage ? 'primary' : undefined} disabled={blocked} onClick={() => setInteractionOpen(true)}>Interagisci sul punto</GameButton>
  const squad = isReferenceUi() && <div className="ref-local-squad" aria-label={`Squadra di ${player.nome}`}>{player.squadra.map(pokemon=><button type="button" key={pokemon.istanzaId} onClick={()=>openPlayerUi('squadra',{playerId:actor,instanceId:pokemon.istanzaId})} aria-label={`Apri squadra: ${pokemon.nome}`}><CreaturePortrait pokemon={pokemon}/><strong>{pokemon.nome}</strong><span>Lv. {pokemon.livello}</span><HealthBar pokemon={pokemon}/></button>)}</div>
  const menu = isReferenceUi() && <button type="button" className="ref-local-menu" aria-label="Partita" onClick={()=>openPlayerUi('partita',{playerId:actor})}><KitIcon id="icon-home"/>Partita</button>

  return <section className={`local-map-scene${stage ? ' local-map-scene--stage' : ''}`} data-reference-ui={isReferenceUi() ? 'aurora' : undefined} aria-label={`Esplorazione ${placeName}`}>
    {stage ? <header className="local-map-toolbar">
      <div className="ref-local-place">
        <span className="ref-local-place-emblem" aria-hidden="true">{hasGameArt('menu-map') ? <GameArt id="menu-map" /> : <KitIcon id="icon-map" />}</span>
        <div className="local-map-heading"><h1>{placeName}</h1><span>{map.id.startsWith('Percorso_') ? 'Percorso' : 'Città'} · G{actor} · {player.nome}</span></div>
        <TurnSummary compact />
      </div>
      <GameButton className="ref-local-back" disabled={blocked} onClick={() => navigate('mappa-principale')}>{secret ? '← Passaggio di ritorno' : '← Mappa principale'}</GameButton>
      <div className="ref-local-turn">
        <PlayerFace playerId={actor} />
        <p className="ref-local-turn-title">Turno di <strong>{player.nome || `Giocatore ${actor}`}</strong></p>
        {budget}
      </div>
      <div className="ref-local-players" aria-label="Giocatori">{[player1,player2].map(owner=><span key={owner.id} data-active={owner.id===actor}><PlayerFace playerId={owner.id} /><span>{owner.nome || `Giocatore ${owner.id}`} · G{owner.id}<small>{owner.id===actor?'Turno attuale':'In attesa'}</small></span></span>)}</div>
      {passage}
      <GameButton tone="primary" disabled={blocked} onClick={passTurn}>Passa turno</GameButton>
    </header> : <header className="local-map-toolbar">
      <GameButton disabled={blocked} onClick={() => navigate('mappa-principale')}>{secret ? '← Passaggio di ritorno' : '← Mappa principale'}</GameButton>
      <div className="local-map-heading"><h1>{placeName}</h1><span>G{actor} · {player.nome}</span></div>
      {budget}
      {passage}
      <GameButton tone="primary" disabled={blocked} onClick={passTurn}>Passa turno</GameButton>
    </header>}
    <div className="local-map-play-area">
      <LocalMapBoard map={map} players={players} activePlayerId={actor} remainingActions={remaining} canMove={canMove} stage={stage} overview={overview}
        inputBlocked={blocked || activitiesOpen || interactionOpen} interactionLabels={interactionLabels} interactionKinds={interactionKinds} moveRange={moveRange} onMove={moveTo} onSelectNode={(id) => {
          setSelected(id)
          if (definitions.some((entry) => entry.enabled && entry.mapId === map.id && entry.nodeId === id)) setInteractionOpen(true)
        }} />
    </div>
    {stage ? <footer className="local-map-footer">
      {squad}
      <div className="ref-local-card" data-kind={currentKind}>
        <div className="ref-local-card-head">
          <span className="ref-local-card-medal" aria-hidden="true">{currentKind && hasGameArt(`node-${currentKind}`) ? <GameArt id={`node-${currentKind}`} /> : hasGameArt('menu-map') ? <GameArt id="menu-map" className="ref-local-card-place" /> : <KitIcon id="icon-map" />}</span>
          {pointInfo}
          {currentKind && <span className="sr-only">Tipo del punto: {LOCAL_NODE_KIND_LABELS[currentKind]}</span>}
        </div>
        {interact}
        {neighbours}
        <div className="ref-local-card-tools">
          <GameButton aria-pressed={overview} onClick={() => setOverview((value) => !value)}>{overview ? 'Segui la pedina' : 'Mappa intera'}</GameButton>
          {menu}
        </div>
      </div>
      <p className="sr-only">{remaining > 0 ? 'Due movimenti, oppure un movimento e un’interazione.' : 'Turno concluso. Passa il controllo all’altro giocatore.'}</p>
    </footer> : <footer className="local-map-footer">
      {pointInfo}
      {neighbours}
      {interact}
      <p>{remaining > 0 ? 'Due movimenti, oppure un movimento e un’interazione.' : 'Turno concluso. Passa il controllo all’altro giocatore.'}</p>
      <TurnSummary />
    </footer>}
    <ActivityDialog open={activitiesOpen} onClose={closeActivities} title="Scorciatoie del Game Master">{activities}</ActivityDialog>
    {currentNode && <ActivityDialog open={interactionOpen} onClose={closeInteraction} title="Interazioni del punto">
      <ConfiguredInteractionPanel mapId={map.id} nodeId={currentNode.id} inputBlocked={blocked} onShopOpened={closeInteraction} />
    </ActivityDialog>}
  </section>
}
