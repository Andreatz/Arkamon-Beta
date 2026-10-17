import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { SceneNavigationContext, SceneInputContext } from '@/components/transitions/SceneNavigationContext'
import { PlayerUi } from '@/player-ui/PlayerUi'
import type { PlayerUiAuxiliary, PlayerUiScreen } from '@/player-ui/navigation'
import { createDefaultDesign, normalizeDesign } from './designModel'
import { createPreviewFixture } from './previewFixtures'
import { UiDesignRuntime } from './UiDesignRuntime'
import { UI_STUDIO_SCREENS, UI_STUDIO_SCREEN_VIEWS, type UiDesignDocument, type UiStudioMessage } from './types'
import { isUiStudioPreview } from './previewMode'
import { UiPreviewViewContext } from './UiPreviewViewContext'

const Titolo = lazy(() => import('@/scenes/TitoloScene').then(module => ({ default: module.TitoloScene })))
const Laboratorio = lazy(() => import('@/scenes/LaboratorioScene').then(module => ({ default: module.LaboratorioScene })))
const MainMap = lazy(() => import('@/scenes/MappaPrincipaleScene').then(module => ({ default: module.MappaPrincipaleScene })))
const City = lazy(() => import('@/scenes/CittaScene').then(module => ({ default: module.CittaScene })))
const Route = lazy(() => import('@/scenes/PercorsoScene').then(module => ({ default: module.PercorsoScene })))
const Grid = lazy(() => import('@/scenes/MappaGrigliaScene').then(module => ({ default: module.MappaGrigliaScene })))
const Battle = lazy(() => import('@/scenes/BattagliaScene').then(module => ({ default: module.BattagliaScene })))
const League = lazy(() => import('@/league/LeagueScene').then(module => ({ default: module.LeagueScene })))
const Evolution = lazy(() => import('@/scenes/EvoluzioneScene').then(module => ({ default: module.EvoluzioneScene })))
const auxiliaries = ['journal', 'backup', 'settings', 'chronicles', 'match', 'challenges']
const management = ['menu', 'squadra', 'deposito', 'arkadex', 'analisi', 'borsa', 'negozio', ...auxiliaries]
function Scene({ screen }: { screen: string }) {
  if (management.includes(screen)) return <PlayerUi key={screen} initialScreen={(screen === 'menu' || auxiliaries.includes(screen) ? 'partita' : screen) as PlayerUiScreen} initialPlayerId={1} initialAuxiliary={auxiliaries.includes(screen) ? screen as PlayerUiAuxiliary : undefined} initialShopInteractionId={screen === 'negozio' ? 'ui-studio-demo' : undefined} onClose={() => {}} />
  if (screen === 'laboratorio') return <Laboratorio />
  if (screen === 'mappa-principale') return <MainMap />
  if (screen === 'citta') return <City />
  if (screen === 'percorso') return <Route />
  if (screen === 'mappa-griglia') return <Grid />
  if (screen === 'battaglia') return <Battle />
  if (screen === 'lega') return <League />
  if (screen === 'evoluzione') return <Evolution />
  return <Titolo />
}

/** Only the isolated iframe route mounts this component; it never opens PlayerTools. */
export function UiStudioPreview() {
  const [screen, setScreen] = useState('titolo'), [prepared, setPrepared] = useState('')
  const [design, setDesign] = useState<UiDesignDocument>(createDefaultDesign)
  const [, setSelected] = useState<string | null>(null)
  const [snapshotRevision, setSnapshotRevision] = useState(0)
  useLayoutEffect(() => {
    if (!isUiStudioPreview()) return
    useGameStore.setState({ ...createPreviewFixture(screen), challengeContext: null, teamRuleMessage: null, saveRecoveryWarnings: [], campaignRevision: useGameStore.getState().campaignRevision + 1 })
    setPrepared(screen)
  }, [screen])
  useEffect(() => {
    const receive = (event: MessageEvent<UiStudioMessage>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.source !== 'arkamon-ui-studio') return
      const message = event.data
      if (message.type === 'design') { try { setDesign(normalizeDesign(message.design)) } catch { /* Invalid drafts cannot enter a live renderer. */ } }
      if (message.type === 'screen') {
        const [base, view] = message.screen.split(':')
        if (UI_STUDIO_SCREENS.some(([id]) => id === base) && (!view || UI_STUDIO_SCREEN_VIEWS[base]?.some(([id]) => id === view))) setScreen(message.screen)
      }
      if (message.type === 'select') setSelected(message.id)
      if (message.type === 'request-snapshot') setSnapshotRevision(value => value + 1)
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ source: 'arkamon-ui-preview', type: 'ready' }, window.location.origin)
    return () => window.removeEventListener('message', receive)
  }, [])
  if (!isUiStudioPreview()) return <p>Questa anteprima è disponibile soltanto nello Studio UI.</p>
  const navigation = useGameStore.getState().scenaCorrente
  return <MotionConfig reducedMotion="always"><div data-ui-studio-preview-screen={screen} className="ui-studio-preview-stage" style={{ position: 'relative', width: '1920px', height: '1080px', overflow: 'hidden', background: '#0b1728' }}>
    {prepared === screen && <UiPreviewViewContext.Provider value={screen.split(':')[1] ?? null}><SceneNavigationContext.Provider value={navigation}><SceneInputContext.Provider value={true}><Suspense fallback={<p role="status">Caricamento schermata…</p>}><Scene key={screen} screen={screen.split(':')[0]} /></Suspense></SceneInputContext.Provider></SceneNavigationContext.Provider></UiPreviewViewContext.Provider>}
    <UiDesignRuntime preview design={design} screen={screen} key={`runtime-${snapshotRevision}`} />
  </div></MotionConfig>
}
