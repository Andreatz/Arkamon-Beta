import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import type { LocalMapDefinition, LocalMapNode, LocalMapPoint } from '@/data/localMaps'
import { getReachableLocalMapNodes, getLocalTravelPath } from '@/engine/localMapMovement'
import { assetUrl } from '@/utils/assetUrl'
import { GameArt, hasGameArt } from '@/ui-system/GameArt'
import './localMapBoard.css'
import { LOCAL_NODE_KIND_LABELS, LocalNodeGlyph, type LocalNodeKind } from './localNodeKinds'

export interface LocalMapPlayer {
  id: 1 | 2
  name: string
  nodeId: string
}

export interface LocalMapBoardProps {
  map: LocalMapDefinition
  players: LocalMapPlayer[]
  activePlayerId: 1 | 2
  remainingActions: number
  canMove: boolean
  inputBlocked?: boolean
  interactionLabels?: Record<string, string>
  /** Tipo dell'interazione configurata su ciascun pallino, per l'icona. */
  interactionKinds?: Record<string, LocalNodeKind>
  onMove: (nodeId: string) => boolean | void
  onSelectNode: (nodeId: string) => void
  /** Pallini per movimento: 2 con Bicicletta (percorsi) o Monopattino (città). */
  moveRange?: number
  /**
   * Fase U4: mappa a tutto schermo. La camera segue la pedina di turno; con `overview`
   * la mappa torna intera. Nodi in pietra, segnalini dipinti e pedine a figura intera.
   */
  stage?: boolean
  overview?: boolean
}

