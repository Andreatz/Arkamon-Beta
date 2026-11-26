import { useEffect, useState, type CSSProperties } from 'react'
import { playSfx } from '@/utils/soundManager'
import { useGameMotionPreferences } from '@/settings/gamePreferences'
import { useGameStore } from '@store/gameStore'
import { getAllenatore } from '@data/index'
import { assetUrl } from '@/utils/assetUrl'
import type { SplashArtwork } from '@/player-ui/reference/splashArtwork'
import { splashFocusPosition } from '@/components/battle/splashFocus'
import { battleVsModel, type BattleVsSide } from './battleVsModel'
import './battleVsCard.css'

type SplashCatalog = Readonly<Record<number, SplashArtwork>>

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
  const [splashCatalog, setSplashCatalog] = useState<SplashCatalog | null>(null)
  const hasMatchup = model !== null

  // La rincorsa del suono d'incontro si chiude con il lampo bianco della scheda.
  const { speed } = useGameMotionPreferences()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => playSfx('battle.encounter', { rate: Math.min(1.6, Math.max(0.8, speed)) }), [])

  // La scheda parte subito. Il catalogo serve solo per le illustrazioni del confronto.
  useEffect(() => {
    if (!hasMatchup) return
    let current = true
    const applyCatalog = (catalog: SplashCatalog) => {
      if (current) setSplashCatalog(catalog)
    }
    void import('@/player-ui/reference/splashArtwork').then(
      ({ ARKAMON_SPLASH_ARTWORK }) => applyCatalog(ARKAMON_SPLASH_ARTWORK),
      () => applyCatalog({}),
    )
    return () => { current = false }
  }, [hasMatchup])

  return (
    <div className="battle-vs" data-battle-vs={model ? (model.wild ? 'wild' : 'trainer') : 'generic'}>
      {model && <VsSide side={model.player} placement="left" splashCatalog={splashCatalog} />}
      {model && <VsSide side={model.opponent} placement="right" splashCatalog={splashCatalog} />}
      <span className="battle-vs__seam" />
      <span className="battle-vs__flash" />
      <span className="battle-vs__emblem">{model ? 'VS' : 'Battaglia!'}</span>
    </div>
  )
}

function VsSide({ side, placement, splashCatalog }: { side: BattleVsSide; placement: 'left' | 'right'; splashCatalog: SplashCatalog | null }) {
  const artwork = splashCatalog?.[side.speciesId]
  const source = artwork ? assetUrl(artwork.src) : assetUrl(`/sprites/front_sprites/${side.speciesId}.png`)
  return (
    <div className={`battle-vs__side is-${placement}`}>
      <div className="battle-vs__art-frame">
        {splashCatalog && (
          <img className={`battle-vs__art ${artwork ? '' : 'is-sprite'}`} src={source} alt="" draggable={false}
            style={{ objectPosition: splashFocusPosition(artwork) } as CSSProperties} />
        )}
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
