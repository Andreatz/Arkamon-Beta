import { useMemo } from 'react'
import { ALLENATORI, POKEMON_BASE } from '@/data'
import { deriveArkadexProgress } from '@/arkadex/arkadexModel'
import { getBackground } from '@/data/backgrounds'
import { useGameStore } from '@/store/gameStore'
import { CreaturePortrait, KitButton, KitFrame, KitIcon, KitPanel, formatNumber } from './kit'
import type { PlayerUiAuxiliary, PlayerUiScreen } from './navigation'

interface MenuScreenProps {
  playerId: 1 | 2
  onNavigate: (screen: PlayerUiScreen) => void
  onAuxiliary: (tool: PlayerUiAuxiliary) => void
  onResume: () => void
}
const tiles: { id: PlayerUiScreen | 'challenges'; title: string; description: string; icon: string }[] = [
  { id: 'squadra', title: 'Squadra', description: 'Gestisci i tuoi compagni', icon: 'icon-team' },
  { id: 'deposito', title: 'Deposito', description: 'Organizza le tue riserve', icon: 'icon-box' },
  { id: 'arkadex', title: 'Arkadex', description: 'Ritrova ogni forma scoperta', icon: 'icon-book' },
  { id: 'analisi', title: 'Analisi', description: 'Mosse, crescita e condizioni', icon: 'icon-analysis' },
  { id: 'borsa', title: 'Borsa', description: 'Cure e strumenti di viaggio', icon: 'icon-bag' },
  { id: 'challenges', title: 'Sfide', description: 'Seed e Fanta-Team Builder', icon: 'icon-activity' },
]
const sceneNames: Record<string, string> = { titolo: 'Titolo', laboratorio: 'Laboratorio', 'mappa-principale': 'Mappa principale', 'mappa-griglia': 'Mappa locale', citta: 'Città', percorso: 'Percorso', palestra: 'Palestra', 'centro-pokemon': 'Centro Pokémon', battaglia: 'Battaglia', deposito: 'Deposito', squadra: 'Squadra', evoluzione: 'Evoluzione' }

