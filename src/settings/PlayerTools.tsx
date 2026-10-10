import { lazy, Suspense, useState } from 'react'
import { createPortal } from 'react-dom'
import { GameDialog } from '@/components/ui/GameDialog'
import { GameSettingsPanel } from './GameSettingsPanel'
import { SaveRecoveryNotice } from '@/save/SaveRecoveryNotice'
import { useGameStore } from '@/store/gameStore'
import { launchChallenge } from '@/challenges/challengeRuntime'
import { TeamRuleNotice } from './TeamRuleNotice'

const BackupPanel = lazy(() => import('@/save/BackupPanel').then((module) => ({ default: module.BackupPanel })))
const PlayerJournalPanel = lazy(() => import('@/journal/PlayerJournalPanel').then((module) => ({ default: module.PlayerJournalPanel })))
const BattleArchivePanel = lazy(() => import('@/components/battle/BattleArchivePanel').then((module) => ({ default: module.BattleArchivePanel })))
const ArkadexPanel = lazy(() => import('@/arkadex/ArkadexPanel').then((module) => ({ default: module.ArkadexPanel })))
const MatchRegisterPanel = lazy(() => import('@/match/MatchRegisterPanel').then((module) => ({ default: module.MatchRegisterPanel })))
const ItemBagPanel = lazy(() => import('@/shop/ItemBagPanel').then((module) => ({ default: module.ItemBagPanel })))
const ChallengePanel = lazy(() => import('@/challenges/ChallengePanel').then((module) => ({ default: module.ChallengePanel })))
export function PlayerTools() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'journal' | 'backup' | 'settings' | 'chronicles' | 'arkadex' | 'match' | 'bag' | 'challenges'>('journal')
  const context = useGameStore((state) => state.challengeContext)
  const useItem = useGameStore((state) => state.applicaOggetto)
  return <>
    {createPortal(<SaveRecoveryNotice onOpenBackup={() => { setTab('backup'); setOpen(true) }} />, document.body)}
    {createPortal(<TeamRuleNotice />, document.body)}
    {createPortal(<button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className="fixed bottom-3 left-3 z-[950] rounded-lg border border-violet-300 bg-slate-950/95 px-4 py-2 text-sm font-bold text-white shadow-lg">Partita</button>, document.body)}
    {open ? <GameDialog title="La tua partita" onClose={() => setOpen(false)}>
      <nav aria-label="Strumenti della partita" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{([
        ['journal', 'Diario'], ['backup', 'Backup'], ['settings', 'Impostazioni'], ['chronicles', 'Cronache'],
        ['arkadex', 'Arkadex'], ['bag', 'Borsa'], ['match', 'Registro del match'], ['challenges', 'Sfide'],
      ] as const).map(([id, label]) => <button key={id} type="button" disabled={!!context && id !== 'settings' && id !== 'challenges'} aria-pressed={tab === id} onClick={() => setTab(id)} className={`rounded border px-3 py-3 disabled:opacity-40 ${tab === id ? 'border-violet-300 bg-violet-800' : 'border-slate-500 bg-slate-800'}`}>{label}</button>)}</nav>
      <Suspense fallback={<p role="status">Caricamento…</p>}>
        {tab === 'challenges' || context && tab !== 'settings' ? <ChallengePanel activeSession={context?.session} onResume={() => setOpen(false)} onLaunch={(session) => {
          const result = launchChallenge(session); if (result.ok) setOpen(false); return result
        }} /> : tab === 'arkadex' ? <ArkadexPanel /> : tab === 'match' ? <MatchRegisterPanel /> : tab === 'bag' ? <ItemBagPanel onUse={useItem} />
          : tab === 'journal' ? <PlayerJournalPanel /> : tab === 'backup' ? <BackupPanel /> : tab === 'chronicles' ? <BattleArchivePanel /> : <GameSettingsPanel />}
      </Suspense>
    </GameDialog> : null}
  </>
}
