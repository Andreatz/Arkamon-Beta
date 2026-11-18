import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { assetUrl } from '@/utils/assetUrl'
import { GameArt, hasGameArt } from '@/ui-system/GameArt'
import type { AdminMapRoadPoint } from '@/theme/adminThemeTypes'
import { getMainMapJourney, mapJourneyTiming, type MapJourneyRoad } from './mapJourney'
import './worldMapCamera.css'

export function MainMapAvatar({ playerId, nodeName, sameNode, active, getPosition, roads }: {
  playerId: 1 | 2; nodeName: string; sameNode: boolean; active: boolean
  getPosition: (name: string) => AdminMapRoadPoint | undefined
  roads: MapJourneyRoad[]
}) {
  const position = getPosition(nodeName)
  const controls = useAnimationControls()
  const { reducedMotion, speed } = useGameMotionPreferences()
  const previous = useRef(nodeName)
  const roadsRef = useRef(roads)
  roadsRef.current = roads
  const queue = useRef<AdminMapRoadPoint[][]>([])
  const running = useRef(false)
  const version = useRef(0)
  const element = useRef<HTMLDivElement>(null)
  // Mentre la pedina percorre la strada saltella (worldMapCamera.css).
  const [walking, setWalking] = useState(false)

  useEffect(() => () => { version.current += 1; queue.current = []; controls.stop() }, [controls])
  useEffect(() => {
    const journey = getMainMapJourney(roadsRef.current, previous.current, nodeName)
    previous.current = nodeName
    if (!position) return
    if (reducedMotion || !journey.length) {
      version.current += 1
      running.current = false
      setWalking(false)
      queue.current = []
      controls.stop()
      controls.set({ left: `${position.x}%`, top: `${position.y}%` })
      return
    }
    queue.current.push(journey)
    if (running.current) return
    running.current = true
    setWalking(true)
    const token = version.current
    void (async () => {
      while (token === version.current && queue.current.length) {
        const points = queue.current.shift()!
        const bounds = element.current?.parentElement?.getBoundingClientRect()
        const timing = mapJourneyTiming(points, bounds?.width ?? 1920, bounds?.height ?? 1080)
        await controls.start({
          left: points.map((point) => `${point.x}%`), top: points.map((point) => `${point.y}%`),
          transition: { ease: 'linear', times: timing.times, duration: timing.duration / speed },
        })
      }
      if (token === version.current) { running.current = false; setWalking(false) }
    })()
  }, [nodeName, position?.x, position?.y, reducedMotion, speed, controls])
  if (!position) return null
  const offset = sameNode ? (playerId === 1 ? -44 : -12) : -27
  return <motion.div ref={element} data-main-map-player={playerId} data-node-name={nodeName} data-walking={walking}
    className="pointer-events-none absolute z-30 h-[72px] w-[72px]"
    initial={{ left: `${position.x}%`, top: `${position.y}%` }} animate={controls}
    style={{ marginLeft: offset, marginTop: -81 }}>
    {/* Fase U5: le pedine a figura intera del lotto 1, con la posa in salto mentre camminano. */}
    <div className="world-map-pawn-body">{hasGameArt(`pawn-player-${playerId}-idle`)
      ? <GameArt id={`pawn-player-${playerId}-${walking && hasGameArt(`pawn-player-${playerId}-jump`) ? 'jump' : 'idle'}`}
        className={`world-map-pawn-art h-full w-full drop-shadow-2xl ${active ? '' : 'opacity-80 grayscale-[0.25]'}`} />
      : <img src={assetUrl(`/ui/player${playerId}.png`)} alt=""
        className={`h-full w-full object-contain drop-shadow-2xl ${active ? '' : 'opacity-80 grayscale-[0.25]'}`} draggable={false} />}</div>
    <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded border border-white/70 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow ${playerId === 1 ? 'bg-rose-600' : 'bg-sky-600'}`}>G{playerId}</span>
  </motion.div>
}
