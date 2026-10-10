import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { audienceConnectionIssue, audienceServiceWarning, normalizeAudienceDuration } from './audienceApi'
import { AudienceQrCode, downloadAudienceQr } from './AudienceQrCode'
import { audienceErrorMessage, useAudienceStore } from './useAudienceStore'
import './audience.css'

export function AdminAudiencePanel() {
  const { serviceUrl, session, enabled, durationSeconds, snapshot, connectionStatus, error, disconnectFailed } = useAudienceStore()
  const [address, setAddress] = useState(serviceUrl)
  const [password, setPassword] = useState('')
  const [durationDraft, setDurationDraft] = useState(String(durationSeconds))
  const [feedback, setFeedback] = useState<string | null>(null)
  const busy = connectionStatus === 'connecting'
  const open = snapshot?.round?.status === 'open'
  const warning = audienceServiceWarning(session?.serviceUrl ?? address)
  const connectionIssue = audienceConnectionIssue(session?.serviceUrl ?? address)

  useEffect(() => { setAddress(serviceUrl) }, [serviceUrl])
  useEffect(() => { setDurationDraft(String(durationSeconds)) }, [durationSeconds])
  useEffect(() => {
    if (!session) return
    void useAudienceStore.getState().refreshSnapshot()
    const timer = setInterval(() => { void useAudienceStore.getState().refreshSnapshot() }, 5000)
    return () => clearInterval(timer)
  }, [session?.sessionId])

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const secret = password
    setPassword('')
    setFeedback(null)
    try {
      useAudienceStore.getState().configureService(address)
      await useAudienceStore.getState().connect(secret)
    } catch (cause) { setFeedback(audienceErrorMessage(cause)) }
  }
  async function copy(url: string, label: string) {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setFeedback(`Link ${label} copiato.`)
    } catch { setFeedback('Copia il link dal campo sotto il codice QR.') }
  }

  return (
    <div className="audience-admin">
      <div>
        <h3>Il pubblico sceglie le mosse</h3>
        <p>Le persone inquadrano il codice QR dal telefono e votano la prossima mossa dell’allenatore rivale. Vince la mossa con più voti.</p>
      </div>
      <form onSubmit={(event) => { void connect(event) }} className="audience-connect-form">
        <label>
          Sito per il collegamento
          <input type="url" required value={address} disabled={!!session || busy} onChange={(event) => setAddress(event.target.value)} placeholder="https://il-tuo-sito.example" autoComplete="url" spellCheck={false} />
        </label>
        <p className="audience-hint">Usa l’indirizzo del sito Arkanight che ospita la votazione. Deve essere raggiungibile anche dai telefoni.</p>
        {warning ? <p className="audience-warning" role="note">{warning}</p> : null}
        <label>
          Password della regia del sito
          <input type="password" required value={password} disabled={busy || open} onChange={(event) => setPassword(event.target.value)} autoComplete="off" />
        </label>
        <p className="audience-hint">La password serve ad avviare il collegamento e viene svuotata subito. Non compare nei codici QR.</p>
        <div className="audience-actions">
          <button type="submit" disabled={busy || open || !!connectionIssue}>{busy ? 'Collegamento in corso…' : session ? 'Avvia nuovo collegamento' : 'Avvia collegamento'}</button>
          {session ? <button type="button" disabled={busy} onClick={() => { void useAudienceStore.getState().disconnect() }}>Chiudi collegamento</button> : null}
        </div>
        {session ? <p className="audience-hint">Un nuovo collegamento sostituisce quello attuale: dovrai condividere i nuovi codici QR.</p> : null}
        {open ? <p className="audience-hint">La votazione è in corso. Puoi concluderla dalla battaglia oppure disattivare il voto del pubblico per usare la scelta automatica.</p> : null}
      </form>
      <p className="audience-connection" role="status">{connectionStatus === 'connected' ? 'Pubblico collegato' : connectionStatus === 'connecting' ? 'Connessione in corso…' : connectionStatus === 'error' ? 'Controlla il collegamento' : 'Pubblico non collegato'}</p>
      {error ? <p className="audience-error" role="alert">{error}</p> : null}
      {session && disconnectFailed && !enabled ? <div className="audience-local-disconnect">
        <p className="audience-hint">Se il sito resta irraggiungibile, puoi scollegare questo computer e usare un altro indirizzo. I vecchi QR resteranno attivi sul sito fino alla scadenza della sessione.</p>
        <button type="button" onClick={() => useAudienceStore.getState().forgetLocalSession()}>Scollega questo computer</button>
      </div> : null}
      {feedback ? <p className="audience-feedback" role="status">{feedback}</p> : null}
      <div className="audience-settings">
        <label className="audience-toggle">
          <input type="checkbox" checked={enabled} disabled={!session || busy} onChange={(event) => useAudienceStore.getState().setEnabled(event.target.checked)} />
          Fai scegliere le mosse al pubblico
        </label>
        <label>
          Tempo per votare
          <span className="audience-duration"><input aria-label="Secondi per votare" type="number" min={5} max={120} step={1} value={durationDraft} disabled={open} onChange={(event) => {
            setDurationDraft(event.target.value)
            const value = Number(event.target.value)
            if (Number.isInteger(value) && value >= 5 && value <= 120) useAudienceStore.getState().setDuration(value)
          }} onBlur={() => {
            const value = normalizeAudienceDuration(durationDraft.trim() ? Number(durationDraft) : 15)
            useAudienceStore.getState().setDuration(value)
            setDurationDraft(String(value))
          }} /> secondi</span>
        </label>
        <p className="audience-hint">Da 5 a 120 secondi. In caso di parità viene estratta una delle mosse più votate. Senza voti viene usata la scelta automatica. Le mosse supreme e gli Arkamon selvatici non partecipano alla votazione.</p>
      </div>
      {session ? (
        <div className="audience-invitations">
          {([
            { channel: 'npc', title: 'Allenatori NPC', label: 'NPC' },
            { channel: 'boss', title: 'Capipalestra e PvP', label: 'Capipalestra e PvP' },
          ] as const).map(({ channel, title, label }) => (
            <section className="audience-invitation" key={channel}>
              <h4>{title}</h4>
              <p>{snapshot?.participants[channel] ?? 0} persone collegate</p>
              <AudienceQrCode url={session.joinUrls[channel]} label={`Codice QR ${title}`} />
              <div className="audience-actions">
                <button type="button" onClick={() => { void copy(session.joinUrls[channel], label) }}>Copia link</button>
                <button type="button" onClick={() => { void downloadAudienceQr(session.joinUrls[channel], `arkamon-pubblico-${channel}.png`).catch(() => setFeedback('Non riesco a scaricare il codice QR. Puoi condividere il link.')) }}>Scarica QR</button>
              </div>
              <label>Link da condividere<input aria-label={`Link ${title}`} className="audience-share-link" readOnly value={session.joinUrls[channel]} onFocus={(event) => event.target.select()} /></label>
            </section>
          ))}
        </div>
      ) : <p className="audience-hint">Dopo il collegamento compariranno due codici QR distinti: uno per gli NPC e uno per Capipalestra e PvP. Gli stessi codici restano validi per tutte le votazioni del collegamento.</p>}
    </div>
  )
}
