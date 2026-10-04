import { useEffect } from 'react'
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

/**
 * Router delle scene.
 * Sostituisce il sistema VBA delle slide PowerPoint identificate da ID.
 * Aggiungi qui ogni nuova scena man mano che la implementi.
 */
function App() {
  const scenaCorrente = useGameStore((s) => s.scenaCorrente)

  useEffect(() => { preloadSceneTransitionArtwork() }, [])

  if (import.meta.env.DEV && window.location.hash === '#transition-lab') {
    return <SceneTransitionLab />
  }

  if (import.meta.env.DEV && window.location.hash === '#vfx-lab') {
    return <VfxGallery />
  }

  if (import.meta.env.DEV && window.location.hash === '#dice-lab') {
    return <BattleDiceLab />
  }

  if (import.meta.env.DEV && window.location.hash === '#deposit-lab') {
    return <DepositLab />
  }

  if (import.meta.env.DEV && window.location.hash === '#arkamon-lab') {
    return <DarklawAnimationLab />
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
