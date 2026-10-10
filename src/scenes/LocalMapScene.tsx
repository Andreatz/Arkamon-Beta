import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { LocalMapBoard, type LocalMapPlayer } from '@/components/map/LocalMapBoard'
import { getLocalMap, type LocalMapDefinition } from '@/data/localMaps'
import { SECRET_LOCATION_ID, SECRET_LOCATION_ORIGIN, canAccessSecretLocation, hasUnlockedSecretLocation } from '@/data/secretLocation'
import { getAdjacentLocalMapNodes, getLocalMapNode } from '@/engine/localMapMovement'
import { useGameStore } from '@/store/gameStore'
import { useSceneInputBlocked } from '@/components/transitions/SceneNavigationContext'
import { makeDialogBackgroundInert } from '@/components/battle/modalFocus'
import { useInteractionStore } from '@/interactions/interactionStore'
import { ConfiguredInteractionPanel } from '@/interactions/ConfiguredInteractionPanel'
import { TurnSummary } from '@/journal/TurnSummary'
import './localMapScene.css'

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
      const controls = Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]'))
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    element.addEventListener('keydown', keyboard)
    return () => { element.removeEventListener('keydown', keyboard); release(); before?.focus() }
  }, [open, onClose])
  return <div ref={dialog} hidden={!open} role="dialog" aria-modal="true" aria-label={title} className="local-map-activities">
    <header><div><h2>{title}</h2><p>Un’interazione conclude il turno.</p></div><button ref={close} className="arka-button-secondary" onClick={onClose}>Chiudi attività</button></header>
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
  const [selected, setSelected] = useState<string | null>(null)
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
  const adjacent = current ? getAdjacentLocalMapNodes(map, current.nodeId) : []
  const currentNode = current ? getLocalMapNode(map, current.nodeId) : null
  const pointInteractions = definitions.filter((entry) => entry.enabled && entry.mapId === map.id && entry.nodeId === currentNode?.id)
  const interactionLabels = Object.fromEntries(definitions.filter((entry) => entry.enabled && entry.mapId === map.id).map((entry) => [entry.nodeId, entry.title]))
  const nodeLabel = (id: string) => getLocalMapNode(map, id).label ?? id
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
    if (blocked || !pass()) return
    const state = useGameStore.getState()
    const world = state.giocatoreAttivo === 1 ? state.posizione1 : state.posizione2
    const target = world.mappaId === 'mappa-principale' ? getLocalMap(world.luogo ?? '') : undefined
    if (target && state.apriMappaLocale(state.giocatoreAttivo, target.id)) {
      navigate(target.id.startsWith('Percorso_') ? 'percorso' : 'citta', { luogo: target.id })
    } else navigate('mappa-principale')
  }

  if (secret && !secretAccess) return <section className="local-map-scene" aria-label="Luogo non disponibile">
    <p>Questo luogo non è disponibile per il giocatore attivo.</p>
    <button className="arka-button-secondary" onClick={() => navigate('mappa-principale')}>Mappa principale</button>
  </section>

  return <section className="local-map-scene" aria-label={`Esplorazione ${map.id.replace(/_/g, ' ')}`}>
    <header className="local-map-toolbar">
      <button className="arka-button-secondary" disabled={blocked} onClick={() => navigate('mappa-principale')}>{secret ? '← Passaggio di ritorno' : '← Mappa principale'}</button>
      <div className="local-map-heading"><h1>{map.id.replace(/_/g, ' ')}</h1><span>G{actor} · {player.nome}</span></div>
      <span className="local-map-budget" role="status">{remaining} {remaining === 1 ? 'azione' : 'azioni'}</span>
      <button className="arka-button-secondary" disabled={blocked} onClick={() => setActivitiesOpen(true)}>Attività</button>
      {(secretPassageVisible || secret) && <button className="arka-button-secondary"
        disabled={!canMove || activitiesOpen || interactionOpen} onClick={() => { if (!blocked) crossSecretPassage(actor) }}>
        {secret ? 'Torna a Roma' : 'Passaggio segreto'} · 1 movimento
      </button>}
      <button className="arka-button" disabled={blocked} onClick={passTurn}>Passa turno</button>
    </header>
    <div className="local-map-play-area">
      <LocalMapBoard map={map} players={players} activePlayerId={actor} remainingActions={remaining} canMove={canMove}
        inputBlocked={blocked || activitiesOpen || interactionOpen} interactionLabels={interactionLabels} onMove={moveTo} onSelectNode={(id) => {
          setSelected(id)
          if (definitions.some((entry) => entry.enabled && entry.mapId === map.id && entry.nodeId === id)) setInteractionOpen(true)
        }} />
    </div>
    <footer className="local-map-footer">
      <div className="local-map-point-info" role="status">
        {currentNode ? <><strong>{pointInteractions[0]?.title ?? nodeLabel(selected ?? currentNode.id)}</strong><span>{pointInteractions.length ? `${pointInteractions.length} interazioni disponibili sul punto` : 'Interazione da definire'}</span></> : <span>Questo giocatore si trova in un altro luogo.</span>}
      </div>
      <nav aria-label="Punti raggiungibili" className="local-map-neighbours">
        {adjacent.map((id) => <button key={id} className="arka-button-secondary" disabled={!canMove} onClick={() => moveTo(id)}>Vai a {nodeLabel(id)}</button>)}
      </nav>
      {pointInteractions.length > 0 && <button className="arka-button-secondary" disabled={blocked} onClick={() => setInteractionOpen(true)}>Interagisci sul punto</button>}
      <p>{remaining > 0 ? 'Due movimenti, oppure un movimento e un’interazione.' : 'Turno concluso. Passa il controllo all’altro giocatore.'}</p>
      <TurnSummary />
    </footer>
    <ActivityDialog open={activitiesOpen} onClose={closeActivities}>{activities}</ActivityDialog>
    {currentNode && <ActivityDialog open={interactionOpen} onClose={closeInteraction} title="Interazioni del punto">
      <ConfiguredInteractionPanel mapId={map.id} nodeId={currentNode.id} inputBlocked={blocked} />
    </ActivityDialog>}
  </section>
}
