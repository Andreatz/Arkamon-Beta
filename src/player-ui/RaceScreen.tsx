import { useGameStore } from '@/store/gameStore'
import { currentRaceProgress } from '@/readiness/readinessModel'
import { KitPanel } from './kit'

export function RaceScreen({ recap = false }: { recap?: boolean }) {
  const game = useGameStore()
  const progress = currentRaceProgress(game)
  const active = progress.find(player => player.id === game.giocatoreAttivo)!
  return <section className="pu-race-screen" aria-label={recap ? 'Ripresa della sessione' : 'Situazione della gara'}>
    <p role="status">Turno di {active.name} · {game.turnoOverworld.azioniRimaste} azioni disponibili{game.battaglia ? ' · battaglia in corso' : ''}.</p>
    <div className="pu-race-cards">{progress.map(player => <KitPanel key={player.id} aria-label={`Gara di ${player.name}`}>
      <h2>{player.name} · G{player.id}</h2><p>{player.place.replace(/_/g, ' ')}</p>
      <dl><div><dt>Medaglie</dt><dd>{player.badges} / {player.totalBadges}</dd></div>
        <div><dt>Lega</dt><dd>{player.leagueStages} / {player.leagueTotal}</dd></div>
        <div><dt>Squadra</dt><dd>{player.team} / 6</dd></div></dl>
      <p>{player.leagueStatus === 'running' ? 'Serie della Lega in corso' : player.leagueStatus === 'completed' ? 'Lega completata' : player.leagueStatus === 'defeated' ? 'Ultimo tentativo della Lega interrotto' : 'Viaggio verso la Lega'}</p>
    </KitPanel>)}</div>
    {game.league.winner && <p className="pu-race-winner">Campione della regione: {game.league.winner.name}</p>}
    {recap && <section aria-label="Ultimi eventi della sessione"><h2>Da dove riprendiamo</h2>
      {game.matchLog.events.length ? <ol className="pu-recap-events">{game.matchLog.events.slice(-6).reverse().map(event => <li key={event.id}>
        <strong>{event.title}</strong><time dateTime={new Date(event.at).toISOString()}>{new Date(event.at).toLocaleString('it-IT')}</time><p>{event.message}</p>
      </li>)}</ol> : <p>Nessun evento registrato. I progressi attuali sono indicati qui sopra; le azioni precedenti non vengono ricostruite.</p>}
    </section>}
  </section>
}
