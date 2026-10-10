import { lazy, Suspense, useState } from 'react'
import { createPortal } from 'react-dom'
import { GameDialog } from '@/components/ui/GameDialog'
import { GameSettingsPanel } from './GameSettingsPanel'
import { SaveRecoveryNotice } from '@/save/SaveRecoveryNotice'

const BackupPanel = lazy(() => import('@/save/BackupPanel').then((module) => ({ default: module.BackupPanel })))
const PlayerJournalPanel = lazy(() => import('@/journal/PlayerJournalPanel').then((module) => ({ default: module.PlayerJournalPanel })))
const BattleArchivePanel = lazy(() => import('@/components/battle/BattleArchivePanel').then((module) => ({ default: module.BattleArchivePanel })))
export function PlayerTools() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'journal' | 'backup' | 'settings' | 'chronicles'>('journal')
  return <>
    {createPortal(<SaveRecoveryNotice onOpenBackup={() => { setTab('backup'); setOpen(true) }} />, document.body)}
    {createPortal(<button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className="fixed bottom-3 left-3 z-[950] rounded-lg border border-violet-300 bg-slate-950/95 px-4 py-2 text-sm font-bold text-white shadow-lg">Partita</button>, document.body)}
    {open ? <GameDialog title="La tua partita" onClose={() => setOpen(false)}>
      <nav aria-label="Strumenti della partita" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{([
        ['journal', 'Diario'], ['backup', 'Backup'], ['settings', 'Impostazioni'], ['chronicles', 'Cronache'],
      ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`rounded border px-3 py-3 ${tab === id ? 'border-violet-300 bg-violet-800' : 'border-slate-500 bg-slate-800'}`}>{label}</button>)}</nav>
      <Suspense fallback={<p role="status">Caricamento…</p>}>
        {tab === 'journal' ? <PlayerJournalPanel /> : tab === 'backup' ? <BackupPanel /> : tab === 'chronicles' ? <BattleArchivePanel /> : <GameSettingsPanel />}
      </Suspense>
    </GameDialog> : null}
  </>
}
