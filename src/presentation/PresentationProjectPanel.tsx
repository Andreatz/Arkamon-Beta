import { useRef, useState } from 'react'
import { capturePresentationProject, exportPresentationProject, importPresentationProject, presentationSummary, usePresentationProject } from './presentationProject'
import type { UiDesignDocument } from '@/ui-studio/types'
import './presentationProject.css'

export function PresentationProjectPanel({ design, onApplied }: { design?: UiDesignDocument; onApplied?: () => void }) {
  const { draft, applied, previous, error, stage, apply, rollback, discard } = usePresentationProject()
  const [name, setName] = useState('Arkamon · regia visiva')
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const run = async (action: () => Promise<void>) => { setBusy(true); setMessage(''); try { await action() } catch (e) { setMessage(e instanceof Error ? e.message : 'Operazione non riuscita.') } finally { setBusy(false) } }
  const summary = presentationSummary(draft), current = presentationSummary(applied)
  return <section className="arka-visual-project" aria-label="Progetto visivo">
    <h3>Progetto visivo</h3><p>UI, font, sfondi, menù, suoni e VFX in un pacchetto. La campagna, gli inventari e le credenziali restano separati.</p>
    <label>Nome del progetto<input value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
    <div className="arka-project-state"><strong>Applicato</strong><p>{applied ? `${applied.name} · ${current!.screens} layout, ${current!.effects} VFX, ${current!.sounds} suoni` : 'Impostazioni attuali del gioco'}</p></div>
    <div className="arka-project-state" data-draft={!!draft}><strong>Bozza</strong><p>{draft ? `${draft.name} · ${summary!.screens} layout, ${summary!.effects} VFX, ${summary!.sounds} suoni` : 'Nessuna bozza pronta'}</p></div>
    <p>Acquisisci {design ? 'la bozza UI corrente' : 'il layout attualmente applicato nello Studio'} e le bozze dei laboratori audio/VFX. Il confronto sottostante riporta cosa cambierà prima di applicare.</p>
    {draft && <ul className="arka-project-comparison"><li>Layout: {current?.screens ?? 0} → {summary!.screens}</li><li>Associazioni VFX: {current?.effects ?? 0} → {summary!.effects}</li><li>Associazioni audio: {current?.sounds ?? 0} → {summary!.sounds}</li><li>Font, sfondi e menù: {JSON.stringify(draft.theme) === JSON.stringify(applied?.theme) ? 'invariati rispetto al pacchetto applicato' : 'inclusi nella bozza'}</li></ul>}
    <div className="arka-project-actions"><button disabled={busy || !name.trim()} onClick={() => void run(async () => { if (stage(await capturePresentationProject(name, design))) setMessage('Bozza acquisita e salvata. Il gioco non è stato modificato.') })}>Acquisisci impostazioni e bozze</button>
      <button disabled={busy} onClick={() => importRef.current?.click()}>Importa pacchetto</button>
      <button disabled={busy || (!draft && !applied)} onClick={() => void run(async () => { const text = await exportPresentationProject((draft ?? applied)!); const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'arkamon-progetto-visivo.json'; a.click(); URL.revokeObjectURL(url); setMessage('Esportazione completa: immagini e font importati inclusi; audio/VFX collegati ai media locali del gioco.') })}>Esporta pacchetto</button>
      <button className="arka-project-primary" disabled={busy || !draft} onClick={() => { if (apply()) { onApplied?.(); setMessage('Progetto applicato e salvato. Disponibile il ripristino precedente.') } }}>Applica progetto al gioco</button>
      <button disabled={busy || !draft} onClick={() => { if (discard()) setMessage('Bozza scartata. Il progetto applicato non cambia.') }}>Scarta bozza</button>
      <button disabled={busy || !previous} onClick={() => { if (rollback()) { onApplied?.(); setMessage('Progetto precedente ripristinato. La campagna non è stata modificata.') } }}>Ripristina progetto precedente</button></div>
    <p className="arka-project-note">Il pacchetto comprende immagini/font caricati nello Studio. I grandi media audio/VFX già presenti nel gioco restano riferimenti: questa funzione non crea una release degli asset.</p>
    <input ref={importRef} type="file" accept="application/json,.json" aria-label="Importa progetto visivo JSON" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void run(async () => { if (file.size > 95 * 1024 * 1024) throw new Error('Pacchetto troppo grande.'); const project = await importPresentationProject(await file.text()); if (stage(project)) { setName(project.name); setMessage('Pacchetto importato nella bozza. Controlla e applica per usarlo nel gioco.') } }) }} hidden />
    {(error || message) && <p role={error ? 'alert' : 'status'}>{error ?? message}</p>}
  </section>
}
