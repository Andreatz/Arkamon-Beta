import type { CSSProperties } from 'react'
import { useGameStore } from '@store/gameStore'
import { getAllenatore } from '@data/index'
import { assetUrl } from '@/utils/assetUrl'
import { getSplashArtwork } from '@/player-ui/reference/splashArtwork'
import { splashFocusPosition } from '@/components/battle/splashFocus'
import { battleVsModel, type BattleVsSide } from './battleVsModel'
import './battleVsCard.css'

/**
 * Scheda VS composta dal vivo all'ingresso in battaglia: i due lati entrano in
 * diagonale con l'illustrazione del primo Arkamon, poi il "VS" cala al centro.
 * I tempi sono frazioni di `--scene-dice-ms`, quindi seguono la velocità.
 */
export function BattleVsCard() {
  const battle = useGameStore((state) => state.battaglia)
  const activeId = useGameStore((state) => state.giocatoreAttivo)
  const playerName = useGameStore((state) => (activeId === 2 ? state.giocatore2.nome : state.giocatore1.nome))
  const model = battleVsModel(battle, playerName, `Giocatore ${activeId}`, getAllenatore)
  return (
    <div className="battle-vs" data-battle-vs={model ? (model.wild ? 'wild' : 'trainer') : 'generic'}>
      {model && <VsSide side={model.player} placement="left" />}
      {model && <VsSide side={model.opponent} placement="right" />}
      <span className="battle-vs__seam" />
      <span className="battle-vs__flash" />
      <span className="battle-vs__emblem">{model ? 'VS' : 'Battaglia!'}</span>
    </div>
  )
}

function VsSide({ side, placement }: { side: BattleVsSide; placement: 'left' | 'right' }) {
  const artwork = getSplashArtwork(side.speciesId)
  const source = artwork ? assetUrl(artwork.src) : assetUrl(`/sprites/front_sprites/${side.speciesId}.png`)
  return (
    <div className={`battle-vs__side is-${placement}`}>
      <div className="battle-vs__art-frame">
        <img className={`battle-vs__art ${artwork ? '' : 'is-sprite'}`} src={source} alt="" draggable={false}
          style={{ objectPosition: splashFocusPosition(artwork) } as CSSProperties} />
      </div>
      <div className="battle-vs__plate">
        <span className="battle-vs__kicker">{side.kicker}</span>
        <span className="battle-vs__name">{side.name}</span>
        {/* Per un selvatico il nome è già quello della specie: basta il livello. */}
        <span className="battle-vs__pokemon">{side.name === side.pokemonName ? `Lv. ${side.level}` : `${side.pokemonName} · Lv. ${side.level}`}</span>
      </div>
    </div>
  )
}
