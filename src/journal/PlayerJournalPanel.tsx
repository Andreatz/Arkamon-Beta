import { useState } from 'react'
import { ALLENATORI } from '@/data'
import { hasUnlockedSecretLocation, SECRET_LOCATION_ID } from '@/data/secretLocation'
import { useGameStore } from '@/store/gameStore'
import { useInteractionStore } from '@/interactions/interactionStore'
import { collectedGymCount, interactionRequirementMessage, isInteractionComplete } from '@/interactions/runtime'
import { journalLocations, nextJournalObjective } from './journalModel'
import './journal.css'

export function PlayerJournalPanel({ initialPlayerId }: { initialPlayerId?: 1 | 2 } = {}) {
  const [playerId, setPlayerId] = useState<1 | 2>(() => initialPlayerId ?? useGameStore.getState().giocatoreAttivo)
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
  const interactions = useInteractionStore((s) => s.interactions)
  const state = { ...useGameStore.getState(), giocatore1: player1, giocatore2: player2, posizioniLocali1: positions1,
    posizioniLocali2: positions2, posizione1: world1, posizione2: world2, battaglia: battle, giocatoreAttivo: active, interactionProgress: progress }
  const player = playerId === 1 ? player1 : player2
  const world = playerId === 1 ? world1 : world2
  const remaining = turn.giocatoreAttivo === playerId && active === playerId ? turn.azioniRimaste : 0
  const objective = nextJournalObjective(state, playerId, interactions)
  const locations = journalLocations(state, playerId, interactions)
  const log = progress[playerId === 1 ? 'log1' : 'log2']
  const gyms = ALLENATORI.filter((trainer) => trainer.tipo === 'Capopalestra')
  const visibleInteractions = interactions.filter((entry) => entry.enabled && (entry.mapId !== SECRET_LOCATION_ID || hasUnlockedSecretLocation(player)))
  return <section className="player-journal" aria-label="Diario dei giocatori">
    <h2>Diario della partita</h2>
    <label>Giocatore del diario<select value={playerId} onChange={(e) => setPlayerId(Number(e.target.value) as 1 | 2)}>
      <option value={1}>G1 · {player1.nome || 'Giocatore 1'}</option><option value={2}>G2 · {player2.nome || 'Giocatore 2'}</option>
    </select></label>
    <div className="journal-summary"><strong>{player.nome || `Giocatore ${playerId}`}</strong><span>{world.luogo?.replace(/_/g, ' ') ?? 'Posizione non definita'} · {player.monete} monete</span>
      <span>{collectedGymCount(player)} / {gyms.length} medaglie · {player.allenatoriSconfitti.size} allenatori sconfitti · {player.cespugliVisitati.size} cespugli esplorati</span>
      <span>{remaining} azioni disponibili{turn.giocatoreAttivo !== playerId || active !== playerId ? ' · attendi il tuo turno' : ''}</span>
      <small>Due movimenti oppure un movimento e un’interazione. Le posizioni e i progressi dei due giocatori sono indipendenti.</small>
    </div>
    <div className="journal-objective"><strong>Prossimo obiettivo suggerito: {objective.title}</strong><p>{objective.detail}</p>{objective.nextStep && <p>Prossimo luogo lungo le strade: {objective.nextStep.replace(/_/g, ' ')}.</p>}</div>
    <details open><summary>Medaglie</summary><ul>{gyms.map((trainer) => <li key={trainer.id}>{player.allenatoriSconfitti.has(trainer.id) ? '✓' : '○'} {trainer.luogo} · {trainer.nome}</li>)}</ul></details>
    <details><summary>Luoghi e attività</summary><p>I luoghi documentati derivano da posizioni locali, allenatori e cespugli del salvataggio; i salvataggi precedenti non contengono uno storico di ogni passaggio.</p>
      <div className="journal-locations">{locations.map((entry) => <article key={entry.mapId}><strong>{entry.mapId.replace(/_/g, ' ')}{entry.current ? ' · posizione attuale' : entry.documented ? ' · documentato' : ''}</strong>
        <span>Allenatori {entry.trainersCompleted}/{entry.trainersTotal} · Cespugli {entry.bushesCompleted}/{entry.bushesTotal} · Tappe {entry.interactionsCompleted}/{entry.interactionsTotal}</span>
      </article>)}</div>
    </details>
    <details open><summary>Tappe e missioni configurate</summary>
      {!visibleInteractions.length && <p>La regia non ha ancora definito tappe disponibili sui pallini. Le attività esistenti restano disponibili.</p>}
      <ul>{visibleInteractions.map((entry) => {
        const done = !entry.repeatable && isInteractionComplete(progress, entry, playerId)
        const reason = done ? null : interactionRequirementMessage(state, entry, playerId)
        return <li key={entry.id}><strong>{done ? '✓' : reason ? '○' : '→'} {entry.title}</strong><span>{entry.mapId.replace(/_/g, ' ')} · {entry.scope === 'shared' ? 'completamento condiviso' : 'progressi individuali'}{entry.repeatable ? ' · ripetibile' : ''}</span>
          {reason && <small>{reason}</small>}{entry.requirements.completedInteractions.length > 0 && <small>Tappe precedenti: {entry.requirements.completedInteractions.map((id) => interactions.find((item) => item.id === id)?.title ?? id).join(', ')}.</small>}
        </li>
      })}</ul>
    </details>
    <details><summary>Cronaca delle interazioni</summary>{!log.length ? <p>Nessuna interazione configurata completata da questo giocatore.</p> : <ol>{[...log].reverse().map((entry, index) => <li key={`${entry.interactionId}-${index}`}><strong>{entry.title} · {entry.mapId.replace(/_/g, ' ')}</strong><p>{entry.message}</p></li>)}</ol>}</details>
  </section>
}

export { TurnSummary } from './TurnSummary'
