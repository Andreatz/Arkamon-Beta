import { forwardRef, type ButtonHTMLAttributes } from 'react'
import './gameButton.css'
import './menuArtworkFallback.css'

export type GameButtonTone = 'default' | 'primary' | 'danger'
export type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: GameButtonTone }

/** Shared commands retain their labels when decorative artwork is suspended. */
export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(function GameButton(
  { tone = 'default', className = '', children, type = 'button', ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} className={`game-button ${className}`} data-menu-artwork="css" data-game-button={tone}>
    {children}
  </button>
})
