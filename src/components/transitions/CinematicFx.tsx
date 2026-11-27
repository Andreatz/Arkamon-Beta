import { forwardRef, useMemo, type CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import type { CinematicKind } from './cinematicTransitions'

export type CinematicStage = 'anticipate' | 'reveal' | 'overlay'

interface CinematicFxProps {
  kind: CinematicKind
  stage: CinematicStage
  /** Punto di fuga in percentuale della scena. */
  anchor: { x: number; y: number }
  direction: { x: number; y: number }
  anticipateMs: number
  revealMs: number
  /** Raggio che copre tutto lo schermo a partire dal centro (px), per l'iride. */
  coverRadiusPx: number
}

/** Generatore deterministico: gli effetti sono uguali a ogni passaggio, come una sequenza girata. */
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0
    return state / 4294967296
  }
}

/** Nuvole attorno al punto di fuga: angolo, distanza (in cqmax, cioè rispetto alla scena), scala e variante del disegno. */
const CLOUDS = (() => {
  const random = seeded(7)
  return Array.from({ length: 11 }, (_, index) => {
    const angle = (index / 11) * Math.PI * 2 + random() * 0.5
    return { angle, distance: 26 + random() * 22, scale: 0.9 + random() * 0.9, art: 1 + (index % 3), flip: random() > 0.5, delay: random() * 0.18 }
  })
})()

/** Scintille d'oro: direzione, distanza, dimensione e ritardo. */
const SPARKS = (() => {
  const random = seeded(31)
  return Array.from({ length: 46 }, () => ({
    angle: random() * Math.PI * 2, distance: 18 + random() * 46, size: 2 + random() * 5, delay: random() * 0.25, drift: 4 + random() * 14,
  }))
})()

/** Polvere che sale lentamente nella luce. */
const DUST = (() => {
  const random = seeded(53)
  return Array.from({ length: 34 }, () => ({ x: random() * 100, y: 40 + random() * 70, size: 1.5 + random() * 3.5, delay: random() * 0.5, rise: 18 + random() * 30 }))
})()

/**
 * Livello degli effetti delle transizioni cinematografiche. Sta sopra la scena e, durante la
 * View Transition, ha un proprio nome (`arka-tx-fx`): resta vivo sopra entrambe le scene,
 * così nuvole e particelle proseguono senza scatti mentre una scena lascia il posto all'altra.
 */
export const CinematicFx = forwardRef<HTMLDivElement, CinematicFxProps>(function CinematicFx(
  { kind, stage, anchor, direction, anticipateMs, revealMs, coverRadiusPx }, ref,
) {
  const style = {
    '--fx-x': `${anchor.x}%`,
    '--fx-y': `${anchor.y}%`,
    '--fx-dx': direction.x,
    '--fx-dy': direction.y,
    '--fx-angle': `${Math.atan2(direction.y, direction.x)}rad`,
    '--fx-ant': `${Math.max(1, anticipateMs)}ms`,
    '--fx-rev': `${Math.max(1, revealMs)}ms`,
    '--fx-rmax': `${Math.round(coverRadiusPx)}px`,
  } as CSSProperties
  const clouds = kind === 'sky-dive' || kind === 'sky-rise'
  const sparks = kind === 'gold-burst'
  const dust = kind === 'radiance' || kind === 'gold-burst' || kind === 'golden-iris'
  const cloudArt = useMemo(() => [1, 2, 3].map((index) => `url("${assetUrl(`ui/transitions/cloud-${index}.webp`)}")`), [])

  return <div ref={ref} className="arka-cfx" data-cfx-kind={kind} data-cfx-stage={stage} data-scene-transition={`cinematic-${stage}`} style={style} aria-hidden="true">
    <div className="arka-cfx__vignette" />
    {clouds && <div className="arka-cfx__clouds">
      {CLOUDS.map((cloud, index) => <span key={index} className="arka-cfx__cloud" style={{
        '--c-x': `${Math.cos(cloud.angle) * cloud.distance}cqmax`,
        '--c-y': `${Math.sin(cloud.angle) * cloud.distance * 0.7}cqmax`,
        '--c-s': cloud.scale,
        '--c-flip': cloud.flip ? -1 : 1,
        '--c-delay': cloud.delay,
        backgroundImage: cloudArt[cloud.art - 1],
      } as CSSProperties} />)}
    </div>}
    {kind === 'sky-dive' && <div className="arka-cfx__ring" />}
    {kind === 'whip' && <div className="arka-cfx__streaks" />}
    {kind === 'encounter' && <>
      <div className="arka-cfx__flash" />
      <div className="arka-cfx__spiral" />
      <div className="arka-cfx__core" />
    </>}
    {(kind === 'radiance' || kind === 'gold-burst') && <>
      <div className="arka-cfx__bloom" />
      <div className="arka-cfx__rays" />
    </>}
    {kind === 'golden-iris' && <div className="arka-cfx__iris-ring" />}
    {kind === 'curtain' && <><div className="arka-cfx__bar is-top" /><div className="arka-cfx__bar is-bottom" /></>}
    {kind === 'dissolve' && <div className="arka-cfx__sheen" />}
    {sparks && <div className="arka-cfx__sparks">
      {SPARKS.map((spark, index) => <span key={index} className="arka-cfx__spark" style={{
        '--s-x': `${Math.cos(spark.angle) * spark.distance}cqmin`,
        '--s-y': `${Math.sin(spark.angle) * spark.distance}cqmin`,
        '--s-size': `${spark.size}px`,
        '--s-delay': spark.delay,
        '--s-drift': `${spark.drift}cqmin`,
      } as CSSProperties} />)}
    </div>}
    {dust && <div className="arka-cfx__dust">
      {DUST.map((mote, index) => <span key={index} className="arka-cfx__mote" style={{
        left: `${mote.x}%`, top: `${mote.y}%`, '--m-size': `${mote.size}px`, '--m-delay': mote.delay, '--m-rise': `${mote.rise}cqh`,
      } as CSSProperties} />)}
    </div>}
  </div>
})
