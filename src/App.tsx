import { registerScenePreparer } from '@/components/transitions/scenePrefetch'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useGameStore } from '@store/gameStore'
import { TitoloScene } from '@scenes/TitoloScene'
import { SceneTransition } from '@/components/transitions/SceneTransition'
import { preloadSceneTransitionArtwork } from '@/components/transitions/ArkamonDiceArtwork'
import type { NavigazioneScena, SceneId } from '@/types'
import { AudioController } from '@components/AudioController'
import { AdminOverlay } from '@/admin/AdminOverlay'
import { AdminRuntime } from '@/admin/AdminRuntime'
import { getLocalMap } from '@/data/localMaps'
import { PlayerTools } from '@/settings/PlayerTools'
import { MotionConfig } from 'framer-motion'
import { useGameMotionPreferences, useGamePreferences } from '@/settings/gamePreferences'
import { ChallengeBanner } from '@/challenges/ChallengeBanner'
import { SaveFailureNotice } from '@/save/SaveFailureNotice'
import { SessionGate } from '@/session/SessionGate'
import { PublicPresentationBridge } from '@/regia/PublicPresentationBridge'
import { AppliedUiDesign } from '@/ui-studio/AppliedUiDesign'
import { isUiStudioPreview } from '@/ui-studio/previewMode'
import { MotionRoot } from '@/motion/MotionRoot'
import { decodeImage } from '@/components/transitions/sceneTransitionRuntime'
import { assetUrl } from '@/utils/assetUrl'
import { getBackground } from '@/data/backgrounds'
import '@/components/ui/gameControls.css'

// Caricatori delle scene: condivisi fra `lazy` e il precaricamento delle transizioni.
const sceneLoaders = {
  laboratorio: () => import('@scenes/LaboratorioScene'),
  'mappa-principale': () => import('@scenes/MappaPrincipaleScene'),
  battaglia: () => import('@scenes/BattagliaScene'),
  percorso: () => import('@scenes/PercorsoScene'),
  citta: () => import('@scenes/CittaScene'),
  deposito: () => import('@scenes/DepositoScene'),
  evoluzione: () => import('@scenes/EvoluzioneScene'),
  lega: () => import('@/league/LeagueScene'),
} satisfies Partial<Record<SceneId, () => Promise<unknown>>>
const LaboratorioScene = lazy(() => sceneLoaders.laboratorio().then((module) => ({ default: module.LaboratorioScene })))
const MappaPrincipaleScene = lazy(() => sceneLoaders['mappa-principale']().then((module) => ({ default: module.MappaPrincipaleScene })))
const BattagliaScene = lazy(() => sceneLoaders.battaglia().then((module) => ({ default: module.BattagliaScene })))
const PercorsoScene = lazy(() => sceneLoaders.percorso().then((module) => ({ default: module.PercorsoScene })))
const CittaScene = lazy(() => sceneLoaders.citta().then((module) => ({ default: module.CittaScene })))
const DepositoScene = lazy(() => sceneLoaders.deposito().then((module) => ({ default: module.DepositoScene })))
const EvoluzioneScene = lazy(() => sceneLoaders.evoluzione().then((module) => ({ default: module.EvoluzioneScene })))
const LeagueScene = lazy(() => sceneLoaders.lega().then((module) => ({ default: module.LeagueScene })))
// Budget di avvio (audit del 23 novembre 2026): pausa di regia, inclinazione delle schede e ponte
// del gamepad non servono a disegnare il titolo; si caricano subito dopo, in pezzi separati.
const RegiaPause = lazy(() => import('@/regia/RegiaPause').then(module => ({ default: module.RegiaPause })))
const TiltController = lazy(() => import('@/motion/ui/TiltController').then(module => ({ default: module.TiltController })))
const GamepadBridge = lazy(() => import('@/input/GamepadBridge').then(module => ({ default: module.GamepadBridge })))
// Budget di avvio: la fascia del turno (con i ritratti della squadra) non serve al titolo.
const AudioEventBridge = lazy(() => import('@/components/audio/AudioEventBridge').then(module => ({ default: module.AudioEventBridge })))
const TurnChangeBanner = lazy(() => import('@/components/overworld/TurnChangeBanner').then(module => ({ default: module.TurnChangeBanner })))
const UiStudioEditor = lazy(() => import('@/ui-studio/UiStudioEditor').then(module => ({ default: module.UiStudioEditor })))
const UiStudioPreview = lazy(() => import('@/ui-studio/UiStudioPreview').then(module => ({ default: module.UiStudioPreview })))
const ReferenceUiPreview = lazy(() => import('@/ui-studio/ReferenceUiPreview').then(module => ({ default: module.ReferenceUiPreview })))
const DarklawAnimationLab = lazy(() => import('@/components/arkamon/DarklawAnimationLab').then(module => ({ default: module.DarklawAnimationLab })))

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
  const { reducedMotion } = useGameMotionPreferences()
  const localMapOpen = (scenaCorrente.scena === 'citta' || scenaCorrente.scena === 'percorso')
    && !!getLocalMap(String(scenaCorrente.payload?.luogo ?? (scenaCorrente.scena === 'citta' ? 'Venezia' : 'Percorso_1')))

  useEffect(() => {
    // Title commands warm this artwork on intent. Read-only previews and the
    // reduced-motion path never display it and must not fetch 1.3 MB of dice.
    if (!isUiStudioPreview() && !reducedMotion && scenaCorrente.scena !== 'titolo') preloadSceneTransitionArtwork()
  }, [reducedMotion, scenaCorrente.scena])

  // `?uiConcepts=1` resta un alias storico dell'anteprima di riferimento (i concept alternativi sono stati rimossi).
  if (new URLSearchParams(window.location.search).get('uiReferences') === '1' || new URLSearchParams(window.location.search).get('uiConcepts') === '1') {
    return <Suspense fallback={<div role="status">Preparazione della nuova interfaccia…</div>}><ReferenceUiPreview /></Suspense>
  }
  if (new URLSearchParams(window.location.search).get('uiStudioPreview') === '1') {
    return <Suspense fallback={<div role="status">Preparazione anteprima…</div>}><UiStudioPreview /></Suspense>
  }
  if (hash === '#ui-studio') {
    return <Suspense fallback={<div role="status">Caricamento editor interfaccia…</div>}><UiStudioEditor onClose={() => { window.location.hash = '' }} /></Suspense>
  }

  if (hash === '#arkamon-lab') {
    return <Suspense fallback={<div role="status">Caricamento animazioni.</div>}><DarklawAnimationLab /></Suspense>
  }

  return (
    <div className={`arka-stage${localMapOpen ? ' arka-stage--local-map' : ''}${scenaCorrente.scena === 'lega' ? ' arka-stage--league' : ''}`}>
      <AdminRuntime />
      <AppliedUiDesign />
      <AdminOverlay />
      <PublicPresentationBridge />
      <Suspense fallback={null}><RegiaPause /></Suspense>
      <PlayerTools />
      <Suspense fallback={null}><TiltController /><GamepadBridge /></Suspense>
      <SaveFailureNotice />
      <ChallengeBanner key={`challenge-banner-${campaignRevision}`} />
      <Suspense fallback={null}><TurnChangeBanner key={`turn-banner-${campaignRevision}`} /></Suspense>
      <Suspense fallback={null}><AudioEventBridge /></Suspense>
      <SceneTransition key={campaignRevision} navigation={scenaCorrente} renderScene={renderPresentedScene} prepareScene={prepareScene}>
        <AudioController />
      </SceneTransition>
    </div>
  )
}