/** Ingrandimento della camera rispetto alla mappa che copre lo schermo. */
const STAGE_ZOOM = 1.3
/** Altezza a cui la camera tiene la pedina: un po' sopra il centro, lontano dall'HUD in basso. */
const STAGE_FOCUS_Y = 0.46
/** La camera può oltrepassare i bordi quanto l'HUD li copre, così i punti sul margine restano visibili. */
const STAGE_OVERSCROLL = { top: 0.1, bottom: 0.24, side: 0.04 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

interface BoardSize {
  width: number
  height: number
}

function pathString(points: LocalMapPoint[]): string {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
}

/** Distances use the displayed image dimensions, so bends keep the same walking speed. */
function pathTiming(points: LocalMapPoint[], size: BoardSize): { times: number[]; duration: number } {
  const distances = [0]
  for (let index = 1; index < points.length; index += 1) {
    const before = points[index - 1]
    const after = points[index]
    distances.push(distances[index - 1] + Math.hypot(
      (after.x - before.x) * size.width / 100,
      (after.y - before.y) * size.height / 100,
    ))
  }
  const total = distances[distances.length - 1]
  return {
    times: distances.map((distance, index) => total > 0 ? distance / total : index / (points.length - 1)),
    duration: Math.max(0.35, Math.min(0.65, total / 650)),
  }
}

function LocalMapAvatar({
  map,
  player,
  node,
  active,
  sameNode,
  size,
  stage = false,
}: {
  map: LocalMapDefinition
  player: LocalMapPlayer
  node: LocalMapNode
  active: boolean
  sameNode: boolean
  size: BoardSize
  stage?: boolean
}) {
  const controls = useAnimationControls()
  const hop = useAnimationControls()
  const pawn = stage && hasGameArt(`pawn-player-${player.id}-idle`)
  const [jumping, setJumping] = useState(false)
  const [landings, setLandings] = useState(0)
  const { reducedMotion, speed } = useGameMotionPreferences()
  const previousNode = useRef(node.id)
  const mounted = useRef(false)
  const animationRunning = useRef(false)
  const animationVersion = useRef(0)
  const queuedJourneys = useRef<Array<{ points: LocalMapPoint[]; size: BoardSize }>>([])
  const avatarSize = Math.max(22, Math.min(56, size.width * 0.045))
  // Pedina a figura intera: l'altezza segue la mappa, la larghezza le proporzioni del disegno.
  const pawnHeight = clamp(size.width * 0.05, 60, 180)
  const pawnWidth = pawnHeight * 0.7
  const footprint = pawn ? pawnWidth : avatarSize
  const offset = sameNode ? (player.id === 1 ? -footprint * 0.34 : footprint * 0.34) : 0
  const fittedOffset = Math.max(
    footprint / 2 - node.x * size.width / 100,
    Math.min(offset, size.width - node.x * size.width / 100 - footprint / 2),
  )
  // Sul palco la mappa è più grande della vista: la pedina può sporgere sopra il bordo.
  const topInset = (point: LocalMapPoint, plane: BoardSize) => stage ? 0
    : Math.max(0, Math.max(22, Math.min(56, plane.width * 0.045)) - point.y * plane.height / 100 + 2)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      animationVersion.current += 1
      queuedJourneys.current = []
      controls.stop()
      hop.stop()
    }
  }, [controls, hop])

  useEffect(() => {
    const points = getLocalTravelPath(map, previousNode.current, node.id, 2)
    previousNode.current = node.id
    if (!points.length || reducedMotion) {
      animationVersion.current += 1
      animationRunning.current = false
      queuedJourneys.current = []
      controls.stop()
      hop.stop()
      hop.set({ y: 0, scaleX: 1, scaleY: 1 })
      setJumping(false)
      controls.set({ left: `${node.x}%`, top: `${node.y}%`, marginTop: topInset(node, size) })
      return
    }

    queuedJourneys.current.push({ points, size })
    if (animationRunning.current) return
    animationRunning.current = true
    const version = animationVersion.current
    const followRoads = async () => {
      // Fast consecutive moves queue complete roads. The sprite never cuts
      // diagonally to catch up or jumps to the start of the second movement.
      while (mounted.current && version === animationVersion.current && queuedJourneys.current.length) {
        const journey = queuedJourneys.current.shift()!
        const timing = pathTiming(journey.points, journey.size)
        // Un salto per ogni pallino attraversato; le curve della strada non contano come salti.
        const hops = pawn ? Math.max(1, journey.points.slice(1).filter((point) => map.nodes.some((item) => item.x === point.x && item.y === point.y)).length) : 0
        const duration = (pawn ? Math.max(timing.duration, 0.42 * hops) : timing.duration) / speed
        if (pawn) {
          setJumping(true)
          const lift = clamp(journey.size.width * 0.018, 14, 46)
          const y = [0, ...Array.from({ length: hops }, () => [-lift, 0]).flat()]
          void hop.start({ y, scaleX: 1, scaleY: 1, transition: { duration, ease: 'easeInOut', times: y.map((_, index) => index / (y.length - 1)) } })
        }
        await controls.start({
          left: journey.points.map((point) => `${point.x}%`),
          top: journey.points.map((point) => `${point.y}%`),
          marginTop: journey.points.map((point) => topInset(point, journey.size)),
          transition: { ease: 'linear', times: timing.times, duration },
        })
        if (pawn && mounted.current && version === animationVersion.current) {
          setJumping(false)
          setLandings((count) => count + 1)
          await hop.start({ y: 0, scaleX: [1.14, 0.96, 1], scaleY: [0.8, 1.05, 1], transition: { duration: 0.26 / speed, ease: 'easeOut' } })
        }
      }
      if (version === animationVersion.current) animationRunning.current = false
    }
    void followRoads()
    // Resizing changes the image plane itself; it must not restart a journey.
  }, [controls, hop, map, node.id, reducedMotion, speed, pawn])

  useEffect(() => {
    if (!animationRunning.current) controls.set({ marginTop: topInset(node, size) })
  }, [controls, size.height, size.width, node.y])

  return (
    <motion.div
      data-local-map-player={player.id}
      data-node-id={node.id}
      className={`local-map-avatar ${active ? 'local-map-avatar--active' : ''}${pawn ? ' local-map-avatar--pawn' : ''}`}
      initial={{ left: `${node.x}%`, top: `${node.y}%`, marginTop: topInset(node, size) }}
      animate={controls}
      style={pawn ? { width: pawnWidth, height: pawnHeight, marginLeft: fittedOffset } : { width: avatarSize, height: avatarSize, marginLeft: fittedOffset }}
      aria-label={`${player.name}, giocatore ${player.id}, ${node.label ?? node.id}${active ? ', turno attivo' : ''}`}
      role="img"
      data-jumping={pawn && jumping ? 'true' : undefined}
    >
      {pawn ? <>
        <span className="local-map-pawn-shadow" aria-hidden="true" />
        {landings > 0 && <span key={landings} className="local-map-pawn-dust" aria-hidden="true" />}
        <motion.span className="local-map-pawn-body" animate={hop} initial={{ y: 0, scaleX: 1, scaleY: 1 }}>
          <GameArt id={`pawn-player-${player.id}-${jumping && hasGameArt(`pawn-player-${player.id}-jump`) ? 'jump' : 'idle'}`} className="local-map-pawn-art" />
        </motion.span>
        {active && <span className="local-map-pawn-cue" aria-hidden="true" />}
        <span className={`local-map-avatar-label local-map-avatar-label--${player.id}`}>G{player.id}</span>
      </> : <>
        <img src={assetUrl(`/ui/player${player.id}_avatar.png`)} alt="" draggable={false} />
        <span className={`local-map-avatar-label local-map-avatar-label--${player.id}`}>G{player.id}</span>
      </>}
    </motion.div>
  )
}

