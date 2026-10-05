import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { getPokemon } from '@/data'
import { BATTLE_BG_DEFAULT } from '@/data/backgrounds'
import { ArkamonAttackPreview } from './ArkamonAttackPreview'
import { ArkamonBattleSprite } from './ArkamonBattleSprite'
import { ARKAMON_ANIMATION_MANIFEST, getArkamonAnimationAsset, type ArkamonBattleAnimation, type ArkamonSpriteSide } from './arkamonAnimationManifest'
import './darklawAnimationLab.css'

type PreviewBackground = 'battle' | 'checker' | 'light' | 'dark'

type PreviewRun = {
  animation: ArkamonBattleAnimation
  id: number
  sequenceIndex: number | null
}

const ACTIONS: { animation: ArkamonBattleAnimation; label: string; description: string }[] = [
  { animation: 'idle', label: 'Attesa', description: 'Il respiro e il movimento leggero della posa.' },
  { animation: 'attack', label: 'Attacco', description: 'Il filmato di attacco si completa, poi riprende l’attesa.' },
  { animation: 'hit', label: 'Colpito', description: 'La reazione al colpo si completa, poi riprende l’attesa.' },
  { animation: 'ko', label: 'KO', description: 'La caduta e la dissoluzione si completano. Premi Attesa per riprendere.' },
  { animation: 'victory', label: 'Vittoria', description: 'Il festeggiamento si completa, poi riprende l’attesa.' },
]

const ANIMATED_SPECIES = Object.keys(ARKAMON_ANIMATION_MANIFEST)
  .map(Number)
  .filter((id) => ARKAMON_ANIMATION_MANIFEST[id]?.front?.idle)
  .sort((a, b) => a - b)

const ACTION_SEQUENCE: ArkamonBattleAnimation[] = ['idle', 'attack', 'hit', 'victory', 'ko']

