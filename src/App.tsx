import { lazy, Suspense, useEffect, useState } from 'react'
import { useGameStore } from '@store/gameStore'
import { TitoloScene } from '@scenes/TitoloScene'
import { LaboratorioScene } from '@scenes/LaboratorioScene'
import { MappaPrincipaleScene } from '@scenes/MappaPrincipaleScene'
import { BattagliaScene } from '@scenes/BattagliaScene'
import { PercorsoScene } from '@scenes/PercorsoScene'
import { CittaScene } from '@scenes/CittaScene'
import { DepositoScene } from '@scenes/DepositoScene'
import { EvoluzioneScene } from '@scenes/EvoluzioneScene'
import { SceneTransition } from '@/components/transitions/SceneTransition'
import { preloadSceneTransitionArtwork } from '@/components/transitions/ArkamonDiceArtwork'
import type { NavigazioneScena, SceneId } from '@/types'
import { AudioController } from '@components/AudioController'
import { AdminOverlay } from '@/admin/AdminOverlay'
import { AdminRuntime } from '@/admin/AdminRuntime'
import { getLocalMap } from '@/data/localMaps'
import { PlayerTools } from '@/settings/PlayerTools'
import { MotionConfig } from 'framer-motion'
import { useGamePreferences } from '@/settings/gamePreferences'

const AudioLab = lazy(() => import('@/components/audio/AudioLab').then((module) => ({ default: module.AudioLab })))
const BattleRulesLab = lazy(() => import('@/components/battle/BattleRulesLab').then((module) => ({ default: module.BattleRulesLab })))
const SceneTransitionLab = lazy(() => import('@/components/transitions/SceneTransitionLab').then((module) => ({ default: module.SceneTransitionLab })))
const VfxGallery = lazy(() => import('@/components/vfx/VfxGallery').then((module) => ({ default: module.VfxGallery })))
const BattleDiceLab = lazy(() => import('@/components/battle/BattleDiceLab').then((module) => ({ default: module.BattleDiceLab })))
const DepositLab = lazy(() => import('@/components/deposit/DepositLab').then((module) => ({ default: module.DepositLab })))
const DarklawAnimationLab = lazy(() => import('@/components/arkamon/DarklawAnimationLab').then((module) => ({ default: module.DarklawAnimationLab })))
const MappaGrigliaScene = lazy(() => import('@scenes/MappaGrigliaScene').then((module) => ({ default: module.MappaGrigliaScene })))

/**
 * Router delle scene.
 * Sostituisce il sistema VBA delle slide PowerPoint identificate da ID.
 * Aggiungi qui ogni nuova scena man mano che la implementi.
 */
function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const sync = () => setHash(window.location.hash); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync) }, [])
  const scenaCorrente = useGameStore((s) => s.scenaCorrente)
  const campaignRevision = useGameStore((s) => s.campaignRevision)
  const localMapOpen = (scenaCorrente.scena === 'citta' || scenaCorrente.scena === 'percorso')
    && !!getLocalMap(String(scenaCorrente.payload?.luogo ?? (scenaCorrente.scena === 'citta' ? 'Venezia' : 'Percorso_1')))

  useEffect(() => { preloadSceneTransitionArtwork() }, [])

  if (hash === '#battle-rules-lab') return <LabShell><BattleRulesLab /></LabShell>

  if (hash === '#audio-lab') {
    return <LabShell><Suspense fallback={<div role="status">Caricamento laboratorio audio…</div>}><AudioLab /></Suspense></LabShell>
  }

  if (hash === '#transition-lab') {
    return <LabShell><SceneTransitionLab /></LabShell>
  }

  if (hash === '#vfx-lab') {
    return <LabShell><VfxGallery /></LabShell>
  }

  if (hash === '#dice-lab') {
    return <LabShell><BattleDiceLab /></LabShell>
  }

  if (hash === '#deposit-lab') {
    return <LabShell><DepositLab /></LabShell>
  }

  if (hash === '#arkamon-lab') {
    return <LabShell><DarklawAnimationLab /></LabShell>
  }

  return (
    <div className={`arka-stage${localMapOpen ? ' arka-stage--local-map' : ''}`}>
      <AdminRuntime />
      <AdminOverlay />
      <PlayerTools />
      <SceneTransition key={campaignRevision} navigation={scenaCorrente} renderScene={renderPresentedScene}>
        <AudioController />
      </SceneTransition>
    </div>
  )
}

function LabShell({ children }: { children: React.ReactNode }) {
  return <div className="relative flex h-full w-full min-w-0 shrink-0 items-center justify-center [&>main]:w-full [&>main]:min-w-0 [&>main]:shrink-0">
    <AdminRuntime /><AdminOverlay /><PlayerTools /><Suspense fallback={<div role="status">Caricamento laboratorio…</div>}>{children}</Suspense>
  </div>
}

function renderPresentedScene(navigation: NavigazioneScena) {
  return renderScena(navigation.scena)
}

function renderScena(scena: SceneId) {
  switch (scena) {
    case 'titolo':
      return <TitoloScene />
    case 'laboratorio':
      return <LaboratorioScene />
    case 'mappa-principale':
      return <MappaPrincipaleScene />
    case 'mappa-griglia':
      return <Suspense fallback={<div role="status">Caricamento mappa…</div>}><MappaGrigliaScene /></Suspense>
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

function GameApp() {
  const motion = useGamePreferences((state) => state.reducedMotion)
  return <MotionConfig reducedMotion={motion === 'system' ? 'user' : motion === 'on' ? 'always' : 'never'}><App /></MotionConfig>
}
export default GameApp
