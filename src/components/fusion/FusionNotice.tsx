import { useGameStore } from '@/store/gameStore'
import { CreaturePortrait } from '@/player-ui/kit'
import { GameButton } from '@/components/ui/GameButton'
import './fusionNotice.css'

/** Annuncio della fusione di Axolux: le due creature si uniscono nella forma «(luce)». */
export function FusionNotice() {
  const notices = useGameStore(state => state.avvisoFusione)
  const close = useGameStore(state => state.chiudiAvvisoFusione)
  const notice = notices?.[0]
  if (!notice) return null
  const next = () => {
    const rest = notices!.slice(1)
    if (rest.length) useGameStore.setState({ avvisoFusione: rest })
    else close()
  }
  return <div className="fusion-notice-backdrop">
    <section role="alertdialog" aria-modal="true" aria-labelledby="fusion-notice-title" className="fusion-notice">
      <h2 id="fusion-notice-title">Fusione di luce</h2>
      <div className="fusion-notice-stage" aria-hidden="true">
        <span className="fusion-notice-creature is-axolux"><CreaturePortrait pokemon={notice.axolux} large /></span>
        <span className="fusion-notice-creature is-partner"><CreaturePortrait pokemon={notice.prima} large /></span>
        <span className="fusion-notice-burst" />
        <span className="fusion-notice-creature is-result"><CreaturePortrait pokemon={notice.dopo} large /></span>
      </div>
      <p>{notice.messaggio}</p>
      <GameButton tone="primary" onClick={next} autoFocus>{notices!.length > 1 ? 'Avanti' : 'Fantastico!'}</GameButton>
    </section>
  </div>
}
