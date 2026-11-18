import { AnimatedNumber } from '@/motion/ui/AnimatedNumber'
import { useState, type CSSProperties } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getPokemon } from '@/data'
import type { PokemonIstanza, TipoPokemon } from '@/types'
import { assetUrl } from '@/utils/assetUrl'
import { SpatialNavigation } from '@/components/rpg/SpatialNavigation'
import { CreaturePortrait, formatNumber, KitIcon } from '../kit'
import { ReferenceEmblem } from './ReferenceEmblem'
import { GameArt, gameArtForMenu, hasGameArt } from '@/ui-system/GameArt'
import { ProvidedArtwork } from './ProvidedArtwork'
import { GYM_LEADERS, gymMedalArtwork } from './gymMedals'
import type { PlayerUiAuxiliary, PlayerUiScreen } from '../navigation'

interface Props {
  playerId: 1 | 2
  onAuxiliary: (tool: PlayerUiAuxiliary) => void
  onNavigate?: (screen: PlayerUiScreen) => void
  onResume?: () => void
}
const entries: { title: string; icon: string; screen?: PlayerUiScreen; tool?: PlayerUiAuxiliary; resume?: boolean }[] = [
  {title:'Squadra',icon:'icon-team',screen:'squadra'},
  {title:'Arkadex',icon:'icon-arkadex',screen:'arkadex'},
  {title:'Borsa',icon:'icon-bag',screen:'borsa'},
  {title:'Deposito',icon:'icon-deposit',screen:'deposito'},
  {title:'Mappa',icon:'icon-map',resume:true},
  {title:'Diario',icon:'icon-journal',tool:'journal'},
  {title:'Registro',icon:'icon-book',tool:'register'},
  {title:'Salvataggio',icon:'icon-backup',tool:'backup'},
  {title:'Impostazioni',icon:'icon-options',tool:'settings'},
]
const gyms = GYM_LEADERS
const TYPE_ICONS: Record<TipoPokemon, string> = {
  Normale: 'type-normal', Elettro: 'type-electric', Fuoco: 'type-fire', Terra: 'type-earth',
  Acqua: 'type-water', Erba: 'type-grass', Oscurità: 'type-dark', Psico: 'type-psychic',
}
function MedalStrip({ defeated }: { defeated: ReadonlySet<number> }) {
  const earnedCount = gyms.filter(gym => defeated.has(gym.id)).length
  return <div className="ref-medals ref-provided-medals" role="img" aria-label={`${earnedCount} medaglie su ${gyms.length}`}>
    {gyms.map(gym => {
      const earned = defeated.has(gym.id)
      return <span key={gym.id} data-earned={earned} title={`${gym.luogo}: ${earned ? 'ottenuta' : 'da ottenere'}`} aria-hidden="true">
        <ProvidedArtwork id={gymMedalArtwork(gym.id, earned)} />
      </span>
    })}
  </div>
}

/** Ritratto a mezzo busto del lotto 1; senza illustrazione resta l'avatar circolare. */
function TrainerPortrait({ playerId }: { playerId: 1 | 2 }) {
  const id = `portrait-player-${playerId}`
  return hasGameArt(id) ? <GameArt id={id} className="ref-trainer-bust"/> : <img src={assetUrl(`/ui/player${playerId}_avatar.png`)} alt=""/>
}

/** Scudo della Squadra (lotto 1): i compagni veri occupano le sei finestre, 3 colonne × 2 righe. */
function TeamShield({ team }: { team: PokemonIstanza[] }) {
  return <span className="ref-menu-shield" aria-hidden="true">
    <GameArt id="menu-team-shield" className="ref-menu-shield-art"/>
    <span className="ref-menu-shield-panes">{Array.from({ length: 6 }, (_, index) => <span key={index} className="ref-menu-shield-pane">{team[index] && <CreaturePortrait pokemon={team[index]}/>}</span>)}</span>
  </span>
}

/** Fase U6: Gara, Ripresa e Sfide in un cassetto «Altro», come nel mockup (striscia del Game Master pulita). */
function MoreTools({ context, onAuxiliary }: { context: boolean; onAuxiliary: (tool: 'race' | 'recap' | 'challenges') => void }) {
  const [open, setOpen] = useState(false)
  return <div className="ref-menu-more" data-open={open || undefined}>
    <button type="button" className="ref-menu-more-toggle" aria-expanded={open} aria-controls="ref-menu-utilities" onClick={() => setOpen(value => !value)}>
      <KitIcon id="icon-activity"/>Altro<span aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    {open && <div id="ref-menu-utilities" className="ref-menu-utilities" aria-label="Altri strumenti">{([['race','Gara'],['recap','Ripresa'],['challenges','Sfide']] as const).map(([tool,title])=><button key={tool} type="button" aria-label={`Apri ${title}`} disabled={context&&tool!=='challenges'} onClick={()=>onAuxiliary(tool)}><KitIcon id={tool==='challenges'?'icon-challenges':'icon-activity'}/>{title}</button>)}</div>}
  </div>
}

