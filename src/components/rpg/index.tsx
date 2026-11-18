import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react'
import './rpg.css'
import '../ui/menuArtworkFallback.css'


export const RpgWindow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function RpgWindow({ children, className = '', ...props }, ref) {
  return <div {...props} ref={ref} className={`rpg-window ${className}`} data-menu-artwork="css">{children}</div>
})
export const RpgCommand = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'primary' | 'danger'; selected?: boolean }>(function RpgCommand({ children, className = '', tone = 'default', selected = false, type = 'button', ...props }, ref) {
  const emphasized = selected || tone === 'primary'
  return <button {...props} ref={ref} type={type} className={`rpg-command ${className}`} data-menu-artwork="css" data-game-button={tone} data-tone={tone} data-selected={emphasized || undefined}>{emphasized && <span className="rpg-command-cursor" aria-hidden="true">▸</span>}{children}</button>
})

export function RpgMeter({ value, max, label, className = '' }: { value: number; max: number; label: string; className?: string }) {
  const safeMax = Math.max(1, max), safeValue = Math.max(0, Math.min(value, safeMax))
  return <div className={`rpg-meter ${className}`} data-condition={safeValue === 0 ? 'ko' : safeValue / safeMax <= .25 ? 'low' : safeValue / safeMax <= .5 ? 'medium' : 'high'}><progress value={safeValue} max={safeMax} aria-label={label} /><span>{safeValue} / {max}</span></div>
}