/** Sfondo principale della scena di arrivo, da decodificare prima della rivelazione. */
function sceneArtwork(navigation: NavigazioneScena): string | null {
  if (navigation.scena === 'mappa-principale') return assetUrl('/maps/Mappa-Finale.jpg')
  if (navigation.scena !== 'citta' && navigation.scena !== 'percorso') return null
  const location = String(navigation.payload?.luogo ?? (navigation.scena === 'citta' ? 'Venezia' : 'Percorso_1'))
  const localMap = getLocalMap(location)
  return localMap ? assetUrl(localMap.image) : getBackground(location)
}

function prepareScene(navigation: NavigazioneScena): Promise<unknown> {
  const loader = (sceneLoaders as Partial<Record<SceneId, () => Promise<unknown>>>)[navigation.scena]
  const artwork = sceneArtwork(navigation)
  return Promise.all([loader?.(), artwork ? decodeImage(artwork) : undefined])
}
// Audit fase 6: le scene possono essere precaricate anche su intenzione (hover, destinazione scelta).
registerScenePreparer(prepareScene)

function renderPresentedScene(navigation: NavigazioneScena) {
  return <Suspense fallback={<div className="flex h-full items-center justify-center p-4 text-arka-text-muted" role="status">Caricamento scena…</div>}>
    {renderScena(navigation.scena)}
  </Suspense>
}

function renderScena(scena: SceneId) {
  switch (scena) {
    case 'lega':
      return <LeagueScene />
    case 'titolo':
      return <TitoloScene />
    case 'laboratorio':
      return <LaboratorioScene />
    case 'mappa-principale':
      return <MappaPrincipaleScene />
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
  // Audit fase 3: la dimensione del testo scelta nelle Impostazioni scala i token tipografici.
  const textSize = useGamePreferences((state) => state.textSize)
  useEffect(() => {
    const root = document.documentElement
    if (textSize === 'normal') delete root.dataset.textSize
    else root.dataset.textSize = textSize
  }, [textSize])
  return <MotionConfig reducedMotion={motion === 'system' ? 'user' : motion === 'on' ? 'always' : 'never'}><MotionRoot /><SessionGate><App /></SessionGate></MotionConfig>
}
export default GameApp
