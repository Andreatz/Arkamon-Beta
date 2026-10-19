import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import { RpgFrame } from '@/components/rpg'
import './gameButton.css'

export type GameButtonTone = 'default' | 'primary' | 'danger'
export type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: GameButtonTone }

/** Le stesse cornici SVG del menù, senza caricare le schermate del giocatore. */
export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(function GameButton(
  { tone = 'default', className = '', children, type = 'button', ...props }, ref,
) {
  const style: CSSProperties = {
    borderImageSource: `url("${assetUrl('/ui/player-kit/command-cancel.svg')}")`,
    borderImageSlice: '42 fill',
  }
  return <button {...props} ref={ref} type={type} className={`game-button ${className}`} data-game-button={tone}>
    {tone === 'danger' ? <span className="game-button-frame" style={style} data-kit="command-cancel" data-ui-skin-slot="frame" aria-hidden="true" />
      : <RpgFrame className="game-button-frame" kind={tone === 'primary' ? 'selected' : 'command'} />}
    {children}
  </button>
})
