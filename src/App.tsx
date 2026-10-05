import { BattleRulesLab } from '@/components/battle/BattleRulesLab'
import { lazy, Suspense, useEffect, useState } from 'react'
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
import { SceneTransition } from '@/components/transitions/SceneTransition'
import { preloadSceneTransitionArtwork } from '@/components/transitions/ArkamonDiceArtwork'
import { SceneTransitionLab } from '@/components/transitions/SceneTransitionLab'
import type { NavigazioneScena, SceneId } from '@/types'
import { AudioController } from '@components/AudioController'
import { AdminOverlay } from '@/admin/AdminOverlay'
import { AdminRuntime } from '@/admin/AdminRuntime'
import { VfxGallery } from '@/components/vfx/VfxGallery'
import { BattleDiceLab } from '@/components/battle/BattleDiceLab'
import { DepositLab } from '@/components/deposit/DepositLab'
import { DarklawAnimationLab } from '@/components/arkamon/DarklawAnimationLab'

const AudioLab = lazy(() => import('@/components/audio/AudioLab').then((module) => ({ default: module.AudioLab })))

/**
 * Router delle scene.
 * Sostituisce il sistema VBA delle slide PowerPoint identificate da ID.
 * Aggiungi qui ogni nuova scena man mano che la implementi.
 */
function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const sync = () => setHash(window.location.hash); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync) }, [])
  const scenaCorrente = useGameStore((s) => s.scenaCorrente)

  useEffect(() => { preloadSceneTransitionArtwork() }, [])

  if (import.meta.env.DEV && hash === '#battle-rules-lab') return <LabShell><BattleRulesLab /></LabShell>

  if (import.meta.env.DEV && hash === '#audio-lab') {
    return <LabShell><Suspense fallback={<div role="status">Caricamento laboratorio audio…</div>}><AudioLab /></Suspense></LabShell>
  }

  if (import.meta.env.DEV && hash === '#transition-lab') {
    return <LabShell><SceneTransitionLab /></LabShell>
  }

  if (import.meta.env.DEV && hash === '#vfx-lab') {
    return <LabShell><VfxGallery /></LabShell>
  }

  if (import.meta.env.DEV && hash === '#dice-lab') {
    return <LabShell><BattleDiceLab /></LabShell>
  }

  if (import.meta.env.DEV && hash === '#deposit-lab') {
    return <LabShell><DepositLab /></LabShell>
  }

  if (import.meta.env.DEV && hash === '#arkamon-lab') {
    return <LabShell><DarklawAnimationLab /></LabShell>
  }

  return (
    <div className="arka-stage">
      <AdminRuntime />
      <AdminOverlay />
      <SceneTransition navigation={scenaCorrente} renderScene={renderPresentedScene}>
        <AudioController />
      </SceneTransition>
    </div>
  )
}

function LabShell({ children }: { children: React.ReactNode }) { return <><AdminRuntime /><AdminOverlay />{children}</> }

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