/** A development-only comparison using the same sprite renderer as battle. */
export function DarklawAnimationLab() {
  const [speciesId, setSpeciesId] = useState(ANIMATED_SPECIES[0] ?? 5)
  const speciesName = getPokemon(speciesId)?.nome ?? `Arkamon #${speciesId}`
  const [background, setBackground] = useState<PreviewBackground>('battle')
  const [scale, setScale] = useState(1)
  const [side, setSide] = useState<ArkamonSpriteSide>('front')
  const [run, setRun] = useState<PreviewRun>({ animation: 'idle', id: 0, sequenceIndex: null })
  const playingSequence = run.sequenceIndex !== null
  const currentAction = ACTIONS.find((action) => action.animation === run.animation) ?? ACTIONS[0]
  const previewAsset = getArkamonAnimationAsset(speciesId, 'front', run.animation)
  const viewport = previewAsset?.viewport
  const canvasCenter = viewport ? viewport.left + viewport.width / 2 : 0
  const canvasWidthFactor = side === 'front' && previewAsset && viewport
    ? 2 * Math.max(canvasCenter, previewAsset.frameWidth - canvasCenter) / viewport.width
    : 1
  const canvasVerticalCenter = viewport ? viewport.top + viewport.height / 2 : 0
  const canvasHeightFactor = side === 'front' && previewAsset && viewport
    ? 2 * Math.max(canvasVerticalCenter, previewAsset.frameHeight - canvasVerticalCenter) / viewport.height
    : 1
  const comparisonStyle = {
    '--darklaw-preview-scale': scale,
    '--darklaw-canvas-width-factor': canvasWidthFactor,
    '--darklaw-canvas-height-factor': canvasHeightFactor,
    '--darklaw-scale-origin-offset': Math.abs(scale - 1),
  } as CSSProperties

  useEffect(() => {
    if (run.animation !== 'idle' || run.sequenceIndex !== 0) return
    const idle = getArkamonAnimationAsset(speciesId, 'front', 'idle')
    if (!idle) return
    const durationMs = idle.durationMs ?? idle.frameCount / idle.fps * 1000
    const timer = window.setTimeout(() => {
      setRun((current) => current.id !== run.id ? current : {
        animation: ACTION_SEQUENCE[1], id: current.id + 1, sequenceIndex: 1,
      })
    }, durationMs)
    return () => window.clearTimeout(timer)
  }, [run.animation, run.id, run.sequenceIndex, speciesId])

  const onAnimationComplete = useCallback((animation: ArkamonBattleAnimation, replayKey: number) => {
    setRun((current) => {
      if (current.id !== replayKey || current.animation !== animation || animation === 'idle') return current
      if (current.sequenceIndex !== null) {
        const nextIndex = current.sequenceIndex + 1
        return nextIndex < ACTION_SEQUENCE.length
          ? { animation: ACTION_SEQUENCE[nextIndex], id: current.id + 1, sequenceIndex: nextIndex }
          : { ...current, sequenceIndex: null }
      }
      return animation === 'ko' ? current : { animation: 'idle', id: current.id + 1, sequenceIndex: null }
    })
  }, [])

  const playAction = (animation: ArkamonBattleAnimation) => {
    setRun((current) => ({ animation, id: current.id + 1, sequenceIndex: null }))
  }

  const selectSpecies = (nextSpeciesId: number) => {
    setSpeciesId(nextSpeciesId)
    playAction('idle')
  }

  const selectSide = (nextSide: ArkamonSpriteSide) => {
    setSide(nextSide)
    playAction('idle')
  }

  const playSequence = () => {
    setRun((current) => ({ animation: 'idle', id: current.id + 1, sequenceIndex: 0 }))
  }

  const stageStyle: CSSProperties | undefined = background === 'battle'
    ? { backgroundImage: `url("${BATTLE_BG_DEFAULT}")` }
    : undefined

  return (
    <main className="darklaw-lab" data-darklaw-lab="true" data-preview-species={speciesId}>
      <div className="darklaw-lab__content">
        <header className="darklaw-lab__header">
          <div>
            <p className="darklaw-lab__eyebrow">Arkamon · Anteprima animazione</p>
            <h1>{speciesName} prende vita<span aria-hidden="true">.</span></h1>
            <p className="darklaw-lab__intro">Confronta la posa originale con i nuovi filmati di {speciesName}: attesa, attacco, colpito, vittoria e KO.</p>
          </div>
          <a className="darklaw-lab__back" href={`${window.location.pathname}${window.location.search}`}>Torna al gioco <span aria-hidden="true">↗</span></a>
        </header>

        <section className="darklaw-lab__settings" aria-label="Impostazioni dell’anteprima">
          <label htmlFor="darklaw-preview-species">
            <span>Arkamon</span>
            <select id="darklaw-preview-species" value={speciesId} onChange={(event) => selectSpecies(Number(event.target.value))}>
              {ANIMATED_SPECIES.map((id) => <option key={id} value={id}>#{id} · {getPokemon(id)?.nome ?? 'Arkamon'}</option>)}
            </select>
          </label>
          <label htmlFor="darklaw-preview-background">
            <span>Sfondo</span>
            <select id="darklaw-preview-background" value={background} onChange={(event) => setBackground(event.target.value as PreviewBackground)}>
              <option value="battle">Battaglia</option>
              <option value="checker">Scacchiera</option>
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
            </select>
          </label>
          <label htmlFor="darklaw-preview-scale">
            <span>Dimensione</span>
            <select id="darklaw-preview-scale" value={scale} onChange={(event) => setScale(Number(event.target.value))}>
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.25}>125%</option>
              <option value={1.5}>150%</option>
            </select>
          </label>
          <fieldset className="darklaw-lab__side">
            <legend>Vista</legend>
            <div className="darklaw-lab__segmented">
              <button type="button" aria-pressed={side === 'front'} onClick={() => selectSide('front')}>Frontale</button>
              <button type="button" aria-pressed={side === 'back'} onClick={() => selectSide('back')}>Retro</button>
            </div>
          </fieldset>
          <p className="darklaw-lab__settings-note">{side === 'front' ? 'Stessa dimensione di visualizzazione, limitata allo spazio disponibile.' : 'Il retro usa lo sprite statico esistente.'}</p>
        </section>

        <div className="darklaw-lab__comparison" style={comparisonStyle} data-preview-side={side} data-preview-background={background} data-preview-scale={scale}>
          <section className="darklaw-lab__card" aria-labelledby="darklaw-static-title">
            <div className="darklaw-lab__card-heading">
              <div><p className="darklaw-lab__card-kicker">Riferimento</p><h2 id="darklaw-static-title">Posa originale</h2></div>
              <span className="darklaw-lab__badge">Statico</span>
            </div>
            <div className={`darklaw-lab__stage darklaw-lab__stage--${background}`} style={stageStyle} data-preview-card="static">
              <span className="darklaw-lab__stage-caption">{speciesName} <span aria-hidden="true">/</span> {side === 'front' ? 'Frontale' : 'Retro'}</span>
              <div className="darklaw-lab__sprite-slot" role="img" aria-label={`${speciesName}, posa originale ${side === 'front' ? 'frontale' : 'di retro'}`}>
                <ArkamonBattleSprite speciesId={speciesId} name={speciesName} side={side} animation="idle" animationEnabled={false} scale={scale} className="darklaw-lab__sprite" />
              </div>
            </div>
            <p className="darklaw-lab__card-note">La posa di riferimento resta ferma per facilitare il confronto.</p>
          </section>

          <section className="darklaw-lab__card darklaw-lab__card--animated" aria-labelledby="darklaw-animated-title">
            <div className="darklaw-lab__card-heading">
              <div><p className="darklaw-lab__card-kicker">Anteprima</p><h2 id="darklaw-animated-title">{side === 'front' ? 'Nuovo movimento' : 'Retro esistente'}</h2></div>
              <span className="darklaw-lab__badge darklaw-lab__badge--active">{side === 'front' ? currentAction.label : 'Statico'}</span>
            </div>
            <div className={`darklaw-lab__stage darklaw-lab__stage--${background}`} style={stageStyle} data-preview-card="animated" data-preview-animation={run.animation}>
              <span className="darklaw-lab__stage-caption">{speciesName} <span aria-hidden="true">/</span> {side === 'front' ? 'Frontale' : 'Retro'}</span>
              <div className="darklaw-lab__sprite-slot" role="img" aria-label={`${speciesName} ${side === 'front' ? `animato, ${currentAction.label}` : 'di retro, sprite statico esistente'}`}>
                <ArkamonBattleSprite key={`${speciesId}-${side}`} speciesId={speciesId} name={speciesName} side={side} animation={run.animation} animationEnabled={side === 'front'} replayKey={run.id} finishActionBeforeIdle={false} onAnimationComplete={onAnimationComplete} scale={scale} className="darklaw-lab__sprite" />
              </div>
            </div>
            <p className="darklaw-lab__card-note">{side === 'front' ? 'Ogni azione riproduce il filmato completo. Il KO mantiene l’esito della dissoluzione.' : 'Questa prova riguarda il frontale. Il retro conserva la posa originale.'}</p>
          </section>
        </div>

        <section className="darklaw-lab__actions" aria-labelledby="darklaw-actions-title">
          <div className="darklaw-lab__actions-heading">
            <div><p className="darklaw-lab__card-kicker">Prova il movimento</p><h2 id="darklaw-actions-title">Azioni di battaglia</h2></div>
            <button type="button" className="darklaw-lab__play" onClick={playSequence} disabled={side === 'back'}>
              <span aria-hidden="true">▶</span> {playingSequence ? 'Ricomincia la sequenza' : 'Prova la sequenza'}
            </button>
          </div>
          <div className="darklaw-lab__action-buttons" aria-label="Scegli un’azione">
            {ACTIONS.map((action) => (
              <button key={action.animation} type="button" aria-pressed={run.animation === action.animation} disabled={side === 'back' && action.animation !== 'idle'} onClick={() => playAction(action.animation)}>
                {action.label}
              </button>
            ))}
          </div>
          <p className="darklaw-lab__status" role="status" aria-live="polite">
            {side === 'back' ? 'Vista di retro statica. Scegli Frontale per provare il movimento.' : playingSequence ? `Sequenza in corso: ${currentAction.label}. Scegli un’azione per interromperla.` : currentAction.description}
          </p>
        </section>

        <ArkamonAttackPreview key={speciesId} speciesId={speciesId} stageStyle={stageStyle} background={background} />

        <footer className="darklaw-lab__footer"><span className="darklaw-lab__prototype">Prototipo</span><p>Anteprima disponibile solo in sviluppo. I comandi di questa pagina non modificano la partita.</p></footer>
      </div>
    </main>
  )
}
