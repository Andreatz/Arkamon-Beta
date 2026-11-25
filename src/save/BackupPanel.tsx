import { useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { gameBackupFilename, MAX_GAME_BACKUP_BYTES, serializeGameBackup, validateGameBackup, type GameBackupPreview } from './gameBackup'
import { downloadGameBackup, readPreviousGameBackup, restoreGameBackup } from './restoreGameBackup'
import { useInteractionStore } from '@/interactions/interactionStore'
import { interactionCatalogForBackup, useInteractionRecoveryStatus } from '@/interactions/interactionRecovery'
import { useBattleArchiveStore } from '@/components/battle/battleArchiveStore'
import { readRecoveryCopies, useSaveWriteStatus } from './durableWrites'
import { ArkaButton, ArkaPanel } from '@/ui-system/primitives'
import { GameArt } from '@/ui-system/GameArt'

/** Render inside the common game tools menu; no scene navigation or Admin privileges required. */
export function BackupPanel() {
  const [preview, setPreview] = useState<GameBackupPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const fileReadRevision = useRef(0)
  const recoveryWarnings = useGameStore((s) => s.saveRecoveryWarnings)
  const dismissRecovery = useGameStore((s) => s.dismissSaveRecoveryWarnings)
  const [previousAvailable, setPreviousAvailable] = useState(() => readPreviousGameBackup() !== null)
  const backupWarning = useSaveWriteStatus(s => s.backupWarning)
  const catalogRecovery = useInteractionRecoveryStatus(s => s.recovery)
  const copies = readRecoveryCopies()
  const exportCurrent = () => {
    try {
      downloadGameBackup(serializeGameBackup(useGameStore.getState(), new Date(), interactionCatalogForBackup(useInteractionStore.getState().interactions), useBattleArchiveStore.getState(), useInteractionStore.getState().roadBlocks), gameBackupFilename())
      setMessage(catalogRecovery ? 'File di salvataggio scaricato senza il catalogo danneggiato. Scarica separatamente l’originale da recuperare.' : 'File di salvataggio scaricato. Conservalo anche fuori da questo computer.')
      setError(null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Non riesco a scaricare il file di salvataggio. Riprova dal browser.'); setMessage(null) }
  }
  const loadFile = async (file: File | undefined) => {
    const revision = ++fileReadRevision.current
    setPreview(null); setAccepted(false); setError(null); setMessage(null)
    if (!file) return
    if (file.size > MAX_GAME_BACKUP_BYTES) { setError('Il file supera il limite di 5 MB per un file di salvataggio.'); return }
    try {
      const content = await file.text()
      if (fileReadRevision.current !== revision) return
      const result = validateGameBackup(content)
      if (result.ok) setPreview(result.preview)
      else setError(result.error)
    } catch { if (fileReadRevision.current === revision) setError('Non riesco a leggere questo file. La partita attuale resta intatta.') }
  }
  const restore = () => {
    if (!preview || !accepted) return
    ++fileReadRevision.current
    const result = restoreGameBackup(preview)
    if (!result.ok) { setError(result.error); return }
    setPreviousAvailable(true); setPreview(null); setAccepted(false); setError(null)
    setMessage('Partita ripristinata. La partita precedente è conservata nel salvataggio precedente, scaricabile qui sotto.')
  }
  // Audit fase 2: schermata ricomposta con i componenti del design system (tre schede d'azione invece di un vuoto).
  return <section aria-label="Salvataggio della partita" className="pu-backup-screen grid content-start gap-4">
    <header className="grid gap-1">
      <span className="arka-ds-kicker">Progressi della campagna</span>
      <h2 className="arka-ds-title">Salvataggio della partita</h2>
      <p className="arka-ds-text">Salva i progressi di entrambi i giocatori, squadre, deposito, mappe e battaglia. Il ripristino conserva HP e status; i codici QR e le impostazioni del pubblico restano separati.</p>
    </header>
    {catalogRecovery && <ArkaPanel as="div" density="compact" role="alert" className="grid gap-2"><p className="arka-ds-text">Il catalogo interazioni richiede recupero. Il file di salvataggio conserva la campagna e omette quel catalogo; l’originale resta intatto nel browser. Prima di sostituirlo, scaricalo separatamente e recuperalo dall’editor Interazioni.</p>
      <ArkaButton disabled={catalogRecovery.raw === null} onClick={() => {
        try { downloadGameBackup(catalogRecovery.raw!, 'arkamon-interazioni-originale-da-recuperare.json'); setError(null) }
        catch { setError('Non riesco a scaricare il catalogo originale. Non cancellare i dati del browser e riprova.') }
      }}>Scarica originale da recuperare</ArkaButton>
    </ArkaPanel>}
    {backupWarning && <p role="status" className="arka-ds-text">{backupWarning}</p>}
    {recoveryWarnings.length > 0 && <ArkaPanel as="div" density="compact" role="status" className="grid gap-2">
      <p className="arka-ds-card-title">Recupero del salvataggio</p>
      <ul className="arka-ds-text ml-5 list-disc">{recoveryWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      <ArkaButton tone="ghost" onClick={dismissRecovery}>Ho letto gli avvisi</ArkaButton>
    </ArkaPanel>}
    <div className="pu-backup-overview grid gap-4 md:grid-cols-3">
      <ArkaPanel as="article" className="grid content-start gap-3">
        <span className="arka-ds-card-icon" aria-hidden="true"><GameArt id="menu-save" /></span>
        <h3 className="arka-ds-card-title">Scarica la partita</h3>
        <p className="arka-ds-note">Un file con entrambi i giocatori. Conservalo anche fuori da questo computer.</p>
        <ArkaButton tone="primary" onClick={exportCurrent}>Scarica file di salvataggio</ArkaButton>
        {previousAvailable && <ArkaButton onClick={() => {
          const previous = readPreviousGameBackup()
          if (previous) downloadGameBackup(previous, 'Arkamon-partita-precedente.json')
          else { setPreviousAvailable(false); setError('Il salvataggio precedente non è disponibile.') }
        }}>Scarica salvataggio precedente</ArkaButton>}
      </ArkaPanel>
      <ArkaPanel as="article" className="grid content-start gap-3">
        <span className="arka-ds-card-icon" aria-hidden="true"><GameArt id="menu-register" /></span>
        <h3 className="arka-ds-card-title">Importa una partita</h3>
        <p className="arka-ds-note">Vedi un’anteprima prima di sostituire la partita attuale.</p>
        {/* Il selettore nativo mostra testi del browser (anche in inglese): un'etichetta italiana lo sostituisce. */}
        <label className="pu-file-picker arka-ds-button" data-tone="secondary">Scegli un file di salvataggio…
          <input type="file" accept=".json,application/json" aria-label="Importa file di salvataggio" className="sr-only" onChange={(event) => {
            void loadFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''
          }} />
        </label>
      </ArkaPanel>
      <ArkaPanel as="article" className="grid content-start gap-3">
        <span className="arka-ds-card-icon" aria-hidden="true"><GameArt id="menu-diary" /></span>
        <h3 className="arka-ds-card-title">Copie automatiche</h3>
        <p className="arka-ds-note">{copies.length ? 'Ogni copia conserva un punto già valido della campagna. Controlla l’anteprima prima del ripristino.' : 'Nessuna copia automatica ancora: si creano mentre giochi.'}</p>
        {copies.map((copy, index) => <ArkaButton key={copy.createdAt + index} onClick={() => {
          ++fileReadRevision.current
          const result = validateGameBackup(copy.backup)
          setAccepted(false); setError(null); setMessage(null)
          if (result.ok) setPreview(result.preview); else setError(result.error)
        }}>Controlla copia automatica {index + 1}</ArkaButton>)}
      </ArkaPanel>
    </div>
    {error && <p role="alert" className="arka-ds-panel arka-ds-text" data-density="compact">{error}</p>}
    {message && <p role="status" className="arka-ds-text">{message}</p>}
    {preview && <ArkaPanel as="div" className="grid gap-3" aria-label="Anteprima ripristino">
      <h3 className="arka-ds-card-title">Anteprima del salvataggio</h3>
      <p className="arka-ds-note">Creato il {new Date(preview.createdAt).toLocaleString('it-IT')} · formato {preview.version}</p>
      {preview.players.map((player, i) => <p key={i} className="arka-ds-text"><strong>{player.name}</strong>: {player.team} in squadra, {player.deposit} in deposito, {player.coins} monete, {player.defeatedTrainers} allenatori sconfitti. Luogo: {player.location.replace(/_/g, ' ')}.</p>)}
      <p className="arka-ds-text">Schermata: {preview.scene}. {preview.battle ? 'Riprende la battaglia dall’ultimo turno salvato.' : 'Nessuna battaglia in corso.'}</p>
      <p className="arka-ds-text">{preview.interactionCatalog ? `${preview.interactionCatalog.interactions.length} interazioni personalizzate incluse.` : 'Le interazioni configurate su questo computer restano invariate.'}</p>
      {preview.battleArchive && <p className="arka-ds-text">{preview.battleArchive.matches.length} battaglie incluse nell’archivio replay.</p>}
      {preview.warnings.length > 0 && <div className="arka-ds-text"><p className="font-bold">Campi recuperati da controllare prima di continuare:</p>
        <ul className="ml-5 list-disc">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
      <label className="arka-ds-text flex items-start gap-2"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>Confermo la sostituzione della partita attuale{preview.warnings.length ? ' e accetto i recuperi indicati' : ''}. Verrà conservato un salvataggio della partita precedente.</span></label>
      <div className="flex flex-wrap gap-2"><ArkaButton tone="primary" disabled={!accepted} onClick={restore}>Ripristina questa partita</ArkaButton>
        <ArkaButton onClick={() => { ++fileReadRevision.current; setPreview(null); setAccepted(false) }}>Annulla importazione</ArkaButton></div>
    </ArkaPanel>}
  </section>
}