/**
 * The PNG remains intact. Buttons sit on its dots, including explicit new markers; the road graph is
 * used for adjacency and for walking around bends rather than across buildings.
 * Only players present in this location are passed by the containing scene.
 */
export function LocalMapBoard({
  map,
  players,
  activePlayerId,
  remainingActions,
  canMove,
  inputBlocked = false,
  interactionLabels = {},
  interactionKinds = {},
  onMove,
  onSelectNode,
  moveRange = 1,
  stage = false,
  overview = false,
}: LocalMapBoardProps) {
  const root = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<BoardSize>({ width: 0, height: 0 })
  const [imageRatio, setImageRatio] = useState(1619 / 971)
  const [previewNode, setPreviewNode] = useState<string | null>(null)
  const instructionsId = useId()
  const activePlayer = players.find((player) => player.id === activePlayerId)
  const currentNode = activePlayer?.nodeId
  const neighbours = currentNode ? getReachableLocalMapNodes(map, currentNode, moveRange) : []

  useEffect(() => {
    const element = root.current
    if (!element) return
    const update = () => {
      const rectangle = element.getBoundingClientRect()
      setBounds({ width: rectangle.width, height: rectangle.height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Camera: a ogni spostamento del giocatore di turno la mappa si avvicina al punto
  // d'arrivo per la durata del cammino e torna larga (mai in moto a riposo).
  const [cameraShot, setCameraShot] = useState<{ seq: number; x: number; y: number } | null>(null)
  const lastNode = useRef({ player: activePlayerId, node: currentNode })
  useEffect(() => {
    const previous = lastNode.current
    lastNode.current = { player: activePlayerId, node: currentNode }
    if (previous.player !== activePlayerId || !previous.node || previous.node === currentNode || !currentNode) return
    const destination = map.nodes.find(node => node.id === currentNode)
    if (destination) setCameraShot(shot => ({ seq: (shot?.seq ?? 0) + 1, x: destination.x, y: destination.y }))
  }, [activePlayerId, currentNode, map.nodes])

  const containWidth = Math.min(bounds.width, bounds.height * imageRatio)
  const coverWidth = Math.max(bounds.width, bounds.height * imageRatio)
  const width = stage && !overview ? coverWidth * STAGE_ZOOM : containWidth
  const size = { width, height: width / imageRatio }
  // Camera del palco: tiene la pedina di turno al centro, senza mai mostrare oltre i bordi della mappa.
  const focus = map.nodes.find((node) => node.id === (currentNode ?? players[0]?.nodeId))
  // In verticale (telefono) l'HUD in basso è più alto: la pedina sale e la camera scende di più.
  const portrait = bounds.height > bounds.width
  const focusY = portrait ? 0.32 : STAGE_FOCUS_Y
  const overscrollBottom = portrait ? 0.3 : STAGE_OVERSCROLL.bottom
  const side = bounds.width * STAGE_OVERSCROLL.side
  const cameraX = size.width <= bounds.width ? (bounds.width - size.width) / 2
    : clamp(bounds.width / 2 - (focus?.x ?? 50) * size.width / 100, bounds.width - size.width - side, side)
  const cameraY = size.height <= bounds.height ? (bounds.height - size.height) / 2
    : clamp(bounds.height * focusY - (focus?.y ?? 50) * size.height / 100,
      bounds.height - size.height - bounds.height * overscrollBottom, bounds.height * STAGE_OVERSCROLL.top)
  const canChooseCurrent = !inputBlocked
  const movementEnabled = canMove && !inputBlocked

  return (
    <div ref={root} className={`local-map-board${stage ? ' local-map-board--stage' : ''}`} data-local-map-root={map.id} data-camera={stage ? (overview ? 'overview' : 'follow') : undefined}>
      {/* Le bande ai lati diventano la stessa illustrazione, sfocata e scurita. */}
      <div className="local-map-ambient" style={{ backgroundImage: `url("${assetUrl(map.image)}")` }} aria-hidden="true" />
      <p id={instructionsId} className="sr-only">
        Scegli un pallino vicino evidenziato per muoverti lungo la strada.
        Seleziona il pallino su cui ti trovi per vedere il punto d’interazione.
        Usa Tab per scegliere un punto ed Invio per confermare. Azioni rimanenti: {remainingActions}.
      </p>
      <div
        className="local-map-plane"
        style={stage
          ? { width: size.width || '100%', height: size.height || '100%', transform: `translate3d(${Math.round(cameraX)}px, ${Math.round(cameraY)}px, 0)` }
          : { width: size.width || '100%', height: size.height || '100%', '--cam-x': `${cameraShot?.x ?? 50}%`, '--cam-y': `${cameraShot?.y ?? 50}%` } as CSSProperties}
        data-camera-shot={!stage && cameraShot ? (cameraShot.seq % 2 ? 'a' : 'b') : undefined}
        role="group"
        aria-label={`Mappa di ${map.id.replace(/_/g, ' ')}`}
        aria-describedby={instructionsId}
      >
        <img
          className="local-map-image"
          src={assetUrl(map.image)}
          alt={`Strade e punti di ${map.id.replace(/_/g, ' ')}`}
          onLoad={(event) => {
            const image = event.currentTarget
            if (image.naturalWidth && image.naturalHeight) setImageRatio(image.naturalWidth / image.naturalHeight)
          }}
          draggable={false}
        />
        <svg
          className="local-map-road-hints"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {movementEnabled && currentNode && neighbours.map((nextNode) => {
            const points = getLocalTravelPath(map, currentNode, nextNode, moveRange)
            return points.length ? (
              <path
                key={nextNode}
                d={pathString(points)}
                fill="none"
                data-local-road-preview={previewNode === nextNode ? nextNode : undefined}
                stroke={previewNode === nextNode ? 'var(--arka-primary)' : 'rgba(255,225,116,0.65)'}
                strokeWidth={previewNode === nextNode ? '5' : '2.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null
          })}
        </svg>
        {map.nodes.map((node, index) => {
          const isCurrent = node.id === currentNode
          const isReachable = movementEnabled && neighbours.includes(node.id)
          const enabled = isCurrent ? canChooseCurrent : isReachable
          const label = node.label ?? `Punto ${index + 1}`
          const kind = interactionKinds[node.id]
          return (
            <button
              key={node.id}
              type="button"
              data-local-map-node={node.id}
              data-reachable={isReachable ? 'true' : 'false'}
              data-node-kind={kind}
              className={`local-map-node${isCurrent ? ' local-map-node--current' : ''}${isReachable ? ' local-map-node--reachable' : ''}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              disabled={!enabled}
              aria-current={isCurrent ? 'location' : undefined}
              aria-label={`${label}${isCurrent ? ', posizione attuale; mostra interazione' : isReachable ? ', muoviti qui' : ', non adiacente'}`}
              title={isCurrent ? `${label} · ${interactionLabels[node.id] ?? 'interazione da definire'}` : isReachable ? `Vai a ${label}` : label}
              onMouseEnter={() => setPreviewNode(isReachable ? node.id : null)}
              onMouseLeave={() => setPreviewNode(null)}
              onFocus={() => setPreviewNode(isReachable ? node.id : null)}
              onBlur={() => setPreviewNode(null)}
              onClick={() => {
                if (!enabled) return
                if (isCurrent) onSelectNode(node.id)
                else onMove(node.id)
              }}
            >
              {stage && <span className="local-map-node-stone" aria-hidden="true" />}
              {!stage && node.drawMarker && <span className="local-map-node-marker" aria-hidden="true" />}
              <span className="local-map-node-ring" aria-hidden="true" />
              {kind && (stage && hasGameArt(`node-${kind}`)
                ? <span className="local-map-node-medal" data-kind={kind} aria-hidden="true"><GameArt id={`node-${kind}`} /></span>
                : <span className="local-map-node-kind" data-kind={kind} title={LOCAL_NODE_KIND_LABELS[kind]} aria-hidden="true"><LocalNodeGlyph kind={kind} /></span>)}
            </button>
          )
        })}
        {!stage && previewNode && movementEnabled && neighbours.includes(previewNode) && <span className="local-map-move-preview" role="status">Movimento · 1 azione</span>}
        {players.map((player) => {
          const node = map.nodes.find((item) => item.id === player.nodeId)
          if (!node) return null
          const sameNode = players.some((other) => other.id !== player.id && other.nodeId === player.nodeId)
          return (
            <LocalMapAvatar
              key={`${map.id}-${player.id}`}
              map={map}
              player={player}
              node={node}
              active={player.id === activePlayerId}
              sameNode={sameNode}
              size={size}
              stage={stage}
            />
          )
        })}
      </div>
      {stage && previewNode && movementEnabled && neighbours.includes(previewNode) && <span className="local-map-move-preview" role="status">Movimento · 1 azione</span>}
    </div>
  )
}