export function MenuScreen({ playerId, onNavigate, onAuxiliary, onResume }: MenuScreenProps) {
  const one = useGameStore(state => state.giocatore1)
  const two = useGameStore(state => state.giocatore2)
  const position1 = useGameStore(state => state.posizione1)
  const position2 = useGameStore(state => state.posizione2)
  const active = useGameStore(state => state.giocatoreAttivo)
  const turn = useGameStore(state => state.turnoOverworld)
  const battle = useGameStore(state => state.battaglia)
  const scene = useGameStore(state => state.scenaCorrente)
  const savedArkadex = useGameStore(state => state.arkadex)
  const context = useGameStore(state => state.challengeContext)
  const player = playerId === 1 ? one : two
  const position = playerId === 1 ? position1 : position2
  const progress = useMemo(() => deriveArkadexProgress(savedArkadex, { giocatore1: one, giocatore2: two, giocatoreAttivo: active, battaglia: battle }), [savedArkadex, one, two, active, battle])
  const discovered = progress[playerId === 1 ? 'seen1' : 'seen2'].length
  const obtained = progress[playerId === 1 ? 'caught1' : 'caught2'].length
  const gyms = ALLENATORI.filter(trainer => trainer.tipo === 'Capopalestra')
  const gymCount = gyms.filter(trainer => player.allenatoriSconfitti.has(trainer.id)).length
  const npcCount = ALLENATORI.filter(trainer => trainer.tipo === 'NPC' && player.allenatoriSconfitti.has(trainer.id)).length
  const location = scene.scena === 'titolo' ? 'Prima dell’avventura' : scene.scena === 'laboratorio' ? 'Laboratorio' : (position.luogo ?? position.mappaId).replace(/_/g, ' ')
  const background = position.luogo ? getBackground(position.luogo) : null
  const actions = active === playerId && turn.giocatoreAttivo === playerId ? turn.azioniRimaste : 0

  return <div className="pu-menu-layout">
    <div className="pu-menu-grid">{tiles.map((tile, index) => <button type="button" key={tile.id} className={`pu-menu-tile ${index === 0 ? 'is-featured' : ''}`}
      aria-label={`Apri ${tile.title}`} disabled={!!context && (tile.id === 'deposito' || tile.id === 'borsa')}
      onClick={() => tile.id === 'challenges' ? onAuxiliary('challenges') : onNavigate(tile.id)}>
      <KitFrame id={index === 0 ? 'panel-wide' : 'panel-medium'} /><KitIcon id={tile.icon} />
      <span className="pu-tile-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div><h2>{tile.title}</h2><p>{tile.description}</p></div>
    </button>)}</div>

    <KitPanel className="pu-journey" aria-label={`Riepilogo della partita di G${playerId}`}>
      <span className="pu-kicker">La tua avventura</span><h2>{player.squadra.length ? 'Il viaggio continua' : 'L’avventura ti aspetta'}</h2>
      <div className="pu-journey-scene">{background && scene.scena !== 'titolo' && <img src={background} alt="" />}<strong>{location}</strong></div>
      {!player.squadra.length && <p className="pu-empty-copy">Scegli il tuo starter nel laboratorio per iniziare. Ogni giocatore ha una squadra, un deposito e scoperte indipendenti.</p>}
      <dl className="pu-summary">
        <div><dt>Turno attuale</dt><dd>G{active} · {actions} azioni per G{playerId}</dd></div>
        <div><dt>Scoperte</dt><dd>{discovered} / {POKEMON_BASE.length}</dd></div>
        <div><dt>Squadra</dt><dd>{player.squadra.length} / 6</dd></div>
        <div><dt>Deposito</dt><dd>{Object.keys(player.deposito).length} Arkamon</dd></div>
      </dl>
      <div className="pu-gym-progress"><span className="pu-kicker">Medaglie delle palestre · {gymCount} / {gyms.length}</span>
        <div className="pu-gym-badges" aria-label="Medaglie ottenute">{gyms.map(gym => <span key={gym.id} className={player.allenatoriSconfitti.has(gym.id) ? 'earned' : ''}
          title={`${gym.luogo} · ${player.allenatoriSconfitti.has(gym.id) ? 'ottenuta' : 'da ottenere'}`} aria-label={`${gym.luogo}: ${player.allenatoriSconfitti.has(gym.id) ? 'medaglia ottenuta' : 'medaglia da ottenere'}`}>✦</span>)}</div>
      </div>
      <p className="pu-muted">{npcCount} allenatori NPC sconfitti · {obtained} specie ottenute · {formatNumber(player.monete)} monete</p>
      <div className="pu-mini-team" aria-label={`Squadra di G${playerId}`}>{player.squadra.map(pokemon => <span key={pokemon.istanzaId} title={`${pokemon.nome} · Lv. ${pokemon.livello}`}><CreaturePortrait pokemon={pokemon} /></span>)}</div>
      <p className="pu-muted">Scena attuale: {sceneNames[scene.scena] ?? scene.scena}{battle ? ' · scontro in corso' : ''}.</p>
      <div className="pu-journey-actions">
        <KitButton onClick={() => onAuxiliary('match')} aria-label="Consulta il registro del match" disabled={!!context}><KitIcon id="icon-book" />Registro del match</KitButton>
        <KitButton onClick={() => onAuxiliary('backup')} aria-label="Gestisci backup" disabled={!!context}><KitIcon id="icon-box" />Backup della partita</KitButton>
        <KitButton active onClick={onResume} aria-label="Riprendi il viaggio"><KitIcon id="icon-home" />Riprendi il viaggio</KitButton>
      </div>
    </KitPanel>
  </div>
}
