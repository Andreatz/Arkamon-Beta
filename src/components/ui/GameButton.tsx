import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import './gameButton.css'

export type GameButtonTone = 'default' | 'primary' | 'danger'
export type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: GameButtonTone }

const frames = {
  default: { asset: 'button-default', slice: 48 },
  primary: { asset: 'button-primary', slice: 44 },
  danger: { asset: 'command-cancel', slice: 42 },
} as const

/** Le stesse cornici SVG del menù, senza caricare le schermate del giocatore. */
export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(function GameButton(
  { tone = 'default', className = '', children, type = 'button', ...props }, ref,
) {
  const frame = frames[tone]
  const style: CSSProperties = {
    borderImageSource: `url("${assetUrl(`/ui/player-kit/${frame.asset}.svg`)}")`,
    borderImageSlice: `${frame.slice} fill`,
  }
  return <button {...props} ref={ref} type={type} className={`game-button ${className}`} data-game-button={tone}>
    <span className="game-button-frame" style={style} data-kit={frame.asset} aria-hidden="true" />
    {children}
  </button>
})
