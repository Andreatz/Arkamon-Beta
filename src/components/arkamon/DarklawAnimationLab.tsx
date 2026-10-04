import { useEffect, useState, type CSSProperties } from 'react'
import { BATTLE_BG_DEFAULT } from '@/data/backgrounds'
import { ArkamonBattleSprite } from './ArkamonBattleSprite'
import type { ArkamonBattleAnimation, ArkamonSpriteSide } from './arkamonAnimationManifest'
import './darklawAnimationLab.css'

type PreviewBackground = 'battle' | 'checker' | 'light' | 'dark'

type PreviewRun = {
  animation: ArkamonBattleAnimation
  id: number
  sequenceIndex: number | null
}

const ACTIONS: { animation: ArkamonBattleAnimation; label: string; description: string }[] = [
  { animation: 'idle', label: 'Attesa', description: 'Il respiro e il movimento leggero della posa.' },
  { animation: 'physical', label: 'Attacco fisico', description: 'Scatto in avanti, poi ritorno alla posa di attesa.' },
  { animation: 'special', label: 'Attacco speciale', description: 'Carica luminosa, poi ritorno alla posa di attesa.' },
  { animation: 'hit', label: 'Colpito', description: 'Reazione al colpo, poi ritorno alla posa di attesa.' },
  { animation: 'ko', label: 'KO', description: 'La posa resta in KO. Premi Attesa per riprendere.' },
  { animation: 'victory', label: 'Vittoria', description: 'Un breve festeggiamento, poi ritorno alla posa di attesa.' },
]

const ACTION_DURATION_MS: Record<ArkamonBattleAnimation, number> = {
  idle: 2100,
  physical: 1100,
  special: 1400,
  hit: 1000,
  ko: 1000,
  victory: 2100,
}

const ACTION_SEQUENCE: ArkamonBattleAnimation[] = ['idle', 'physical', 'special', 'hit', 'victory', 'ko']

/** A development-only comparison using the same sprite renderer as battle. */
export function DarklawAnimationLab() {
  const [background, setBackground] = useState<PreviewBackground>('battle')
  const [scale, setScale] = useState(1)
  const [side, setSide] = useState<ArkamonSpriteSide>('front')
  const [run, setRun] = useState<PreviewRun>({ animation: 'idle', id: 0, sequenceIndex: null })
  const playingSequence = run.sequenceIndex !== null
  const currentAction = ACTIONS.find((action) => action.animation === run.animation) ?? ACTIONS[0]

  useEffect(() => {
    if (run.sequenceIndex !== null) {
      const nextIndex = run.sequenceIndex + 1
      if (nextIndex >= ACTION_SEQUENCE.length) return
      const timer = window.setTimeout(() => {
        setRun((current) => ({
          animation: ACTION_SEQUENCE[nextIndex],
          id: current.id + 1,
          sequenceIndex: nextIndex === ACTION_SEQUENCE.length - 1 ? null : nextIndex,
        }))
      }, ACTION_DURATION_MS[run.animation])
      return () => window.clearTimeout(timer)
    }

    if (run.animation === 'idle' || run.animation === 'ko') return
    const timer = window.setTimeout(() => {
      setRun((current) => ({ animation: 'idle', id: current.id + 1, sequenceIndex: null }))
    }, ACTION_DURATION_MS[run.animation])
    return () => window.clearTimeout(timer)
  }, [run.animation, run.id, run.sequenceIndex])

  const playAction = (animation: ArkamonBattleAnimation) => {
    setRun((current) => ({ animation, id: current.id + 1, sequenceIndex: null }))
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
    <main className="darklaw-lab" data-darklaw-lab="true">
      <div className="darklaw-lab__content">
        <header className="darklaw-lab__header">
          <div>
            <p className="darklaw-lab__eyebrow">Arkamon · Anteprima animazione</p>
            <h1>Darklaw prende vita<span aria-hidden="true">.</span></h1>
            <p className="darklaw-lab__intro">Confronta la posa originale con il nuovo movimento di attesa, poi prova le azioni di battaglia.</p>
          </div>
          <a className="darklaw-lab__back" href={`${window.location.pathname}${window.location.search}`}>Torna al gioco <span aria-hidden="true">↗</span></a>
        </header>

        <section className="darklaw-lab__settings" aria-label="Impostazioni dell’anteprima">
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
          <p className="darklaw-lab__settings-note">{side === 'front' ? 'Stessa dimensione di visualizzazione.' : 'Il retro usa lo sprite statico esistente.'}</p>
        </section>

        <div className="darklaw-lab__comparison" data-preview-side={side} data-preview-background={background} data-preview-scale={scale}>
          <section className="darklaw-lab__card" aria-labelledby="darklaw-static-title">
            <div className="darklaw-lab__card-heading">
              <div><p className="darklaw-lab__card-kicker">Riferimento</p><h2 id="darklaw-static-title">Posa originale</h2></div>
              <span className="darklaw-lab__badge">Statico</span>
            </div>
            <div className={`darklaw-lab__stage darklaw-lab__stage--${background}`} style={stageStyle} data-preview-card="static">
              <span className="darklaw-lab__stage-caption">Darklaw <span aria-hidden="true">/</span> {side === 'front' ? 'Frontale' : 'Retro'}</span>
              <div className="darklaw-lab__sprite-slot" role="img" aria-label={`Darklaw, posa originale ${side === 'front' ? 'frontale' : 'di retro'}`}>
                <ArkamonBattleSprite speciesId={5} name="Darklaw" side={side} animation="idle" animationEnabled={false} scale={scale} className="darklaw-lab__sprite" />
              </div>
              <span className="darklaw-lab__baseline" aria-hidden="true" />
            </div>
            <p className="darklaw-lab__card-note">La posa di riferimento resta ferma per facilitare il confronto.</p>
          </section>

          <section className="darklaw-lab__card darklaw-lab__card--animated" aria-labelledby="darklaw-animated-title">
            <div className="darklaw-lab__card-heading">
              <div><p className="darklaw-lab__card-kicker">Anteprima</p><h2 id="darklaw-animated-title">{side === 'front' ? 'Nuovo movimento' : 'Retro esistente'}</h2></div>
              <span className="darklaw-lab__badge darklaw-lab__badge--active">{side === 'front' ? currentAction.label : 'Statico'}</span>
            </div>
            <div className={`darklaw-lab__stage darklaw-lab__stage--${background}`} style={stageStyle} data-preview-card="animated" data-preview-animation={run.animation}>
              <span className="darklaw-lab__stage-caption">Darklaw <span aria-hidden="true">/</span> {side === 'front' ? 'Frontale' : 'Retro'}</span>
              <div className="darklaw-lab__sprite-slot" role="img" aria-label={`Darklaw ${side === 'front' ? `animato, ${currentAction.label}` : 'di retro, sprite statico esistente'}`}>
                <ArkamonBattleSprite key={side} speciesId={5} name="Darklaw" side={side} animation={run.animation} animationEnabled={side === 'front'} replayKey={run.id} scale={scale} className="darklaw-lab__sprite" />
              </div>
              <span className="darklaw-lab__baseline" aria-hidden="true" />
            </div>
            <p className="darklaw-lab__card-note">{side === 'front' ? 'Il movimento di attesa continua durante le azioni di battaglia.' : 'Questa prova riguarda il frontale. Il retro conserva la posa originale.'}</p>
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

        <footer className="darklaw-lab__footer"><span className="darklaw-lab__prototype">Prototipo</span><p>Anteprima disponibile solo in sviluppo. I comandi di questa pagina non modificano la partita.</p></footer>
      </div>
    </main>
  )
}
