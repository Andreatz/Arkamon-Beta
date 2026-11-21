import { useState } from 'react'
import { ALLENATORI } from '@/data'
import { hasUnlockedSecretLocation, SECRET_LOCATION_ID } from '@/data/secretLocation'
import { useGameStore } from '@/store/gameStore'
import { useInteractionStore } from '@/interactions/interactionStore'
import { collectedGymCount, interactionRequirementMessage, isInteractionComplete } from '@/interactions/runtime'
import { journalLocations, nextJournalObjective } from './journalModel'
import './journal.css'
import { ProvidedArtwork } from '@/player-ui/reference/ProvidedArtwork'
import { gymMedalArtwork } from '@/player-ui/reference/gymMedals'
import { HistoryPagination } from '@/components/ui/HistoryPagination'

export function PlayerJournalPanel({ initialPlayerId }: { initialPlayerId?: 1 | 2 } = {}) {
  const [playerId, setPlayerId] = useState<1 | 2>(() => initialPlayerId ?? useGameStore.getState().giocatoreAttivo)
  const [pages, setPages] = useState({ locations: 0, missions: 0, history: 0 })
  const [openSection, setOpenSection] = useState<'medals' | 'locations' | 'missions' | 'history'>('medals')
  /** Pannello a fisarmonica: un solo pannello aperto; il contenuto dei pannelli chiusi non viene disegnato. */
  const fold = (key: typeof openSection, title: string, meta: string, content: React.ReactNode) => <details className="journal-fold" data-journal-section={key} open={openSection === key}
    onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) setOpenSection(key) }}>
    <summary onClick={(event) => { event.preventDefault(); setOpenSection(key) }}><span>{title}</span><small>{meta}</small></summary>
    {openSection === key && content}
  </details>
  const player1 = useGameStore((s) => s.giocatore1)
  const player2 = useGameStore((s) => s.giocatore2)
  const positions1 = useGameStore((s) => s.posizioniLocali1)
  const positions2 = useGameStore((s) => s.posizioniLocali2)
  const world1 = useGameStore((s) => s.posizione1)
  const world2 = useGameStore((s) => s.posizione2)
  const turn = useGameStore((s) => s.turnoOverworld)
  const active = useGameStore((s) => s.giocatoreAttivo)
  const battle = useGameStore((s) => s.battaglia)
  const progress = useGameStore((s) => s.interactionProgress)
  const league = useGameStore((s) => s.league)
  const interactions = useInteractionStore((s) => s.interactions)
  const state = { ...useGameStore.getState(), giocatore1: player1, giocatore2: player2, posizioniLocali1: positions1,
    posizioniLocali2: positions2, posizione1: world1, posizione2: world2, battaglia: battle, giocatoreAttivo: active, interactionProgress: progress, league }
  const player = playerId === 1 ? player1 : player2
  const world = playerId === 1 ? world1 : world2
  const remaining = turn.giocatoreAttivo === playerId && active === playerId ? turn.azioniRimaste : 0
  const objective = nextJournalObjective(state, playerId, interactions)
  const locations = journalLocations(state, playerId, interactions)
  const log = progress[playerId === 1 ? 'log1' : 'log2']
  const gyms = ALLENATORI.filter((trainer) => trainer.tipo === 'Capopalestra')
  const visibleInteractions = interactions.filter((entry) => entry.enabled && (entry.mapId !== SECRET_LOCATION_ID || hasUnlockedSecretLocation(player)))
  // Audit fase 3: niente barra di sotto-schede. Le quattro sezioni sono una sotto l'altra come
  // pannelli a fisarmonica (uno aperto alla volta), così il Diario resta in una sola schermata.
  const PAGE_SIZE = { locations: 4, missions: 2, history: 2 } as const
  const slice = (section: 'locations' | 'missions' | 'history', count: number) => {
    const page = Math.min(pages[section], Math.max(0, Math.ceil(count / PAGE_SIZE[section]) - 1))
    return { page, start: page * PAGE_SIZE[section] }
  }
  const locationsPage = slice('locations', locations.length)
  const missionsPage = slice('missions', visibleInteractions.length)
  const historyPage = slice('history', log.length)
  const pager = (section: 'locations' | 'missions' | 'history', page: number, count: number, label: string) => count > PAGE_SIZE[section]
    ? <HistoryPagination page={page} count={count} pageSize={PAGE_SIZE[section]} onPageChange={next => setPages(previous => ({ ...previous, [section]: next }))} label={label} /> : null
  return <section className="player-journal" aria-label="Diario dei giocatori">
    <div className="journal-overview">
    <h2>Diario della partita</h2>
    <label>Giocatore del diario<select value={playerId} onChange={(e) => setPlayerId(Number(e.target.value) as 1 | 2)}>
      <option value={1}>G1 · {player1.nome || 'Giocatore 1'}</option><option value={2}>G2 · {player2.nome || 'Giocatore 2'}</option>
    </select></label>
    <div className="journal-summary"><strong>{player.nome || `Giocatore ${playerId}`}</strong><span>{world.luogo?.replace(/_/g, ' ') ?? 'Posizione non definita'} · {player.monete} monete</span>
      <span>{collectedGymCount(player)} / {gyms.length} medaglie · {player.allenatoriSconfitti.size} allenatori sconfitti · {player.cespugliVisitati.size} cespugli esplorati</span>
      <span>{remaining} {remaining === 1 ? 'azione disponibile' : 'azioni disponibili'}{turn.giocatoreAttivo !== playerId || active !== playerId ? ' · attendi il tuo turno' : ''}</span>
      <small>Due movimenti oppure un movimento e un’interazione. Le posizioni e i progressi dei due giocatori sono indipendenti.</small>
    </div>
    <div className="journal-objective"><strong>Prossimo obiettivo suggerito: {objective.title}</strong><p>{objective.detail}</p>{objective.nextStep && <p>Prossimo luogo lungo le strade: {objective.nextStep.replace(/_/g, ' ')}.</p>}</div>
    </div><div className="journal-reading">
    {fold('medals', 'Medaglie', `${gyms.filter((trainer) => player.allenatoriSconfitti.has(trainer.id)).length} di ${gyms.length}`, <section aria-label="Medaglie" className="journal-section-content"><h3>Medaglie</h3><ul className="journal-medals">{gyms.map((trainer) => {
      const earned = player.allenatoriSconfitti.has(trainer.id)
      // Medaglia dipinta della palestra; l'alloggio vuoto finché non è ottenuta.
      return <li key={trainer.id} data-earned={earned}><ProvidedArtwork id={gymMedalArtwork(trainer.id, earned)} className="journal-medal-art" aria-hidden="true" /><span><strong>{trainer.luogo}</strong> · {trainer.nome}<small>{earned ? 'Ottenuta' : 'Da ottenere'}</small></span></li>
    })}</ul></section>)}
    {fold('locations', 'Luoghi e attività', `${locations.length} luoghi`, <section aria-label="Luoghi e attività" className="journal-section-content"><h3>Luoghi e attività</h3><p>I luoghi documentati derivano da posizioni locali, allenatori e cespugli del salvataggio; i salvataggi precedenti non contengono uno storico di ogni passaggio.</p>
      <div className="journal-locations">{locations.slice(locationsPage.start, locationsPage.start + PAGE_SIZE.locations).map((entry) => <article key={entry.mapId}><strong>{entry.mapId.replace(/_/g, ' ')}{entry.current ? ' · posizione attuale' : entry.documented ? ' · documentato' : ''}</strong>
        <span>Allenatori {entry.trainersCompleted}/{entry.trainersTotal} · Cespugli {entry.bushesCompleted}/{entry.bushesTotal} · Tappe {entry.interactionsCompleted}/{entry.interactionsTotal}</span>
      </article>)}</div>
      {pager('locations', locationsPage.page, locations.length, 'Pagine dei luoghi del diario')}
    </section>)}
    {fold('missions', 'Tappe e missioni configurate', `${visibleInteractions.length} tappe`, <section aria-label="Tappe e missioni configurate" className="journal-section-content"><h3>Tappe e missioni configurate</h3>
      {!visibleInteractions.length && <p>La regia non ha ancora definito tappe disponibili sui pallini. Le attività esistenti restano disponibili.</p>}
      <ul>{visibleInteractions.slice(missionsPage.start, missionsPage.start + PAGE_SIZE.missions).map((entry) => {
        const done = !entry.repeatable && isInteractionComplete(progress, entry, playerId)
        const reason = done ? null : interactionRequirementMessage(state, entry, playerId)
        return <li key={entry.id}><strong>{done ? '✓' : reason ? '○' : '→'} {entry.title}</strong><span>{entry.mapId.replace(/_/g, ' ')} · {entry.scope === 'shared' ? 'completamento condiviso' : 'progressi individuali'}{entry.repeatable ? ' · ripetibile' : ''}</span>
          {reason && <small>{reason}</small>}{entry.requirements.completedInteractions.length > 0 && <small>Tappe precedenti: {entry.requirements.completedInteractions.map((id) => interactions.find((item) => item.id === id)?.title ?? id).join(', ')}.</small>}
        </li>
      })}</ul>
      {pager('missions', missionsPage.page, visibleInteractions.length, 'Pagine delle tappe del diario')}
    </section>)}
    {fold('history', 'Cronaca delle interazioni', `${log.length} voci`, <section aria-label="Cronaca delle interazioni" className="journal-section-content"><h3>Cronaca delle interazioni</h3>{!log.length ? <p>Nessuna interazione configurata completata da questo giocatore.</p> : <ol>{[...log].reverse().slice(historyPage.start, historyPage.start + PAGE_SIZE.history).map((entry, index) => <li key={`${entry.interactionId}-${index}`}><strong>{entry.title} · {entry.mapId.replace(/_/g, ' ')}</strong><p>{entry.message}</p></li>)}</ol>}
      {pager('history', historyPage.page, log.length, 'Pagine della cronaca del diario')}
    </section>)}
    </div>
  </section>
}

export { TurnSummary } from './TurnSummary'
