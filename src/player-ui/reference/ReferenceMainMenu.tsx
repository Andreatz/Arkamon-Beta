import { AnimatedNumber } from '@/motion/ui/AnimatedNumber'
import type { CSSProperties } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ALLENATORI, getPokemon } from '@/data'
import { gymMedalTrack, SECRET_LOCATION_GYM_IDS } from '@/data/secretLocation'
import type { TipoPokemon } from '@/types'
import { assetUrl } from '@/utils/assetUrl'
import { SpatialNavigation } from '@/components/rpg/SpatialNavigation'
import { CreaturePortrait, formatNumber, KitIcon } from '../kit'
import { ReferenceEmblem } from './ReferenceEmblem'
import { ProvidedArtwork } from './ProvidedArtwork'
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
const gyms = ALLENATORI.filter(trainer => trainer.tipo === 'Capopalestra')
const medalByType: Record<TipoPokemon, string> = {
  Normale: 'medal-normal', Erba: 'medal-grass', Acqua: 'medal-water', Elettro: 'medal-electric',
  Fuoco: 'medal-fire', Terra: 'medal-earth', Oscurità: 'medal-dark', Psico: 'medal-psychic',
}
const historicalMedalTypes: Partial<Record<number, TipoPokemon>> = {
  203: 'Acqua', 302: 'Elettro', 303: 'Terra', 305: 'Acqua', 306: 'Fuoco', 307: 'Psico', 309: 'Fuoco', 311: 'Oscurità',
}
const gymById = new Map(gyms.map((gym) => [gym.id, gym]))
const gymMedalArtwork = new Map(gyms.map(gym => {
  const types = new Map<TipoPokemon, number>()
  for (const member of gym.squadra) {
    const species = getPokemon(member.pokemonId)
    if (species) types.set(species.tipo, (types.get(species.tipo) ?? 0) + 1)
  }
  const dominantType = historicalMedalTypes[gym.id] ?? [...types].sort((a, b) => b[1] - a[1])[0]?.[0]
  return [gym.id, dominantType ? medalByType[dominantType] : 'medal-empty'] as const
}))

function MedalStrip({ defeated }: { defeated: ReadonlySet<number> }) {
  const track = gymMedalTrack(defeated)
  const earnedCount = track.filter((id) => defeated.has(id)).length
  return <div className="ref-medals ref-provided-medals" role="img" aria-label={`${earnedCount} medaglie su ${track.length}`}>
    {track.map(id => {
      const earned = defeated.has(id)
      return <span key={id} data-earned={earned} title={`${gymById.get(id)?.luogo}: ${earned ? 'ottenuta' : 'da ottenere'}`} aria-hidden="true">
        <ProvidedArtwork id={earned ? gymMedalArtwork.get(id) ?? 'medal-empty' : 'medal-empty'} />
      </span>
    })}
  </div>
}

export function ReferenceMainMenu({playerId,onAuxiliary,onNavigate,onResume}:Props) {
  const one = useGameStore(state=>state.giocatore1), two = useGameStore(state=>state.giocatore2)
  const position1 = useGameStore(state=>state.posizione1), position2 = useGameStore(state=>state.posizione2)
  const context = useGameStore(state=>state.challengeContext)
  const player = playerId === 1 ? one : two, other = playerId === 1 ? two : one
  const position = playerId === 1 ? position1 : position2
  const badges = (owner: typeof one) => gymMedalTrack(owner.allenatoriSconfitti).filter((id) => owner.allenatoriSconfitti.has(id)).length
  const medals = (owner: typeof one) => <MedalStrip defeated={owner.allenatoriSconfitti} />
  return <div className="ref-main-menu ref-provided-main-menu">
    <aside className="ref-trainers" aria-label="Allenatori della partita">
      <section className="ref-trainer-card is-primary" aria-label={`Riepilogo della partita di G${playerId}`}>
<div className="ref-trainer-identity">
  <div className="ref-trainer-portrait">
    <img
      src={assetUrl(`/ui/player${playerId}_avatar.png`)}
      alt=""
    />
  </div>

  <div className="ref-trainer-copy">
    <span className="pu-kicker">
      Allenatore · G{playerId}
    </span>

    <h2>{player.nome || `Giocatore ${playerId}`}</h2>

    <p>
      <KitIcon id="icon-map" />
      {(position.luogo ?? position.mappaId).replace(/_/g, ' ')}
    </p>

    {medals(player)}

    <span className="ref-medal-count">
      Medaglie {badges(player)} / {SECRET_LOCATION_GYM_IDS.length}
    </span>

    <strong className="ref-trainer-coins">
      <KitIcon id="item-coin" />
      <AnimatedNumber
        value={player.monete}
        format={formatNumber}
      />
    </strong>
  </div>
</div>
