import { useCallback, useEffect, useState } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import type { NavigazioneScena } from '@/types'
import { SceneTransition } from './SceneTransition'
import { getSceneTransitionProfile } from './sceneTransitionProfiles'
import { supportsViewTransitions } from './sceneTransitionRuntime'
import { MotionPlaybackContext } from '@/settings/motionPlayback'

/**
 * Laboratorio delle transizioni (dev.html#transition-lab). Usa lo stesso `SceneTransition`
 * del gioco su scene finte: le transizioni cinematografiche si vedono identiche, con la
 * View Transition che fotografa l'intera pagina. Non crea né modifica una partita.
 */

interface Pair { id: string; label: string; from: NavigazioneScena; to: NavigazioneScena }

const PAIRS: Pair[] = [
  { id: 'smoke', label: 'Mappa → Venezia (fumo)', from: { scena: 'mappa-principale' }, to: { scena: 'citta', payload: { luogo: 'Venezia' } } },
  { id: 'smoke-back', label: 'Percorso 1 → Mappa (fumo)', from: { scena: 'percorso', payload: { luogo: 'Percorso_1' } }, to: { scena: 'mappa-principale' } },
  { id: 'title', label: 'Titolo → Mappa (vortice d\'oro)', from: { scena: 'titolo' }, to: { scena: 'mappa-principale' } },
  { id: 'battle', label: 'Percorso → Battaglia (Carta VS)', from: { scena: 'percorso', payload: { luogo: 'Percorso_1' } }, to: { scena: 'battaglia' } },
  { id: 'radiance', label: 'Battaglia → Percorso (clip luce)', from: { scena: 'battaglia' }, to: { scena: 'percorso', payload: { luogo: 'Percorso_1' } } },
  { id: 'evolution', label: 'Battaglia → Evoluzione (clip luce e dado)', from: { scena: 'battaglia' }, to: { scena: 'evoluzione' } },
  { id: 'dissolve', label: 'Venezia → Percorso 1 (dissolvenza)', from: { scena: 'citta', payload: { luogo: 'Venezia' } }, to: { scena: 'percorso', payload: { luogo: 'Percorso_1' } } },
  { id: 'dissolve-lab', label: 'Laboratorio → Mappa (dissolvenza)', from: { scena: 'laboratorio' }, to: { scena: 'mappa-principale' } },
]

function backgroundOf(navigation: NavigazioneScena): string {
  const place = typeof navigation.payload?.luogo === 'string' ? navigation.payload.luogo : ''
  switch (navigation.scena) {
    case 'mappa-principale': return '/maps/Mappa-Finale.jpg'
    case 'citta': return place === 'Venezia' ? '/backgrounds/venezia.png' : '/backgrounds/roma.png'
    case 'percorso': return '/maps/Percorso_1.png'
    case 'battaglia': return '/backgrounds/battle_forest.jpg'
    case 'evoluzione': return '/backgrounds/evolution.png'
    case 'laboratorio': return '/backgrounds/laboratory.png'
    case 'lega': return '/backgrounds/roma.png'
    default: return '/backgrounds/venezia.png'
  }
}

const NAMES: Partial<Record<NavigazioneScena['scena'], string>> = {
  'mappa-principale': 'Mappa principale', battaglia: 'Battaglia', evoluzione: 'Evoluzione', laboratorio: 'Laboratorio', lega: 'Lega Arkamon', titolo: 'Titolo',
}

/** Scena finta: sfondo e nome. */
function MockScene({ navigation }: { navigation: NavigazioneScena }) {
  const place = typeof navigation.payload?.luogo === 'string' ? navigation.payload.luogo.replace(/_/g, ' ') : ''
  return <div className="absolute inset-0 overflow-hidden bg-slate-900">
    <img src={assetUrl(backgroundOf(navigation))} alt="" className="absolute inset-0 h-full w-full object-cover" />
    {navigation.scena === 'titolo' && <img src={assetUrl('/ui/game-art/logo.webp')} alt="Arkamon"
      className="absolute left-1/2 top-[30%] w-[38%] -translate-x-1/2 -translate-y-1/2" />}
    <p className="absolute bottom-4 left-5 rounded bg-slate-950/70 px-3 py-1 text-lg font-black text-white">{place || NAMES[navigation.scena] || navigation.scena}</p>
  </div>
}

export function SceneTransitionLab() {
  const [pairId, setPairId] = useState(PAIRS[0].id)
  const [speed, setSpeed] = useState(1)
  const pair = PAIRS.find(entry => entry.id === pairId) ?? PAIRS[0]
  const [run, setRun] = useState({ key: 0, navigation: pair.from })
  const renderScene = useCallback((navigation: NavigazioneScena) => <MockScene navigation={navigation} />, [])
  const profile = getSceneTransitionProfile(pair.to, pair.from)

  // Cambio di coppia: la scena di partenza compare subito, senza transizione.
  useEffect(() => { setRun(current => ({ key: current.key + 1, navigation: pair.from })) }, [pair.from])

  const play = () => {
    // Si riparte dalla scena di partenza (nuovo montaggio), poi si naviga verso l'arrivo.
    setRun(current => ({ key: current.key + 1, navigation: pair.from }))
    window.setTimeout(() => setRun(current => ({ ...current, navigation: pair.to })), 120)
  }

  return (
    <main className="h-full min-h-0 overflow-y-auto bg-slate-950 px-4 py-6 text-slate-100 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-black sm:text-3xl">Transizioni</h1>
          <p className="text-sm leading-relaxed text-slate-300">Fine battaglia, titolo e viaggio mappa ↔ luoghi sono clip composte sopra la scena; l'ingresso in battaglia è la Carta VS; ogni altro passaggio è una dissolvenza. Qui girano con lo stesso motore del gioco, su scene finte.</p>
          {!supportsViewTransitions() && <p className="text-sm text-amber-300">Questo browser non ha la View Transitions API: le dissolvenze ripiegano su un velo.</p>}
        </header>

        <div className="flex flex-wrap items-end gap-4">
          <label className="grid min-w-64 gap-2 text-sm font-semibold" htmlFor="transition-pair">
            Passaggio
            <select id="transition-pair" value={pairId} onChange={(event) => setPairId(event.target.value)}
              className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
              {PAIRS.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="transition-speed">
            Velocità
            <select id="transition-speed" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}
              className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
              <option value={1}>Normale</option>
              <option value={2}>Veloce (regia)</option>
              <option value={0.5}>Rallentatore ½</option>
              <option value={0.25}>Rallentatore ¼</option>
            </select>
          </label>
          <button type="button" onClick={play}
            className="min-h-11 rounded-lg bg-amber-600 px-5 py-2 font-bold text-slate-950 hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">
            Riproduci
          </button>
          <p className="pb-2 text-xs text-slate-400">
            {profile.cinematic ? `${profile.cinematic.kind} · ${profile.cinematic.clip ? `clip ${profile.cinematic.clip}${profile.cinematic.handoff === 'overlay' ? `, poi ${profile.mode}` : ''}` : `dissolvenza ${profile.cinematic.revealMs} ms`}` : profile.mode}
          </p>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl" data-preview-pair={pair.id}>
          <MotionPlaybackContext.Provider value={{ speed, reducedMotion: false }}>
            <SceneTransition key={run.key} navigation={run.navigation} renderScene={renderScene} replayBattleIntro={false} />
          </MotionPlaybackContext.Provider>
        </div>
      </div>
    </main>
  )
}
