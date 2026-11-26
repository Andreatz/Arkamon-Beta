import { lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { AdminRuntime } from '@/admin/AdminRuntime'
import { AdminOverlay } from '@/admin/AdminOverlay'
import { AppliedUiDesign } from '@/ui-studio/AppliedUiDesign'
import { PlayerTools } from '@/settings/PlayerTools'
import { SessionGate } from '@/session/SessionGate'
import { MotionRoot } from '@/motion/MotionRoot'
import { useGamePreferences } from '@/settings/gamePreferences'
import '@/components/ui/gameControls.css'

/**
 * Laboratori di sviluppo (Fase 6): stessi strumenti di prima, ora in `dev.html#<laboratorio>`.
 * Questa pagina esiste solo nel server di sviluppo e non entra nella build del gioco.
 */
export const LABS: Record<string, { title: string; component: LazyExoticComponent<ComponentType> }> = {
  'battle-rules-lab': { title: 'Regole di battaglia', component: lazy(() => import('@/components/battle/BattleRulesLab').then(module => ({ default: module.BattleRulesLab }))) },
  'audio-lab': { title: 'Suoni e musica', component: lazy(() => import('@/components/audio/SoundLab').then(module => ({ default: module.SoundLab }))) },
  'transition-lab': { title: 'Transizioni', component: lazy(() => import('@/components/transitions/SceneTransitionLab').then(module => ({ default: module.SceneTransitionLab }))) },
  'vfx-lab': { title: 'VFX', component: lazy(() => import('@/components/vfx/VfxGallery').then(module => ({ default: module.VfxGallery }))) },
  'dice-lab': { title: 'Dadi', component: lazy(() => import('@/components/battle/BattleDiceLab').then(module => ({ default: module.BattleDiceLab }))) },
  'stage-lab': { title: 'Palco e camera', component: lazy(() => import('@/motion/MotionLab').then(module => ({ default: module.MotionLab }))) },
  'deposit-lab': { title: 'Deposito', component: lazy(() => import('@/components/deposit/DepositLab').then(module => ({ default: module.DepositLab }))) },
  'arkamon-lab': { title: 'Animazioni Arkamon', component: lazy(() => import('@/components/arkamon/DarklawAnimationLab').then(module => ({ default: module.DarklawAnimationLab }))) },
}

function LabShell({ children }: { children: ReactNode }) {
  return <div className="relative flex h-full w-full min-w-0 shrink-0 items-center justify-center [&>main]:w-full [&>main]:min-w-0 [&>main]:shrink-0">
    <AdminRuntime /><AppliedUiDesign /><AdminOverlay /><PlayerTools /><Suspense fallback={<div role="status">Caricamento laboratorio…</div>}>{children}</Suspense>
  </div>
}

function LabIndex() {
  return <main className="mx-auto max-w-3xl space-y-4 p-8 text-slate-100">
    <h1 className="text-3xl font-black">Laboratori di Arkamon</h1>
    <p className="text-slate-300">Strumenti di sviluppo, disponibili solo con <code>npm run dev</code>.</p>
    <ul className="grid gap-2 sm:grid-cols-2">{Object.entries(LABS).map(([id, lab]) => <li key={id}>
      <a className="block rounded-lg border border-white/20 px-4 py-3 hover:bg-white/10" href={`#${id}`}>{lab.title}</a>
    </li>)}</ul>
    <p><a className="underline" href={import.meta.env.BASE_URL}>Torna al gioco</a></p>
  </main>
}

export function DevApp() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => { const sync = () => setHash(window.location.hash); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync) }, [])
  const motion = useGamePreferences(state => state.reducedMotion)
  const lab = LABS[hash.replace(/^#/, '')]
  const Lab = lab?.component
  return <MotionConfig reducedMotion={motion === 'system' ? 'user' : motion === 'on' ? 'always' : 'never'}><MotionRoot /><SessionGate>
    {Lab ? <LabShell><Lab /></LabShell> : <LabIndex />}
  </SessionGate></MotionConfig>
}
