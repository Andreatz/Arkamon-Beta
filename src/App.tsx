import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@store/gameStore'
import { TitoloScene } from '@scenes/TitoloScene'
import { LaboratorioScene } from '@scenes/LaboratorioScene'
import { MappaPrincipaleScene } from '@scenes/MappaPrincipaleScene'
import { MappaGrigliaScene } from '@scenes/MappaGrigliaScene'
import { BattagliaScene } from '@scenes/BattagliaScene'
import { PercorsoScene } from '@scenes/PercorsoScene'
import { CittaScene } from '@scenes/CittaScene'
import { DepositoScene } from '@scenes/DepositoScene'
import { EvoluzioneScene } from '@scenes/EvoluzioneScene'
import { AnimatePresence, motion } from 'framer-motion'
import { AudioController } from '@components/AudioController'
import { AdminOverlay } from '@/admin/AdminOverlay'
import { AdminRuntime } from '@/admin/AdminRuntime'
import { VfxGallery } from '@/components/vfx/VfxGallery'
import { assetUrl } from '@/utils/assetUrl'

const BATTLE_TRANSITION_VIDEO = '/assets/Transizione Battaglia.mp4'
const BATTLE_TRANSITION_START_SECONDS = 5
const BATTLE_TRANSITION_BLEND_MS = 950

/**
 * Router delle scene.
 * Sostituisce il sistema VBA delle slide PowerPoint identificate da ID.
 * Aggiungi qui ogni nuova scena man mano che la implementi.
 */
function App() {
  const scenaCorrente = useGameStore((s) => s.scenaCorrente)

  if (import.meta.env.DEV && window.location.hash === '#vfx-lab') {
    return <VfxGallery />
  }

  return (
    <div className="arka-stage">
      <AdminRuntime />
      <AudioController />
      <AdminOverlay />
      <AnimatePresence mode="wait">
        <motion.div
          key={scenaCorrente.scena}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {renderScena(scenaCorrente.scena)}
          {scenaCorrente.scena === 'battaglia' ? <BattleIntroTransition /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function BattleIntroTransition() {
  const [hidden, setHidden] = useState(false)
  const [blending, setBlending] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const finish = useCallback(() => {
    setBlending(true)
    if (timeoutRef.current !== null) return
    timeoutRef.current = window.setTimeout(() => {
      setHidden(true)
    }, BATTLE_TRANSITION_BLEND_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (hidden) return null

  return (
    <motion.div
      className="pointer-events-auto absolute inset-0 z-[90] bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: blending ? 0 : 1 }}
      transition={{ duration: BATTLE_TRANSITION_BLEND_MS / 1000, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <video
        className="h-full w-full object-cover"
        src={assetUrl(BATTLE_TRANSITION_VIDEO)}
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (Number.isFinite(video.duration) && video.duration > BATTLE_TRANSITION_START_SECONDS) {
            video.currentTime = BATTLE_TRANSITION_START_SECONDS
          }
          void video.play().catch(finish)
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          if (!Number.isFinite(video.duration)) return
          const remainingMs = (video.duration - video.currentTime) * 1000
          if (remainingMs <= BATTLE_TRANSITION_BLEND_MS) finish()
        }}
        onEnded={finish}
        onError={finish}
      />
    </motion.div>
  )
}

function renderScena(scena: string) {
  switch (scena) {
    case 'titolo':
      return <TitoloScene />
    case 'laboratorio':
      return <LaboratorioScene />
    case 'mappa-principale':
      return <MappaPrincipaleScene />
    case 'mappa-griglia':
      return <MappaGrigliaScene />
    case 'battaglia':
      return <BattagliaScene />
    case 'percorso':
      return <PercorsoScene />
    case 'citta':
      return <CittaScene />
    case 'deposito':
      return <DepositoScene />
    case 'evoluzione':
      return <EvoluzioneScene />
    default:
      return (
        <div className="flex items-center justify-center h-full text-arka-text-muted">
          Scena non implementata: <span className="text-white ml-2">{scena}</span>
        </div>
      )
  }
}

export default App