export function ReferenceMainMenu({playerId,onAuxiliary,onNavigate,onResume}:Props) {
  const one = useGameStore(state=>state.giocatore1), two = useGameStore(state=>state.giocatore2)
  const position1 = useGameStore(state=>state.posizione1), position2 = useGameStore(state=>state.posizione2)
  const context = useGameStore(state=>state.challengeContext)
  const player = playerId === 1 ? one : two, other = playerId === 1 ? two : one
  const position = playerId === 1 ? position1 : position2
  const badges = (owner: typeof one) => gyms.filter(gym=>owner.allenatoriSconfitti.has(gym.id)).length
  const medals = (owner: typeof one) => <MedalStrip defeated={owner.allenatoriSconfitti} />
  return <div className="ref-main-menu ref-provided-main-menu">
    <aside className="ref-trainers" aria-label="Allenatori della partita">
      <section className="ref-trainer-card is-primary" aria-label={`Riepilogo della partita di G${playerId}`}>
        <div className="ref-trainer-identity"><div className="ref-trainer-portrait"><TrainerPortrait playerId={playerId}/></div><div className="ref-trainer-copy"><span className="pu-kicker">Allenatore · G{playerId}</span><h2 data-long-name={(player.nome ?? '').length > 14 || undefined}>{player.nome || `Giocatore ${playerId}`}</h2><p><KitIcon id="icon-map"/>{(position.luogo ?? position.mappaId).replace(/_/g,' ')}</p>{medals(player)}<span className="ref-medal-count">Medaglie {badges(player)} / {gyms.length}</span><strong className="ref-trainer-coins"><KitIcon id="item-coin"/><AnimatedNumber value={player.monete} format={formatNumber}/></strong></div></div>
        <div className="ref-trainer-team" aria-label={`Compagni di ${player.nome}`}>{player.squadra.length ? Array.from({ length: 6 }, (_, index) => {
          const pokemon = player.squadra[index]
          if (!pokemon) return <span key={`empty-${index}`} className="ref-team-slot is-empty" aria-hidden="true" />
          const type = getPokemon(pokemon.specieId)?.tipo
          return <span key={pokemon.istanzaId} className="ref-team-slot" title={pokemon.nome} data-type={type}>
            <CreaturePortrait pokemon={pokemon}/>{type && <i className="ref-team-type" aria-hidden="true"><KitIcon id={TYPE_ICONS[type]}/></i>}
          </span>
        }) : <p>Scegli il tuo starter per iniziare il viaggio.</p>}</div>
      </section>
      <section className="ref-trainer-card is-secondary" aria-label={`Riepilogo della partita di G${other.id}`}><div className="ref-trainer-portrait"><TrainerPortrait playerId={other.id}/></div><div><span className="pu-kicker">Allenatore · G{other.id}</span><h2>{other.nome || `Giocatore ${other.id}`}</h2>{medals(other)}<span className="ref-medal-count">Medaglie {badges(other)} / {gyms.length}</span></div></section>
      <footer className="ref-gm-strip">
        <p className="ref-gm-note"><span className="ref-gm-seal" aria-hidden="true"><KitIcon id="icon-activity"/></span><strong>Livio</strong><span>· Game Master</span></p>
        <MoreTools context={!!context} onAuxiliary={onAuxiliary}/>
      </footer>
    </aside>
    <SpatialNavigation columns={3} selectOnFocus={false} className="ref-menu-grid" aria-label="Destinazioni del menù principale">{entries.map((entry,index)=><button data-rpg-item data-ui-id={`service.${entry.tool ?? entry.screen ?? 'map'}`} className="pu-menu-tile ref-menu-tile ref-provided-menu-tile" style={{'--tile-index':index} as CSSProperties} key={entry.title} type="button" aria-label={`Apri ${entry.title}`} disabled={!!context&&entry.tool!=='settings'&&!entry.resume} onClick={()=>entry.tool?onAuxiliary(entry.tool):entry.screen?onNavigate?.(entry.screen):onResume?.()}><span className="ref-menu-card-face"><ProvidedArtwork id="menu-card-normal" className="ref-menu-card-frame"/>{entry.screen === 'squadra' && player.squadra.length > 0 && hasGameArt('menu-team-shield') ? <TeamShield team={player.squadra}/> : entry.screen === 'squadra' && player.squadra.length > 0 ? <span className="ref-menu-companions" aria-hidden="true">{player.squadra.slice(0, 3).map(pokemon => <CreaturePortrait key={pokemon.istanzaId} pokemon={pokemon}/>)}</span> : (gameArtForMenu(entry.icon) ? <GameArt id={gameArtForMenu(entry.icon)!} className="ref-menu-art"/> : <ReferenceEmblem kind={entry.icon}/>)}<h2>{entry.title}</h2></span><span className="ref-menu-glint" aria-hidden="true"/></button>)}</SpatialNavigation>
  </div>
}
